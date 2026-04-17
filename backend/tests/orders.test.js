'use strict';
require('./setup');
const request = require('supertest');
const { app }  = require('../src/app');
const db       = require('../src/config/db');
const { cleanupBusiness } = require('./cleanup');

const UNIQUE = Date.now();
let token;
let businessId;
let orderId;

beforeAll(async () => {
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({
      businessName: `Orders Test Biz ${UNIQUE}`,
      name: 'Orders Owner',
      email: `orders_${UNIQUE}@trajex.test`,
      password: 'Orders@1234!',
    });
  token      = reg.body.accessToken;
  businessId = reg.body.user.businessId;
});

afterAll(async () => {
  await cleanupBusiness(db, businessId);
  await db.pool.end().catch(() => {});
});

describe('GET /api/v1/orders', () => {
  test('returns paginated response', async () => {
    const res = await request(app)
      .get('/api/v1/orders?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      orders: expect.any(Array),
      total:  expect.any(Number),
      page:   1,
      limit:  5,
      pages:  expect.any(Number),
    });
  });

  test('filters by status', async () => {
    const res = await request(app)
      .get('/api/v1/orders?status=pending')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.orders.forEach((o) => expect(o.status).toBe('pending'));
  });

  test('rejects invalid status', async () => {
    const res = await request(app)
      .get('/api/v1/orders?status=invalid_status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/orders', () => {
  test('creates order and returns it', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Test Customer',
        dropAddress:  '99 Test Street, Bengaluru',
        priority:     'normal',
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('tracking_token');
    expect(res.body.status).toBe('pending');
    expect(res.body.tracking_token).toHaveLength(32);
    orderId = res.body.id;
  });

  test('rejects missing customerName', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ dropAddress: '99 Test Street' });
    expect(res.status).toBe(422);
  });

  test('rejects missing dropAddress', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerName: 'Test' });
    expect(res.status).toBe(422);
  });
});

describe('PATCH /api/v1/orders/:id/status', () => {
  test('updates status from pending to confirmed', async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  test('rejects invalid status value', async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'flying' });
    expect(res.status).toBe(422);
  });

  test('returns 404 for non-existent order', async () => {
    const res = await request(app)
      .patch('/api/v1/orders/00000000-0000-0000-0000-000000000000/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/orders/:id', () => {
  test('returns full order with items and tracking', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('tracking');
  });

  test('returns 404 for another business order', async () => {
    const res = await request(app)
      .get('/api/v1/orders/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
