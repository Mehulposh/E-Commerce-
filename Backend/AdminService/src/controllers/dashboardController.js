import axios from "axios";
import { getOrders, getPayments , getProducts, getUsers } from "../service/serviceClient";
import { subDays, format, parseISO } from 'date-fns';


//GET api/admin/dashboard
const DashboardStats = async (req,res,next) => {
    try {
        const token = req.header.authorization.split(' ')[1]

        //Fetch from all services in parallell
        const [orderRes , paymentRes , productRes , userRes ] = await Promise.allSettled([
            getOrders(token,'?limit=1000'),
            getPayments(token,'?limit=1000'),
            getProducts(token,'?limit=1000'),
            getUsers(token)
        ])

        const orders = orderRes.status === 'fulfilled' ? orderRes.value.data.orders || [] : [];
        const payments = paymentRes.status === 'fulfilled' ? paymentRes.value.data.payments || [] : [];
        const products = productRes.status === 'fulfilled' ? productRes.value.data.products || [] : [];
        const users = userRes.status === 'fulfilled' ? userRes.value.data.users || [] : [];

        //Revenue stats
        const successPayments = payments.filter(p => p.status === 'succeeded');
        const totalRvenue = successPayments.reduce((sum , p) => sum + p.amount , 0);
        const refundPayment = payments.filter(p = p.status === 'refunded ')
        const totalRefund = refundPayment.reduce((sum , p) => sum + (p.refundAmount || p.amount) , 0);
        const netRevenue = totalRvenue - totalRefund

        //Order stats
        const ordersByStatus = orders.reducr((acc,o) => {
            acc[o.status] = (acc[o.status] || 0) + 1

            return acc
        })

        //Revenue by day (last 7 days)
       const last7Days = sevenDayRevenue(successPayments)


        //Top 5 products by revenue
        const productRevenue = productRevenue(orders)

        const topProducts = Object.values(productRevenue)
            .sort((a,b) => b.totalRvenue - a.totalRvenue)
            .slice(0,5)
            .map(product => ({
                ...product,
                rank : index + 1,
                totalRvenue: Number(product.totalRvenue.toFixed(2)) //Round up to 2 decimals
            })) 
        
         // ── Payment stats ─────────────────────────────────────────
        const paymentsByStatus = payments.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
        }, {});


        res.json({
            overview: {
                totalRvenue: Number(totalRvenue.toFixed(2)),
                totalRefund: Number(totalRefund.toFixed(2)),
                netRevenue: Number(netRevenue.toFixed(2)),
                totalOrders: orders.length,
                totalUsers: users.length,
                totalProducts: products.length,
                totalPayments: payments.length
            },
            orders: {
                byStatus: ordersByStatus,
                recentCount: orders.filter(O => {
                    const created = new Date(O.createdAt)
                    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
                    return created > dayAgo
                }).length
            },
            payments: {
                byStatus: paymentsByStatus,
                successRate: payments.length
                ? Nummber(((successPayments.length/payments.length) * 100).toFixed(1))
                : 0
            },

            revenueChart : last7Days,
            topProducts
        })

    } catch (error) {
        next(error)
    }
}

export default DashboardStats


function sevenDayRevenue(payments){
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const revenue = payments
            .filter(p => {
            const paymentDate = format(parseISO(p.createdAt), 'yyyy-MM-dd');
            return paymentDate === dateStr;
            })
            .reduce((sum, p) => sum + p.amount, 0);
            
        return { date: dateStr, revenue };
    });

    return last7Days
}


function productRevenue(orders) {
    const producrRevenue = []

        orders
            .filter(O => ['confirmed' , 'delivered'].includes(O.status))
            .forEach(O => {
                O.items?.forEach(item => {
                    const {productId} = item

                    //initialize if needed
                    producrRevenue[productId] ??= {
                        productId,
                        name: item.name,
                        totalRvenue : 0,
                        totalQuantity: 0
                    }

                    //Accuulate
                    producrRevenue[productId].totalRvenue += item.subTotal
                    producrRevenue[productId].totalQuantity += item.quatity
                }) 
            });

    return producrRevenue
}