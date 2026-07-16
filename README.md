# Ogbeni-eat Backend

A Node.js + Express backend for the Ogbeni Eats food vendor platform.

This API currently supports:

- User authentication (register, login, profile)
- Vendor CRUD (with ownership tracking)
- Menu CRUD (with ownership checks)
- Order CRUD for the authenticated user
- **Admin API** — full CRUD for users, vendors, menus, and orders
- PostgreSQL-backed persistence through the shared `pg` pool

## Base URL

```text
http://127.0.0.1:5000/api
```

## Tech stack

- Express
- PostgreSQL via `pg`
- JWT authentication with algorithm pinning
- Helmet security headers
- Rate limiting (general + auth-specific)
- CORS with configurable origins
- TypeScript with `tsx` for development

## Environment variables

Create a `.env` file in the project root:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

> **Important:** `JWT_SECRET` is required. The server will exit if it is not set.

## Run the project

```bash
npm install
npm run dev
```

Production-style start:

```bash
npm run start
```

Type check:

```bash
npm run build
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run start` | Start production server |
| `npm run build` | Type check with TypeScript |
| `npm test` | Run test suite |
| `npm run seed` | Seed database with sample users and vendors |
| `npm run seed:admin` | Seed an admin user into the database |

## API Overview

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | No | Register a new user |
| `POST` | `/auth/login` | No | Login and receive JWT |
| `GET` | `/auth/me` | Yes | Get current user profile |

### Vendors

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/vendors` | No | List all vendors |
| `GET` | `/vendors/:id` | No | Get vendor by ID |
| `POST` | `/vendors` | Yes | Create a vendor |
| `PUT` | `/vendors/:id` | Yes | Update a vendor (owner only) |
| `DELETE` | `/vendors/:id` | Yes | Delete a vendor (owner only) |

### Menus

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/menus` | No | List all menus |
| `GET` | `/menus/:id` | No | Get menu by ID |
| `POST` | `/menus` | Yes | Create a menu item |
| `PUT` | `/menus/:id` | Yes | Update a menu (vendor owner only) |
| `DELETE` | `/menus/:id` | Yes | Delete a menu (vendor owner only) |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/orders` | Yes | List my orders |
| `GET` | `/orders/:id` | Yes | Get my order by ID |
| `POST` | `/orders` | Yes | Create an order |
| `PUT` | `/orders/:id` | Yes | Update order status (owner only) |

### Admin API 🔒🔒

All admin routes require `Authorization: Bearer <admin_token>` with `role: "admin"`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/users` | List all users |
| `GET` | `/admin/users/:id` | Get user by ID |
| `PUT` | `/admin/users/:id` | Update a user |
| `DELETE` | `/admin/users/:id` | Delete a user (non-admin only) |
| `GET` | `/admin/vendors` | List all vendors |
| `GET` | `/admin/vendors/:id` | Get vendor by ID |
| `PUT` | `/admin/vendors/:id` | Update a vendor |
| `DELETE` | `/admin/vendors/:id` | Delete a vendor |
| `GET` | `/admin/menus` | List all menus |
| `GET` | `/admin/menus/:id` | Get menu by ID |
| `PUT` | `/admin/menus/:id` | Update a menu |
| `DELETE` | `/admin/menus/:id` | Delete a menu |
| `GET` | `/admin/orders` | List all orders |
| `GET` | `/admin/orders/:id` | Get order by ID |
| `PUT` | `/admin/orders/:id` | Update order status |
| `DELETE` | `/admin/orders/:id` | Delete an order |

## Security Features

- **JWT Secret Validation** — Server exits if `JWT_SECRET` is not set
- **Algorithm Pinning** — JWT tokens use HS256 only (prevents algorithm-switching attacks)
- **Ownership Checks** — Vendors, menus, and orders can only be modified by their owners
- **Role-Based Access** — Admin routes protected by `adminOnly` middleware
- **Rate Limiting** — General (100/15min) and auth-specific (20/15min)
- **Security Headers** — Helmet middleware enabled
- **Input Validation** — Email format, password length, required fields, status enums
- **Error Sanitization** — Internal errors hidden in production
- **Body Size Limits** — 1MB max request body

## Registration

Public registration allows roles `customer` and `vendor`. The `admin` role cannot be registered publicly — admin users must be created via the seed script:

```bash
npm run seed:admin
```

Default admin credentials (change in production):
- Email: `admin@ogbenieat.com`
- Password: `AdminPass123!`

## Models

### User

- `id` (integer)
- `name` (string)
- `email` (string, unique)
- `password` (string, hashed)
- `role` (`customer`, `vendor`, `admin`)

### Vendor

- `id` (integer)
- `userId` (integer, nullable) — links to User who owns this vendor
- `name` (string)
- `description` (text)
- `location` (string)

### Menu

- `id` (integer)
- `vendorId` (integer)
- `name` (string)
- `description` (text)
- `price` (float)
- `available` (boolean)

### Order

- `id` (integer)
- `userId` (integer)
- `vendorId` (integer)
- `menuId` (integer)
- `quantity` (integer)
- `totalPrice` (float)
- `status` (`pending`, `accepted`, `preparing`, `ready`, `completed`, `cancelled`)

## Testing

```bash
npm test
```

Tests cover auth, vendor, menu, order, and admin endpoints using Jest + Supertest with mocked database.

## Common HTTP Statuses

- `200 OK` — successful read or update
- `201 Created` — successful create
- `400 Bad Request` — invalid payload or duplicate email
- `401 Unauthorized` — missing or invalid JWT
- `403 Forbidden` — insufficient permissions (e.g., non-admin accessing admin routes)
- `404 Not Found` — record not found
- `429 Too Many Requests` — rate limited
- `500 Internal Server Error` — server-side failure
