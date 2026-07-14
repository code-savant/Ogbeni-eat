# Ogbeni-eat Backend

A Node.js backend for the Ogbeni Eats food vendor platform.

This API provides authentication, vendor management, menu management, and order management.

## Base URL

```
http://localhost:5000
```

## Environment

Add the following to `.env`:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

## API Endpoints

### Root

- `GET /`
  - Description: Health check endpoint.
  - Response:
    - `200 OK`
    - `{ message: 'Ogbeni Eats API is running' }`

### Authentication

#### Register user

- `POST /api/auth/register`
- Description: Create a new user account.
- Body:
  - `name` (string, required)
  - `email` (string, required)
  - `password` (string, required)
  - `role` (string, optional, one of `vendor`, `customer`, `admin`)
- Example:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123",
    "role": "customer"
  }
  ```
- Success response:
  - `201 Created`
  - ```json
    {
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "customer"
      },
      "token": "...jwt token..."
    }
    ```

#### Login user

- `POST /api/auth/login`
- Description: Authenticate and receive a JWT token.
- Body:
  - `email` (string, required)
  - `password` (string, required)
- Example:
  ```json
  {
    "email": "jane@example.com",
    "password": "password123"
  }
  ```
- Success response:
  - `200 OK`
  - ```json
    {
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "customer"
      },
      "token": "...jwt token..."
    }
    ```

#### Get current user

- `GET /api/auth/me`
- Description: Get the authenticated user's profile.
- Authorization: Bearer token required.
- Headers:
  - `Authorization: Bearer <token>`
- Success response:
  - `200 OK`
  - ```json
    {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "customer"
    }
    ```

### Vendors

#### Get all vendors

- `GET /api/vendors`
- Description: Retrieve a list of all vendors.
- Response:
  - `200 OK`
  - Array of vendor objects.

#### Get vendor by ID

- `GET /api/vendors/:id`
- Description: Retrieve a single vendor by its ID.
- Response:
  - `200 OK` vendor object
  - `404 Not Found` if the vendor does not exist.

#### Create a vendor

- `POST /api/vendors`
- Description: Create a new vendor.
- Body:
  - `name` (string, required)
  - `description` (string, optional)
  - `location` (string, optional)
- Example:
  ```json
  {
    "name": "Lucky Food Stall",
    "description": "Best jollof in town",
    "location": "Ikeja"
  }
  ```
- Success response:
  - `201 Created` vendor object

#### Update a vendor

- `PUT /api/vendors/:id`
- Description: Update an existing vendor.
- Body: Any vendor fields to update.
- Success response:
  - `200 OK` updated vendor object

#### Delete a vendor

- `DELETE /api/vendors/:id`
- Description: Remove a vendor.
- Success response:
  - `200 OK`
  - `{ message: 'Vendor removed' }`

### Menus

#### Get all menu items

- `GET /api/menus`
- Description: Retrieve all menu items.
- Response:
  - `200 OK` list of menu item objects.

#### Get menu item by ID

- `GET /api/menus/:id`
- Description: Retrieve a specific menu item.
- Response:
  - `200 OK` menu object
  - `404 Not Found` if the item is not found.

#### Create a menu item

- `POST /api/menus`
- Description: Add a menu item.
- Body:
  - `vendorId` (integer, required)
  - `name` (string, required)
  - `description` (string, optional)
  - `price` (float, required)
  - `available` (boolean, optional)
- Example:
  ```json
  {
    "vendorId": 1,
    "name": "Chicken Suya",
    "description": "Spicy skewered chicken",
    "price": 1200.0,
    "available": true
  }
  ```
- Success response:
  - `201 Created` menu item object

#### Update a menu item

- `PUT /api/menus/:id`
- Description: Update a menu item.
- Body: Any fields to update.
- Success response:
  - `200 OK` updated menu object

#### Delete a menu item

- `DELETE /api/menus/:id`
- Description: Remove a menu item.
- Success response:
  - `200 OK`
  - `{ message: 'Menu item removed' }`

### Orders

#### Get current user's orders

- `GET /api/orders`
- Description: Retrieve orders for the authenticated user.
- Authorization: Bearer token required.
- Success response:
  - `200 OK` list of order objects

#### Get order by ID

- `GET /api/orders/:id`
- Description: Retrieve a specific order for the authenticated user.
- Authorization: Bearer token required.
- Success response:
  - `200 OK` order object
  - `404 Not Found` if the order does not exist or does not belong to the user.

#### Create an order

- `POST /api/orders`
- Description: Create a new order for the authenticated user.
- Authorization: Bearer token required.
- Body:
  - `vendorId` (integer, required)
  - `menuId` (integer, required)
  - `quantity` (integer, required)
  - `totalPrice` (float, required)
- Example:
  ```json
  {
    "vendorId": 1,
    "menuId": 2,
    "quantity": 2,
    "totalPrice": 2400.0
  }
  ```
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
