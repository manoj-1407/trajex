'use strict';
require('./setup');
const request = require('supertest');
const { app, httpServer } = require('../src/app');
const db = require('../src/config/db');
const { cleanupBusiness } = require('./cleanup');

const BASE = '/api/v1';
const BIZ = {
  businessName: `WebhookTest ${Date.now()}`,
  name: 'Webhook Owner',
  email: `webhook-${Date.now()}@test.local`,
  password: 'Test@1234!',
};

let accessToken;
let businessId;

beforeAll(async () => {
    const reg = await request(app).post(`${BASE}/auth/register`).send(BIZ);
    accessToken = reg.body.accessToken;
    businessId = reg.body.user.businessId;
});

afterAll(async () => {
    await cleanupBusiness(db, businessId);
    await db.pool.end().catch(() => {});
    httpServer.close();
});

describe('Webhooks', () => {
    it('PATCH /settings updates webhook config', async () => {
        const res = await request(app)
            .patch(`${BASE}/settings`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                webhookUrl: 'http://localhost:9999/webhook',
                webhookSecret: 'my_secret_key'
            });
        expect(res.status).toBe(200);
        expect(res.body.webhook_url).toBe('http://localhost:9999/webhook');
        
        const settings = await request(app).get(`${BASE}/settings`).set('Authorization', `Bearer ${accessToken}`);
        expect(settings.body.webhook_secret).toBe('my_secret_key');
    });

    it('Triggers webhook logic gently on status update', async () => {
        const orderRes = await request(app).post(`${BASE}/orders`).set('Authorization', `Bearer ${accessToken}`).send({
            customerName: 'Webhook Customer',
            dropAddress: '123 Test',
        });
        const orderId = orderRes.body.id;
        
        // This will trigger axios.post, which will fail (catch block in service logging it)
        // because http://localhost:9999/webhook is not running. 
        // We only assert the API response is 200 OK (async webhook doesn't block)
        const res = await request(app)
            .patch(`${BASE}/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ status: 'delivered' });
            
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('delivered');
    });
});
