# ShopKart

A full-stack e-commerce app built with MongoDB, Express, React and Node.js. Customers can register, browse and search a product catalogue, save items to a wishlist, manage a cart, and check out with **Razorpay (Test Mode)**. Every order is verified on the server before it is saved.

Built over six engineering labs, each one adding a feature on top of the last:

| Lab | Feature |
|---|---|
| 01 | Customer authentication API (bcrypt, JWT in an HttpOnly cookie) |
| 02 | React login / register / protected home page |
| 03 | Product catalogue with search, category filter and sorting |
| 04 | Wishlist (MongoDB references + `populate()`) |
| 05 | Shopping cart with global state (React Context) and stock limits |
| 06 | Checkout, Razorpay payments with signature verification, order history |

## Features

- **Auth:** register, log in and log out. The JWT lives in an HttpOnly cookie that JavaScript can't read, and `/customers/me` decides who is logged in.
- **Catalogue:** products are fetched from the API. Search is case-insensitive, and category and price sort are applied by MongoDB. Filters live in the URL, so they survive a refresh.
- **Wishlist:** saves product references, not copies. Duplicates are rejected, and the navbar shows a live count.
- **Cart:** one row per product with a quantity, limited by live stock. The subtotal and item count are calculated, never stored. Navbar, product cards and cart page all read one shared cart state.
- **Checkout:**
  - The browser sends only the shipping address. The server re-checks stock, calculates the total from current prices and creates the Razorpay order.
  - After payment, the server verifies Razorpay's HMAC-SHA256 signature. Only then is the order marked **PAID**, stock reduced and the cart cleared.
- **Orders:** each order keeps a snapshot of the name, price and image at purchase time, so later product changes don't alter it. Includes a status tracker (Placed → Confirmed → Shipped → Delivered).
- **UI states:** every page that loads data has loading, empty and error states (with a retry button). The layout works at phone width and supports dark mode.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, React Router 7, Axios, Vite, plain CSS |
| Backend | Node.js, Express 5, Mongoose 9, bcrypt, jsonwebtoken, cookie-parser |
| Database | MongoDB |
| Payments | Razorpay Standard Checkout (Test Mode) |

## Getting started

### Prerequisites

- **Node.js 22+**
- **MongoDB** running locally on `127.0.0.1:27017`, or a MongoDB Atlas connection string
- **Razorpay test API keys:** in the [Razorpay Dashboard](https://dashboard.razorpay.com/), switch to Test Mode, then go to Account & Settings → API Keys

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in the values (see below)
npm run seed           # adds 15 sample products
npm run dev            # http://localhost:8000
```

`backend/.env`:

```env
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/shopkart
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=7d
NODE_ENV=development
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=<your test key secret>
```

> `.env` is git-ignored. The Key Secret stays on the server and is never sent to the browser.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Vite forwards `/api/*` to `http://localhost:8000`. The browser sees a single origin, so the auth cookie works without any CORS setup.

### 3. Try a test payment

Add items to the cart, go to checkout, and in the Razorpay popup pay by UPI with **`success@razorpay`**. Use **`failure@razorpay`** to try a failed payment. No real money is charged in Test Mode.

## Project structure

```text
shopkart/
├── backend/
│   ├── config/         razorpay.js (client created on first use)
│   ├── controllers/    customer, product, wishlist, cart, order
│   ├── middlewares/    auth.middleware.js (reads the JWT cookie, sets req.user)
│   ├── models/         customer (with wishlist + cart), product, order
│   ├── routes/         one router per resource
│   ├── utils/          token, ObjectId and shipping-address helpers
│   ├── seed.js         sample catalogue (updates existing products in place)
│   └── index.js
└── frontend/src/
    ├── components/     Navbar, ProtectedRoute, ProductCard, CartItem, CheckoutForm, ...
    ├── context/        CartContext, CartProvider, useCart
    ├── pages/          Login, Register, Home, Products, ProductDetails,
    │                   Wishlist, Cart, Checkout, Orders, OrderDetails
    ├── services/api.js every API call in one place
    └── utils/          formatting, validation, Razorpay script loader
```

## API reference

All routes except register, login and the product catalogue require the auth cookie, and return **401** without it. The user is always taken from the cookie, never from the request body or URL.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/customers/register` | Create an account |
| POST | `/customers/login` | Log in (sets the HttpOnly cookie) |
| GET | `/customers/me` | Current customer |
| POST | `/customers/logout` | Clear the cookie |
| PATCH | `/customers/change-password` | Change password |
| GET | `/products?search=&category=&sort=` | List products (`sort`: `price_asc`, `price_desc`) |
| GET | `/products/:id` | One product |
| POST | `/products` | Create a product (open for now) |
| GET | `/wishlist` | Wishlist with product details |
| GET | `/wishlist/ids` | Saved product ids and count |
| POST / DELETE | `/wishlist/:productId` | Add / remove (409 if already saved) |
| GET | `/cart` | Cart with live product data |
| POST | `/cart/:productId` | Add one unit (400 past stock) |
| PATCH | `/cart/:productId` | Set quantity `{ "quantity": 3 }` |
| DELETE | `/cart/:productId` | Remove item |
| POST | `/orders/create-payment-order` | Check the cart and create the pending order and Razorpay order |
| POST | `/orders/verify-payment` | Verify signature, mark paid, clear cart |
| GET | `/orders` | My paid orders, newest first |
| GET | `/orders/:id` | One of my orders (404 if it isn't yours) |
| PATCH | `/orders/:id/advance-status` | Dev only: move status one step |

## Design notes

- **Server owns the money.** The total is recalculated from current product prices, and any `totalAmount` the client sends is ignored. The amount goes to Razorpay in paise.
- **Payment is never trusted from the browser.** The order becomes PAID only if `HMAC_SHA256(razorpayOrderId + "|" + paymentId, keySecret)` matches Razorpay's signature. The Razorpay order id used is the one stored in MongoDB, not the one the client sends.
- **Cart is cleared only after a verified payment.** A failed, cancelled or fake payment leaves the cart as it was.
- **Cart vs order data.** The cart references products, so it always shows current prices. An order copies name, price and image, so it records what was actually paid.
- **No race conditions on quantities.** Cart and wishlist updates are single atomic MongoDB updates whose filters enforce the rules ("only if quantity < stock", "only if not already saved"). Double-clicks can't create duplicates or go past stock.
- **Ownership checks.** Orders are always queried with `{ _id, user: req.user._id }`, so guessing another user's order id returns 404.

## Image credits

Product photos come from [Wikimedia Commons](https://commons.wikimedia.org/), each under its own Creative Commons licence. Each file's page, at `commons.wikimedia.org/wiki/File:<file name>` (file names are in `backend/seed.js`), lists its author and licence. Book covers come from the [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers).
