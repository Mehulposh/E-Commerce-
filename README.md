# 🚀 Microservices — Phase 1

Auth + Product services connected via REST through an Nginx API Gateway.

## 🏗️ Architecture

```
Client
  │
  ▼
[ Nginx API Gateway ] :80
  ├── /api/auth/*     → Auth Service    :3001
  └── /api/products/* → Product Service :3002
                              │
                     calls Auth Service
                     to verify tokens
                              │
                         [ MongoDB ]   (shared instance, separate DBs)
                         [ Redis   ]   (Product Service caching)
```

## 📁 Project Structure

```
microservices/
├── docker-compose.yml
├── .env.example
├── nginx/
│   └── nginx.conf
├── auth-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── models/user.model.js
│       ├── controllers/auth.controller.js
│       ├── routes/auth.routes.js
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   └── error.middleware.js
│       └── utils/jwt.utils.js
└── product-service/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── index.js
        ├── config/redis.js
        ├── models/product.model.js
        ├── controllers/product.controller.js
        ├── routes/product.routes.js
        ├── middleware/
        │   ├── auth.middleware.js
        │   └── error.middleware.js
        └── utils/cache.utils.js
```

## 🚦 Quick Start

```bash
# 1. Copy env file
cp .env.example .env

# 2. Start everything
docker compose up --build

# 3. Verify health
curl http://localhost/health/auth
curl http://localhost/health/products
```

## 📡 API Reference

### Auth Service — `/api/auth`

| Method | Endpoint          | Auth | Description             |
|--------|-------------------|------|-------------------------|
| POST   | `/register`       | ❌   | Register new user        |
| POST   | `/login`          | ❌   | Login (returns tokens)   |
| POST   | `/refresh`        | ❌   | Rotate refresh token     |
| POST   | `/logout`         | ❌   | Invalidate refresh token |
| GET    | `/me`             | ✅   | Get current user         |
| POST   | `/verify`         | ✅   | Verify token (internal)  |

#### Register
```bash
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}'
```

#### Login
```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

#### Refresh Token
```bash
curl -X POST http://localhost/api/auth/refresh \
  -b cookies.txt -c cookies.txt
```

---

### Product Service — `/api/products`

| Method | Endpoint    | Auth  | Role  | Description            |
|--------|-------------|-------|-------|------------------------|
| GET    | `/`         | ❌    | -     | List products (cached) |
| GET    | `/:id`      | ❌    | -     | Get product (cached)   |
| POST   | `/`         | ✅    | admin | Create product         |
| PUT    | `/:id`      | ✅    | admin | Update product         |
| DELETE | `/:id`      | ✅    | admin | Soft-delete product    |

#### List Products (with filters)
```bash
curl "http://localhost/api/products?category=electronics&minPrice=100&page=1&limit=5"
```

#### Create Product (admin only)
```bash
curl -X POST http://localhost/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "Wireless Headphones",
    "description": "Premium noise-cancelling headphones",
    "price": 299.99,
    "category": "electronics",
    "stock": 50
  }'
```

---

## 🔐 Auth Flow

```
1. POST /api/auth/register   → returns { accessToken }  + sets refreshToken cookie
2. Use accessToken in:       Authorization: Bearer <token>
3. Token expires in 15m →   POST /api/auth/refresh      → returns new { accessToken }
4. POST /api/auth/logout     → clears refresh token cookie + DB record
```

## 🗄️ Redis Caching

- Product lists are cached for **5 minutes** (keyed by query params)
- Individual products are cached for **1 hour**
- Any write (create/update/delete) **invalidates all product cache keys**
- If Redis is down, the service **gracefully degrades** (no caching, DB queries still work)

## 🔄 Service Communication

The **Product Service** validates JWT tokens by calling the **Auth Service** at:
```
POST http://auth-service:3001/api/auth/verify
```
This keeps token verification logic centralized in Auth.

## 🐳 Docker Services

| Service         | Port | Notes                          |
|-----------------|------|--------------------------------|
| Nginx (Gateway) | 80   | Single entry point             |
| Auth Service    | 3001 | Internal only (not exposed)    |
| Product Service | 3002 | Internal only (not exposed)    |
| MongoDB         | 27017| `authdb` + `productdb`         |
| Redis           | 6379 | Product cache                  |



# 🚀 Microservices — Phase 2

Order + Payment services added on top of Phase 1 (Auth + Product).

## 🏗️ Architecture

```
Client
  │
  ▼
[ Nginx API Gateway ] :80
  ├── /api/auth/*      → Auth Service     :3001
  ├── /api/products/*  → Product Service  :3002
  ├── /api/orders/*    → Order Service    :3003
  └── /api/payments/*  → Payment Service  :3004
         │                     ▲
         │   POST /initiate     │
         └──────────────────────┘
              (internal HTTP)

[ MongoDB ]  →  authdb, productdb, orderdb, paymentdb
[ Redis    ]  →  Product cache
```

## 📁 New Structure (Phase 2 additions)

```
microservices/
├── order-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── models/order.model.js
│       ├── controllers/order.controller.js
│       ├── routes/
│       │   ├── order.routes.js
│       │   └── internal.routes.js      ← receives payment callbacks
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   └── error.middleware.js
│       └── utils/service.client.js     ← HTTP calls to other services
└── payment-service/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── index.js
        ├── models/payment.model.js
        ├── controllers/payment.controller.js
        ├── routes/payment.routes.js
        ├── middleware/
        │   ├── auth.middleware.js
        │   └── error.middleware.js
        └── utils/
            ├── payment.simulator.js    ← fake payment gateway
            └── service.client.js
```

## 🚦 Quick Start

```bash
# Start only the new Phase 2 services (Phase 1 already running)
docker compose up -d --build order-service payment-service

# Or start everything from scratch
docker compose up --build

# Verify health
curl http://localhost/health/orders
curl http://localhost/health/payments
```

## 🔁 Order → Payment Flow

```
1. POST /api/orders
      │
      ├── validates each item against Product Service
      ├── checks stock availability
      ├── creates Order (status: pending)
      │
      └── calls POST http://payment-service:3004/api/payments/initiate
                │
                ├── runs payment simulation (200-800ms delay)
                ├── saves Payment record (succeeded / failed)
                │
                └── calls back PATCH http://order-service:3003/api/orders/internal/payment-update
                          │
                          └── updates Order status → confirmed (paid) or cancelled (failed)
```

> ⚠️ The `/internal/payment-update` and `/payments/initiate` endpoints are blocked at
> Nginx and only accessible within the Docker network.

---

## 📡 API Reference

### Order Service — `/api/orders`

| Method | Endpoint          | Auth  | Role  | Description                        |
|--------|-------------------|-------|-------|------------------------------------|
| POST   | `/`               | ✅    | any   | Create order + trigger payment     |
| GET    | `/`               | ✅    | any   | List orders (own) / all (admin)    |
| GET    | `/:id`            | ✅    | any   | Get order by ID                    |
| POST   | `/:id/cancel`     | ✅    | any   | Cancel a pending/confirmed order   |
| PATCH  | `/:id/status`     | ✅    | admin | Manually update order status       |

#### Create Order
```bash
curl -X POST http://localhost/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "items": [
      { "productId": "<product_id>", "quantity": 2 }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "US"
    },
    "notes": "Leave at door"
  }'
```

#### Cancel Order
```bash
curl -X POST http://localhost/api/orders/<order_id>/cancel \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Changed my mind" }'
```

---

### Payment Service — `/api/payments`

| Method | Endpoint              | Auth  | Role  | Description                    |
|--------|-----------------------|-------|-------|--------------------------------|
| GET    | `/`                   | ✅    | any   | List payments (own / all)      |
| GET    | `/:id`                | ✅    | any   | Get payment by ID              |
| GET    | `/order/:orderId`     | ✅    | any   | Get payment for an order       |
| POST   | `/:id/refund`         | ✅    | admin | Refund a succeeded payment     |

#### Get Payment for an Order
```bash
curl http://localhost/api/payments/order/<order_id> \
  -H "Authorization: Bearer <access_token>"
```

#### Refund (admin only)
```bash
curl -X POST http://localhost/api/payments/<payment_id>/refund \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{ "amount": 100 }'
```

---

## 💳 Payment Simulator

The Payment Service uses a built-in simulator instead of a real gateway. It behaves like Stripe test mode.

**Test card numbers:**

| Card Number        | Brand      | Result              |
|--------------------|------------|---------------------|
| 4242424242424242   | Visa       | ✅ Always succeeds  |
| 4000000000000002   | Visa       | ❌ Always declined  |
| 4000000000009995   | Visa       | ❌ Insufficient funds |
| 5555555555554444   | Mastercard | ✅ Always succeeds  |
| 378282246310005    | Amex       | ✅ Always succeeds  |

**Random failure rate** is controlled by `SIMULATED_FAILURE_RATE` in `.env`:
```env
SIMULATED_FAILURE_RATE=0.1   # 10% of payments fail randomly
SIMULATED_FAILURE_RATE=0.0   # All payments succeed (good for dev)
SIMULATED_FAILURE_RATE=1.0   # All payments fail (good for testing failure path)
```

---

## 🗄️ Order Model — Status Flow

```
pending → confirmed → processing → shipped → delivered
   │
   └──→ cancelled
            │
            └──→ refunded
```

| Status      | Trigger                                      |
|-------------|----------------------------------------------|
| pending     | Order just created                           |
| confirmed   | Payment succeeded                            |
| processing  | Admin manually updates                       |
| shipped     | Admin manually updates                       |
| delivered   | Admin manually updates                       |
| cancelled   | Payment failed OR user cancels               |
| refunded    | Admin issues refund on a confirmed order     |

---

## 🗄️ Payment Model — Status Flow

```
pending → processing → succeeded
                    └→ failed
succeeded → refunded
```

---

## 🔧 .env Files

**order-service/.env**
```env
PORT=3003
MONGO_URI=mongodb://mongo:27017/orderdb
AUTH_SERVICE_URL=http://auth-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002
PAYMENT_SERVICE_URL=http://payment-service:3004
NODE_ENV=development
```

**payment-service/.env**
```env
PORT=3004
MONGO_URI=mongodb://mongo:27017/paymentdb
AUTH_SERVICE_URL=http://auth-service:3001
ORDER_SERVICE_URL=http://order-service:3003
SIMULATED_FAILURE_RATE=0.1
NODE_ENV=development
```

> Keep all service URLs exactly as shown — Docker resolves these hostnames automatically within the internal network.

---

## 🐳 Docker Services (Phase 1 + 2)

| Service         | Port  | Notes                                      |
|-----------------|-------|--------------------------------------------|
| Nginx (Gateway) | 80    | Single entry point                         |
| Auth Service    | 3001  | Internal only                              |
| Product Service | 3002  | Internal only                              |
| Order Service   | 3003  | Internal only                              |
| Payment Service | 3004  | Internal only                              |
| MongoDB         | 27017 | authdb, productdb, orderdb, paymentdb      |
| Redis           | 6379  | Product cache                              |

---

## 🔜 What's Next (Phase 3)

- Add RabbitMQ message broker
- Replace direct HTTP callbacks with async events
- `order.created` → Payment Service processes automatically
- `payment.succeeded/failed` → Order Service updates status
- `order.cancelled` → Payment Service auto-refunds
## 🔜 What's Next (Phase 2)

- Order Service
- Payment simulation
- Inter-service REST calls (Product → Auth, Order → Product)
