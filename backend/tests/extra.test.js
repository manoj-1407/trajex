'use strict';
require('./setup');
const request = require('supertest');
const { app, httpServer } = require('../src/app');
const db = require('../src/config/db');

describe('Extra Endpoints & Coverage', () => {
    afterAll(async () => {
        await db.pool.end().catch(() => {});
        httpServer.close();
    });

    it('GET /api/v1/health should return ok with version and uptime', async () => {
        const res = await request(app).get('/api/v1/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.version).toBe('1.0.0');
        expect(res.body.uptime).toBeDefined();
    });

    it('GET /api/v1/non-existent-route should return 404', async () => {
        const res = await request(app).get('/api/v1/non-existent-route');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Route not found');
    });

    it('GET /api/v1/settings returns 401 unauthenticated', async () => {
        const res = await request(app).get('/api/v1/settings');
        expect(res.status).toBe(401);
    });

    it('GET /api/v1/analytics/dashboard returns 401 unauthenticated', async () => {
        const res = await request(app).get('/api/v1/analytics/dashboard');
        expect(res.status).toBe(401);
    });

    it('GET /api/v1/notifications returns 401 unauthenticated', async () => {
        const res = await request(app).get('/api/v1/notifications');
        expect(res.status).toBe(401);
    });
});
