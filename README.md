# BookNest — Full-Stack Online Bookstore

BookNest is a complete, beginner-friendly full-stack online bookstore built with the MERN stack (MongoDB Atlas, Express.js, React + Vite, Node.js). Customers can browse, search, and filter books, manage a shopping cart, and place Cash on Delivery (COD) orders. Administrators can manage the book catalog, update inventory stock, view store statistics, and update customer order statuses.

---

## Tech Stack

- **Frontend:** React 19, Vite, React Router, Axios, Vanilla CSS
- **Backend:** Node.js, Express.js, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`
- **Database:** MongoDB Atlas

---

## Project Structure

```text
booknest/
├── client/                 # React + Vite frontend
│   ├── public/
│   │   └── book-fallback.svg
│   ├── src/
│   │   ├── components/     # Navbar, Footer, BookCard, ProtectedRoute, ConfirmModal, StatusBadge
│   │   ├── constants/      # Categories, order statuses, fallback image
│   │   ├── context/        # AuthContext, CartContext
│   │   ├── pages/          # Public, Customer, and Admin pages
│   │   ├── services/       # Axios API client
│   │   ├── styles/         # Global CSS design system
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── server/                 # Express REST API backend
│   ├── src/
│   │   ├── config/         # MongoDB connection
│   │   ├── controllers/    # Auth, Books, Orders, Dashboard controllers
│   │   ├── data/           # Sample books seed data
│   │   ├── middleware/     # JWT auth, admin guard, centralized error handler
│   │   ├── models/         # User, Book, Order Mongoose schemas
│   │   ├── routes/         # REST API route definitions
│   │   ├── scripts/        # Admin + sample books seed script
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/              # Automated Node integration tests
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

---

## 1. Configuring MongoDB Atlas

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a new free **M0 Cluster**.
3. Under **Database Access**, create a database user with a username and password.
4. Under **Network Access**, add your IP address (or `0.0.0.0/0` for development/Render deployment).
5. Click **Connect -> Drivers** and copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/booknest?retryWrites=true&w=majority
   ```

---

## 2. Running Locally

### Step 1: Install Dependencies

From the project root (`BookNest/`):

```bash
npm run install:all
```

### Step 2: Configure Environment Variables

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/booknest?retryWrites=true&w=majority
JWT_SECRET=your_long_random_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
ADMIN_NAME=BookNest Admin
ADMIN_EMAIL=admin@booknest.com
ADMIN_PASSWORD=your_secure_admin_password
```

Create `client/.env` from `client/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 3: Create the First Admin Account & Seed Sample Books

Make sure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `MONGODB_URI` are set in `server/.env`, then run:

```bash
npm run seed
```

This creates the initial administrator account (if it does not already exist) and populates 12 sample books across all 6 categories (`Fiction`, `Technology`, `Education`, `Business`, `Self-Help`, `Mystery`).

### Step 4: Start Backend and Frontend Servers

In terminal 1 (Backend API on `http://localhost:5000`):

```bash
npm run dev:server
```

In terminal 2 (Frontend UI on `http://localhost:5173`):

```bash
npm run dev:client
```

---

## 3. Running Automated Backend Tests

The server includes an automated integration test suite using Node's built-in test runner and `mongodb-memory-server`:

```bash
npm run test:server
```

---

## 4. API Endpoints Overview

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/me`
- **Books:** `GET /api/books`, `GET /api/books/:id`, `POST /api/books` (admin), `PUT /api/books/:id` (admin), `DELETE /api/books/:id` (admin)
- **Orders:** `POST /api/orders` (authenticated), `GET /api/orders/my-orders` (authenticated), `GET /api/orders` (admin), `PATCH /api/orders/:id/status` (admin)
- **Dashboard:** `GET /api/dashboard/stats` (admin)
- **Health Check:** `GET /api/health`

---

## 5. Deployment Guide

### Backend on Render

1. Push your repository to GitHub (`.env` files are excluded by `.gitignore`).
2. Create a new **Web Service** on [Render](https://render.com) pointing to your repository.
3. Configure the service:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add environment variables in Render Dashboard:
   - `NODE_ENV=production`
   - `MONGODB_URI=<your MongoDB Atlas URI>`
   - `JWT_SECRET=<strong random string>`
   - `CLIENT_ORIGIN=https://<your-vercel-domain>.vercel.app`
5. Note that Render automatically injects `PORT`, and the Express server binds to `process.env.PORT`.

### Frontend on Vercel

1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Configure the project:
   - **Root Directory:** `client`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variable in Vercel:
   - `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api`
4. Deploy, then update `CLIENT_ORIGIN` on Render to match your live Vercel URL.
