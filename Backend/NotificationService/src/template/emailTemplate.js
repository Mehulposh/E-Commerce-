/**
 * Email Templates
 * Returns { subject, html, text } for each event type
 */

const storeName = process.env.EMAIL_FROM_NAME || 'YourStore';

const templates = {
  /**
   * Payment succeeded → Order confirmed
   */
  'payment.succeeded': ({ orderNumber, amount, currency, items, shippingAddress }) => ({
    subject: `✅ Order Confirmed — ${orderNumber}`,
    text: `Your order ${orderNumber} has been confirmed. Total: ${currency} ${amount}. Thank you for shopping with ${storeName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4CAF50; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0;">✅ Order Confirmed!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p style="font-size: 16px;">Thank you for your order! Your payment was successful.</p>
          
          <div style="background: white; border: 1px solid #eee; border-radius: 6px; padding: 15px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">Order Details</h3>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Total Amount:</strong> ${currency} ${Number(amount).toFixed(2)}</p>
          </div>

          ${items && items.length ? `
          <div style="background: white; border: 1px solid #eee; border-radius: 6px; padding: 15px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Item</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">Qty</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                    <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${currency} ${Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${shippingAddress ? `
          <div style="background: white; border: 1px solid #eee; border-radius: 6px; padding: 15px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">Shipping To</h3>
            <p style="margin: 0;">
              ${shippingAddress.street}<br/>
              ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}<br/>
              ${shippingAddress.country}
            </p>
          </div>
          ` : ''}

          <p style="color: #666; font-size: 14px;">We'll notify you when your order ships.</p>
        </div>
        <div style="text-align: center; padding: 15px; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} ${storeName}. All rights reserved.
        </div>
      </div>
    `,
  }),

  /**
   * Payment failed → Order cancelled
   */
  'payment.failed': ({ orderNumber, amount, currency, reason }) => ({
    subject: `❌ Payment Failed — ${orderNumber}`,
    text: `Unfortunately, your payment for order ${orderNumber} (${currency} ${amount}) failed. Reason: ${reason || 'Unknown'}. Please try again.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f44336; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0;">❌ Payment Failed</h1>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p style="font-size: 16px;">We're sorry, your payment could not be processed.</p>

          <div style="background: white; border: 1px solid #eee; border-radius: 6px; padding: 15px; margin: 15px 0;">
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Amount:</strong> ${currency} ${Number(amount).toFixed(2)}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>

          <p>Please check your payment details and try placing your order again.</p>
          <p style="color: #666; font-size: 14px;">If you continue to experience issues, please contact our support team.</p>
        </div>
        <div style="text-align: center; padding: 15px; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} ${storeName}. All rights reserved.
        </div>
      </div>
    `,
  }),

  /**
   * Payment refunded
   */
  'payment.refunded': ({ orderNumber, refundAmount, currency }) => ({
    subject: `💰 Refund Processed — ${orderNumber}`,
    text: `Your refund of ${currency} ${refundAmount} for order ${orderNumber} has been processed. It may take 3-5 business days to appear.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2196F3; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0;">💰 Refund Processed</h1>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p style="font-size: 16px;">Your refund has been successfully processed.</p>

          <div style="background: white; border: 1px solid #eee; border-radius: 6px; padding: 15px; margin: 15px 0;">
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Refund Amount:</strong> ${currency} ${Number(refundAmount).toFixed(2)}</p>
          </div>

          <p>Please allow <strong>3-5 business days</strong> for the refund to appear in your account.</p>
        </div>
        <div style="text-align: center; padding: 15px; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} ${storeName}. All rights reserved.
        </div>
      </div>
    `,
  }),
};

const getTemplate = (event, data) => {
  const templateFn = templates[event];
  if (!templateFn) {
    return {
      subject: `Notification: ${event}`,
      text: `An event occurred: ${event}`,
      html: `<p>An event occurred: <strong>${event}</strong></p>`,
    };
  }
  return templateFn(data);
};

export default  getTemplate ;