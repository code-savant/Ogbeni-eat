# Ogbeni-eat Backend

A Node.js + Express backend for the Ogbeni Eats food vendor platform.

This API currently supports:

- User authentication
- Vendor CRUD
- Menu CRUD
- Order CRUD for the authenticated user
- PostgreSQL-backed persistence through the shared `pg` pool

## Base URL

```text
http://127.0.0.1:5000/api
```

## Tech stack

- Express
- PostgreSQL via `pg`
- JWT authentication
- TypeScript with `tsx` for development
- Prisma schema files are present for modeling work, but the active runtime path is currently the shared Postgres pool

## Environment variables

Create a `.env` file in the project root:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
NODE_ENV=development
```

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

## API overview

### Root health check

- `GET /`
- Base URL: `http://127.0.0.1:5000/`
- Example response:

```json
{
  "message": "Ogbeni Eats API is running"
}
```

### Authentication

#### 1. Register a user

- Method: `POST`
- Endpoint: `/auth/register`
- Body (Customer):

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "customer"
}
```

- Body (Vendor - allows optional `location` and `description` fields):

```json
{
  "name": "Amala Express",
  "email": "vendor@example.com",
  "password": "password123",
  "role": "vendor",
  "location": "12 Marina Road, Lagos",
  "description": "The best amala in Lagos"
}
```

Expected result:

- `201 Created`

```json
{
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "customer",
    "location": null,
    "description": null
  },
  "token": "<jwt_token>"
}
```

#### 2. Login a user

- Method: `POST`
- Endpoint: `/auth/login`
- Body:

```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

Expected result:

- `200 OK`

```json
{
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "customer"
  },
  "token": "<jwt_token>"
}
```

#### 3. Get current authenticated user

- Method: `GET`
- Endpoint: `/auth/me`
- Header:

```text
Authorization: Bearer <jwt_token>
```

Expected result:

- `200 OK`

```json
{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "customer"
}
```

### Vendors

#### 4. Get all vendors

- Method: `GET`
- Endpoint: `/vendors`

Expected result:

- `200 OK`
- Returns an array of vendor objects.

#### 5. Get one vendor

- Method: `GET`
- Endpoint: `/vendors/:id`

Example:

```text
GET /api/vendors/1
```

Expected result:

- `200 OK`
- Returns a single vendor object
- `404 Not Found` if it does not exist

#### 6. Create a vendor

- Method: `POST`
- Endpoint: `/vendors`
- Body:

```json
{
  "name": "Mama's Kitchen",
  "description": "Home-made meals and snacks",
  "location": "Lagos"
}
```

Expected result:

- `201 Created`
- Returns the created vendor object

#### 7. Update a vendor

- Method: `PUT`
- Endpoint: `/vendors/:id`
- Body:

```json
{
  "name": "Mama's Kitchen Updated",
  "description": "Fresh local meals and snacks",
  "location": "Abuja"
}
```

Expected result:

- `200 OK`
- Returns the updated vendor object

#### 8. Delete a vendor

- Method: `DELETE`
- Endpoint: `/vendors/:id`

Expected result:

- `200 OK`

```json
{
  "message": "Vendor removed"
}
```

### Menus

#### 9. Get all menus

- Method: `GET`
- Endpoint: `/menus`

Expected result:

- `200 OK`
- Returns a list of menu items

#### 10. Get one menu item

- Method: `GET`
- Endpoint: `/menus/:id`

Expected result:

- `200 OK`
- Returns a single menu item
- `404 Not Found` if it does not exist

#### 11. Create a menu item

- Method: `POST`
- Endpoint: `/menus`
- Body:

```json
{
  "vendorId": 1,
  "name": "Jollof Rice",
  "description": "Classic Nigerian jollof rice",
  "price": 2500,
  "available": true
}
```

Expected result:

- `201 Created`
- Returns the created menu item

#### 12. Update a menu item

- Method: `PUT`
- Endpoint: `/menus/:id`
- Body:

```json
{
  "name": "Spicy Jollof Rice",
  "description": "Hot and delicious",
  "price": 3000,
  "available": true
}
```

Expected result:

- `200 OK`
- Returns the updated menu item

#### 13. Delete a menu item

- Method: `DELETE`
- Endpoint: `/menus/:id`

Expected result:

- `200 OK`

```json
{
  "message": "Menu item removed"
}
```

### Orders

Orders require a valid JWT token in the `Authorization` header.

#### 14. Get all orders for the logged-in user

- Method: `GET`
- Endpoint: `/orders`
- Header:

```text
Authorization: Bearer <jwt_token>
```

Expected result:

- `200 OK`
- Returns an array of orders belonging to the authenticated user

#### 15. Get one order

- Method: `GET`
- Endpoint: `/orders/:id`
- Header:

```text
Authorization: Bearer <jwt_token>
```

Expected result:

- `200 OK`
- Returns one order
- `404 Not Found` if it does not exist or is not linked to the current user

#### 16. Create an order

- Method: `POST`
- Endpoint: `/orders`
- Header:

```text
Authorization: Bearer <jwt_token>
```

- Body:

```json
{
  "vendorId": 1,
  "menuId": 1,
  "quantity": 2,
  "totalPrice": 5000
}
```

Expected result:

- `201 Created`
- Returns the created order record

#### 17. Update order status

- Method: `PUT`
- Endpoint: `/orders/:id`
- Header:

```text
Authorization: Bearer <jwt_token>
```

- Body:

```json
{
  "status": "accepted"
}
```

Expected result:

- `200 OK`
- Returns the updated order with the new status

## Recommended Postman use case flow

Use this exact sequence to test the backend from scratch:

1. Register a user
   - `POST /auth/register`
2. Login the user
   - `POST /auth/login`
3. Copy the returned `token` into your Postman environment variable called `token`
4. Create a vendor
   - `POST /vendors`
5. Create a menu item
   - `POST /menus`
6. Create an order
   - `POST /orders`
7. View all orders
   - `GET /orders`
8. Update the order status
   - `PUT /orders/:id`

## Postman setup steps

1. Open Postman.
2. Create a new collection named `Ogbeni-eat API`.
3. Create a new environment named `Ogbeni-eat`.
4. Add these variables:

```text
base_url = http://127.0.0.1:5000/api
token = <paste your jwt token here>
```

5. For authenticated requests, add this header:

```text
Authorization: Bearer {{token}}
```

6. Set the request body type to `raw` and `JSON`.

## Common HTTP statuses

- `200 OK` — successful read or update
- `201 Created` — successful create
- `400 Bad Request` — invalid payload or duplicate email
- `401 Unauthorized` — missing or invalid JWT
- `404 Not Found` — record not found
- `500 Internal Server Error` — server-side failure

## Notes

- The server currently runs on port `5000`.
- The API is protected on order routes using JWT middleware.
- If the database is empty, `GET /vendors`, `GET /menus`, and `GET /orders` may return `[]` until data is created.

- Success response:
  - `201 Created` order object

#### Update order status

- `PUT /api/orders/:id`
- Description: Update the status of an order.
- Authorization: Bearer token required.
- Body:
  - `status` (string, required, one of `pending`, `accepted`, `preparing`, `ready`, `completed`, `cancelled`)
- Example:
  ```json
  {
    "status": "accepted"
  }
  ```
- Success response:
  - `200 OK` updated order object

## Models

### User

- `id` (integer)
- `name` (string)
- `email` (string)
- `password` (string, hashed)
- `role` (`vendor`, `customer`, `admin`)

### Vendor

- `id` (integer)
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

## Authentication

- Uses JWT tokens.
- Register and login endpoints return a `token`.
- Protected routes require the header:
  - `Authorization: Bearer <token>`

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up `.env` with `DATABASE_URL` and `JWT_SECRET`.
3. Start the server:
   ```bash
   node app.js
   ```
4. Open `http://localhost:5000`.

## Notes

- Orders are tied to the authenticated user.
- Menu items are associated with vendors using `vendorId`.
- All protected order endpoints require a valid JWT.
