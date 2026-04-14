'use strict';
require('./setup');
const request = require('supertest');
const { app, httpServer } = require('../src/app');
const db = require('../src/config/db');
const { cleanupBusiness } = require('./cleanup');

const BASE = '/api/v1';
const BIZ = {
  businessName: `NotificationsTest ${Date.now()}`,
  name: 'Notif Owner',
  email: `notif-${Date.now()}@test.local`,
  password: 'Test@1234!',
};

let accessToken;
let businessId;
let userId;

beforeAll(async () => {
    const reg = await request(app).post(`${BASE}/auth/register`).send(BIZ);
    accessToken = reg.body.accessToken;
    businessId = reg.body.user.businessId;
    userId = reg.body.user.id;

    await db.query(
        "INSERT INTO notifications (business_id, user_id, type, title, message) VALUES ($1, $2, 'test', 'Test Title', 'Test Message')",
        [businessId, userId]
    );
});

afterAll(async () => {
    await cleanupBusiness(db, businessId);
    await db.pool.end().catch(() => {});
    httpServer.close();
});

describe('Notifications Endpoints', () => {
    it('GET /notifications', async () => {
        const res = await request(app)
            .get(`${BASE}/notifications`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(res.body.notifications.length).toBeGreaterThan(0);
        expect(res.body.notifications[0].read_at).toBeNull();
    });

    it('PATCH /notifications/:id/read', async () => {
        const notifs = await request(app)
            .get(`${BASE}/notifications`)
            .set('Authorization', `Bearer ${accessToken}`);
        const id = notifs.body.notifications[0].id;

        const res = await request(app)
            .patch(`${BASE}/notifications/${id}/read`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(res.body.read_at).not.toBeNull();
    });

    it('PATCH /notifications/read-all', async () => {
        await db.query(
            "INSERT INTO notifications (business_id, user_id, type, title, message) VALUES ($1, $2, 'test', 'Test 2', 'Test Message 2')",
            [businessId, userId]
        );
        const res = await request(app)
            .patch(`${BASE}/notifications/read-all`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        
        const notifs = await request(app)
            .get(`${BASE}/notifications`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(notifs.body.notifications.every(n => n.read_at !== null)).toBe(true);
    });
});
