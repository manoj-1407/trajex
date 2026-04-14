'use strict';
require('./setup');
const request = require('supertest');
const { app, httpServer } = require('../src/app');
const db = require('../src/config/db');
const { cleanupBusiness } = require('./cleanup');

const BASE = '/api/v1';
const BIZ = {
  businessName: `InviteTest ${Date.now()}`,
  name: 'Invite Owner',
  email: `invite-${Date.now()}@test.local`,
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

describe('Riders Invite Endpoints', () => {
    it('POST /riders/invite successfully invites a rider', async () => {
        const res = await request(app)
            .post(`${BASE}/riders/invite`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: 'New Rider',
                email: `newrider-${Date.now()}@test.local`,
                phone: '+1234567890'
            });
        expect(res.status).toBe(201);
        expect(res.body.userId).toBeDefined();
        
        const dbUser = await db.query('SELECT id, role FROM users WHERE id=$1', [res.body.userId]);
        expect(dbUser.rows[0].role).toBe('staff');
        
        const dp = await db.query('SELECT id FROM delivery_partners WHERE user_id=$1', [res.body.userId]);
        expect(dp.rows.length).toBe(1);
    });

    it('POST /riders/invite rejects duplicate email', async () => {
        const payload = {
            name: 'Dup Rider',
            email: `dup-${Date.now()}@test.local`,
        };
        await request(app).post(`${BASE}/riders/invite`).set('Authorization', `Bearer ${accessToken}`).send(payload);
        const res = await request(app).post(`${BASE}/riders/invite`).set('Authorization', `Bearer ${accessToken}`).send(payload);
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('already exists');
    });
});
