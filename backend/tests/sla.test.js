'use strict';
require('./setup');
const request = require('supertest');
const { app, httpServer } = require('../src/app');
const db = require('../src/config/db');
const { cleanupBusiness } = require('./cleanup');
const { checkSLABreaches, setIo } = require('../src/modules/sla/sla.service');

const BIZ = {
  businessName: `SlaTest ${Date.now()}`,
  name: 'Sla Owner',
  email: `sla-${Date.now()}@test.local`,
  password: 'Test@1234!',
};

let businessId;

beforeAll(async () => {
    const reg = await request(app).post(`/api/v1/auth/register`).send(BIZ);
    businessId = reg.body.user.businessId;
    setIo({ to: () => ({ emit: () => {} }) });
});

afterAll(async () => {
    await cleanupBusiness(db, businessId);
    await db.pool.end().catch(() => {});
    httpServer.close();
});

describe('SLA Background Service', () => {
    it('detects SLA breaches and creates delay_events and notifications', async () => {
        // Create an overdue order
        const crypto = require('crypto');
        const o1 = await db.query(
            "INSERT INTO orders (business_id, customer_name, status, created_at, tracking_token) VALUES ($1, 'Late Order', 'assigned', NOW() - INTERVAL '50 minutes', $2) RETURNING id",
            [businessId, crypto.randomBytes(16).toString('hex')]
        );
        // Create a recent order
        const o2 = await db.query(
            "INSERT INTO orders (business_id, customer_name, status, created_at, tracking_token) VALUES ($1, 'On Time', 'assigned', NOW() - INTERVAL '10 minutes', $2) RETURNING id",
            [businessId, crypto.randomBytes(16).toString('hex')]
        );

        await checkSLABreaches();

        const delay = await db.query('SELECT * FROM delay_events WHERE business_id=$1', [businessId]);
        expect(delay.rows.length).toBe(1);
        expect(delay.rows[0].order_id).toBe(o1.rows[0].id);

        const notifs = await db.query('SELECT * FROM notifications WHERE business_id=$1 AND type=$2', [businessId, 'sla_breach']);
        expect(notifs.rows.length).toBe(1);
        expect(notifs.rows[0].message).toContain('breached');
        
        // Running it again should not duplicate
        await checkSLABreaches();
        const delay2 = await db.query('SELECT * FROM delay_events WHERE business_id=$1', [businessId]);
        expect(delay2.rows.length).toBe(1);
    });
});
