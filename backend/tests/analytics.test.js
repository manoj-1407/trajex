'use strict';
require('./setup');
const request = require('supertest');
const { app, httpServer } = require('../src/app');
const db = require('../src/config/db');
const { cleanupBusiness } = require('./cleanup');

const BASE = '/api/v1';
const BIZ = {
  businessName: `AnalyticsTest ${Date.now()}`,
  name: 'Ana Lytics',
  email: `analytics-${Date.now()}@test.local`,
  password: 'Test@1234!',
};

let accessToken;
let businessId;

beforeAll(async () => {
    const reg = await request(app).post(`${BASE}/auth/register`).send(BIZ);
    accessToken = reg.body.accessToken;
    businessId = reg.body.user.businessId;

    const crypto = require('crypto');
    await db.query("INSERT INTO orders (business_id, customer_name, status, total_amount, tracking_token) VALUES ($1, 'Test', 'delivered', 100, $2)", [businessId, crypto.randomBytes(16).toString('hex')]);
    await db.query("INSERT INTO orders (business_id, customer_name, status, total_amount, tracking_token) VALUES ($1, 'Test', 'pending', 50, $2)", [businessId, crypto.randomBytes(16).toString('hex')]);
});

afterAll(async () => {
    await cleanupBusiness(db, businessId);
    await db.pool.end().catch(() => {});
    httpServer.close();
});

describe('Analytics Endpoints', () => {
    it('GET /analytics/dashboard', async () => {
        const res = await request(app)
            .get(`${BASE}/analytics/dashboard`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(res.body.orders.total).toBe(2);
        expect(res.body.revenue).toBeDefined();
    });

    it('GET /analytics/daily', async () => {
        const res = await request(app)
            .get(`${BASE}/analytics/daily?days=7`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /analytics/trend', async () => {
        const res = await request(app)
            .get(`${BASE}/analytics/trend?days=7`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /analytics/status-breakdown', async () => {
        const res = await request(app)
            .get(`${BASE}/analytics/status-breakdown?days=7`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.find(b => b.status === 'delivered')).toBeDefined();
    });

    it('GET /analytics/top-riders', async () => {
        const res = await request(app)
            .get(`${BASE}/analytics/top-riders?days=7`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /analytics/heatmap', async () => {
        const res = await request(app)
            .get(`${BASE}/analytics/heatmap?days=30`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
