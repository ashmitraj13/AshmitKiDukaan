# ShopKart — Customer Authentication Service (Lab 01)

Express + MongoDB (Mongoose) auth API using bcrypt, JWT and HttpOnly cookies.

## Run

```bash
# 1. Start MongoDB (in its own terminal)
~/mongodb/bin/mongod --dbpath ~/mongodb/data --bind_ip 127.0.0.1

# 2. Start the API
cd ~/shopkart/backend
npm install
npm run dev      # or: npm start
```

The server runs on `http://localhost:8000`. (Port 5000 is taken by macOS AirPlay Receiver.)

## Endpoints

| Method | Endpoint                     | Protected | Body |
|--------|------------------------------|-----------|------|
| POST   | `/customers/register`        | No        | `fullName, email, password, phone` |
| POST   | `/customers/login`           | No        | `email, password` |
| GET    | `/customers/me`              | Yes       | — |
| POST   | `/customers/logout`          | Yes       | — |
| PATCH  | `/customers/change-password` | Yes       | `oldPassword, newPassword` |

## Testing in Postman

1. Register: `POST http://localhost:8000/customers/register`, Body → raw → JSON.
2. Login: `POST /customers/login`. Postman saves the `token` cookie on its own (see the **Cookies** link under Send).
3. `GET /customers/me` returns the profile because Postman sends the cookie.
4. `POST /customers/logout` clears the cookie. `/me` now returns 401.

## Status codes

| Case | Code |
|------|------|
| Registered | 201 |
| Missing field / password < 6 / invalid JSON | 400 |
| Email already exists | 409 |
| Wrong credentials, missing or invalid token | 401 |
| Unknown route | 404 |
