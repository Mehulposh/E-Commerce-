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

## 🔜 What's Next (Phase 2)

- Order Service
- Payment simulation
- Inter-service REST calls (Product → Auth, Order → Product)
