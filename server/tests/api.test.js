import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import User from '../src/models/User.js';
import Book from '../src/models/Book.js';
import { sampleBooks } from '../src/data/sampleBooks.js';

let mongoServer;
let httpServer;
let baseUrl;

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

before(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_for_automated_suite';
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';

  mongoServer = await MongoMemoryServer.create({
    binary: { version: '7.0.14' },
    instance: { launchTimeout: 30000 },
  });
  await mongoose.connect(mongoServer.getUri());

  const app = createApp();
  await new Promise((resolve) => {
    httpServer = app.listen(0, () => {
      const { port } = httpServer.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  // Seed admin user and sample books
  await User.create({
    name: 'Test Admin',
    email: 'admin@booknest.test',
    password: 'AdminPassword123',
    role: 'admin',
  });
  await Book.insertMany(sampleBooks);
});

after(async () => {
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('BookNest REST API Integration Tests', () => {
  let customerToken = '';
  let customer2Token = '';
  let adminToken = '';
  let createdBookId = '';
  let lowStockBookId = '';
  let createdOrderId = '';

  it('GET /api/health returns ok', async () => {
    const res = await api('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'ok');
  });

  it('POST /api/auth/register creates a customer and ignores role escalation attempt', async () => {
    const res = await api('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Alice Reader',
        email: 'alice@example.com',
        password: 'Password123',
        role: 'admin',
      },
    });

    assert.equal(res.status, 201);
    assert.ok(res.data.token);
    assert.equal(res.data.user.role, 'customer');
    customerToken = res.data.token;

    const res2 = await api('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Bob Reader',
        email: 'bob@example.com',
        password: 'Password123',
      },
    });
    assert.equal(res2.status, 201);
    customer2Token = res2.data.token;
  });

  it('POST /api/auth/login rejects wrong password and accepts admin credentials', async () => {
    const badLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@booknest.test', password: 'WrongPassword' },
    });
    assert.equal(badLogin.status, 401);

    const adminLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@booknest.test', password: 'AdminPassword123' },
    });
    assert.equal(adminLogin.status, 200);
    assert.equal(adminLogin.data.user.role, 'admin');
    adminToken = adminLogin.data.token;
  });

  it('GET /api/books supports browsing, search, and category filtering', async () => {
    const allRes = await api('/api/books');
    assert.equal(allRes.status, 200);
    assert.equal(allRes.data.books.length, sampleBooks.length);

    const searchRes = await api('/api/books?search=Kleppmann');
    assert.equal(searchRes.status, 200);
    assert.equal(searchRes.data.books.length, 1);
    assert.equal(searchRes.data.books[0].author, 'Martin Kleppmann');

    const catRes = await api('/api/books?category=Mystery');
    assert.equal(catRes.status, 200);
    assert.ok(catRes.data.books.every((b) => b.category === 'Mystery'));

    const invalidIdRes = await api('/api/books/not-a-valid-id');
    assert.equal(invalidIdRes.status, 400);
  });

  it('blocks customers from admin endpoints with 403', async () => {
    const createAttempt = await api('/api/books', {
      method: 'POST',
      token: customerToken,
      body: {
        title: 'Unauthorized Book',
        author: 'Nobody',
        category: 'Fiction',
        description: 'Should fail',
        price: 10,
        stock: 5,
      },
    });
    assert.equal(createAttempt.status, 403);

    const statsAttempt = await api('/api/dashboard/stats', { token: customerToken });
    assert.equal(statsAttempt.status, 403);

    const allOrdersAttempt = await api('/api/orders', { token: customerToken });
    assert.equal(allOrdersAttempt.status, 403);
  });

  it('allows admin to create, update, and delete books', async () => {
    const createRes = await api('/api/books', {
      method: 'POST',
      token: adminToken,
      body: {
        title: 'Pragmatic Testing',
        author: 'Jane Engineer',
        category: 'Technology',
        description: 'Testing strategies for web apps.',
        price: 29.99,
        stock: 10,
        isbn: '9780000000001',
      },
    });
    assert.equal(createRes.status, 201);
    createdBookId = createRes.data.book._id;

    const updateRes = await api(`/api/books/${createdBookId}`, {
      method: 'PUT',
      token: adminToken,
      body: { stock: 6, price: 25.0 },
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.book.stock, 6);
    assert.equal(updateRes.data.book.price, 25.0);

    // Also create a 1-stock book to test simultaneous checkout safety
    const rareRes = await api('/api/books', {
      method: 'POST',
      token: adminToken,
      body: {
        title: 'Limited Edition Book',
        author: 'Rare Author',
        category: 'Fiction',
        description: 'Only one copy left.',
        price: 50.0,
        stock: 1,
      },
    });
    assert.equal(rareRes.status, 201);
    lowStockBookId = rareRes.data.book._id;
  });

  it('creates an order, computes server price, reduces stock, and isolates customer orders', async () => {
    const orderRes = await api('/api/orders', {
      method: 'POST',
      token: customerToken,
      body: {
        items: [{ bookId: createdBookId, quantity: 2, price: 0.01 }], // tampered price ignored
        deliveryAddress: {
          fullName: 'Alice Reader',
          phone: '555-0101',
          street: '123 Maple St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
        },
      },
    });

    assert.equal(orderRes.status, 201);
    assert.equal(orderRes.data.order.totalAmount, 50.0); // 2 * $25.00 from DB
    assert.equal(orderRes.data.order.status, 'Pending');
    createdOrderId = orderRes.data.order._id;

    const bookAfter = await api(`/api/books/${createdBookId}`);
    assert.equal(bookAfter.data.book.stock, 4); // 6 - 2

    const aliceOrders = await api('/api/orders/my-orders', { token: customerToken });
    assert.equal(aliceOrders.status, 200);
    assert.equal(aliceOrders.data.orders.length, 1);

    const bobOrders = await api('/api/orders/my-orders', { token: customer2Token });
    assert.equal(bobOrders.status, 200);
    assert.equal(bobOrders.data.orders.length, 0);
  });

  it('handles simultaneous orders safely and rolls back multi-item failures', async () => {
    // Attempt multi-item order where second item exceeds stock -> first item stock must NOT drop
    const multiFail = await api('/api/orders', {
      method: 'POST',
      token: customerToken,
      body: {
        items: [
          { bookId: createdBookId, quantity: 1 }, // has 4
          { bookId: lowStockBookId, quantity: 2 }, // only has 1!
        ],
        deliveryAddress: {
          fullName: 'Alice Reader',
          phone: '555-0101',
          street: '123 Maple St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
        },
      },
    });
    assert.equal(multiFail.status, 409);

    const createdBookCheck = await api(`/api/books/${createdBookId}`);
    assert.equal(createdBookCheck.data.book.stock, 4);

    // Fire two simultaneous orders for the single remaining copy of lowStockBookId
    const payload = {
      items: [{ bookId: lowStockBookId, quantity: 1 }],
      deliveryAddress: {
        fullName: 'Concurrent Buyer',
        phone: '555-0202',
        street: '456 Oak Ave',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
      },
    };

    const [r1, r2] = await Promise.all([
      api('/api/orders', { method: 'POST', token: customerToken, body: payload }),
      api('/api/orders', { method: 'POST', token: customer2Token, body: payload }),
    ]);

    const statuses = [r1.status, r2.status].sort();
    assert.deepEqual(statuses, [201, 409]);

    const rareAfter = await api(`/api/books/${lowStockBookId}`);
    assert.equal(rareAfter.data.book.stock, 0);
  });

  it('allows admin to view orders, update order status, view dashboard stats, and delete book', async () => {
    const allOrders = await api('/api/orders', { token: adminToken });
    assert.equal(allOrders.status, 200);
    assert.equal(allOrders.data.orders.length, 2);

    const statusRes = await api(`/api/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'Shipped' },
    });
    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.data.order.status, 'Shipped');

    const statsRes = await api('/api/dashboard/stats', { token: adminToken });
    assert.equal(statsRes.status, 200);
    assert.equal(statsRes.data.stats.totalCustomers, 2);
    assert.equal(statsRes.data.stats.totalOrders, 2);
    assert.ok(statsRes.data.lowStockBooks.length >= 4);

    const delRes = await api(`/api/books/${lowStockBookId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    assert.equal(delRes.status, 200);
  });
});
