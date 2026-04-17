'use strict';
require('./setup');
const request = require('supertest');
const { app } = require('../src/app');
const db = require('../src/config/db');
const { cleanupBusiness } = require('./cleanup');

const RUN = Date.now();

describe('Tenant Isolation', () => {
    let tokenA, tokenB;
    let bzIdA, bzIdB;
    let orderIdB;

    beforeAll(async () => {
        // Register Biz A
        const regA = await request(app).post('/api/v1/auth/register').send({
            businessName: `Biz A ${RUN}`,
            name: 'Owner A',
            email: `owner-a-${RUN}@trajex.test`,
            password: 'Test@1234!',
        });
        tokenA = regA.body.accessToken;
        bzIdA = regA.body.user.businessId;

        // Register Biz B
        const regB = await request(app).post('/api/v1/auth/register').send({
            businessName: `Biz B ${RUN}`,
            name: 'Owner B',
            email: `owner-b-${RUN}@trajex.test`,
            password: 'Test@1234!',
        });
        tokenB = regB.body.accessToken;
        bzIdB = regB.body.user.businessId;

        // Create order in Biz B
        const orderRes = await request(app)
            .post('/api/v1/orders')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({
                customerName: 'Customer B',
                dropAddress: '123 B Street',
                priority: 'normal'
            });
        orderIdB = orderRes.body.id;
    });

    afterAll(async () => {
        await cleanupBusiness(db, bzIdA);
        await cleanupBusiness(db, bzIdB);
        await db.pool.end().catch(() => {});
    });

    test('Biz A cannot access Biz B order via GET /orders/:id', async () => {
        const res = await request(app)
            .get(`/api/v1/orders/${orderIdB}`)
            .set('Authorization', `Bearer ${tokenA}`);
        
        // Ensure it is not found because it's filtered by tenant ID
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Order not found');
    });

    test('Biz A cannot see Biz B orders in GET /orders list', async () => {
        const res = await request(app)
            .get(`/api/v1/orders`)
            .set('Authorization', `Bearer ${tokenA}`);
        
        expect(res.status).toBe(200);
        // Should find 0 orders for Biz A
        const foundOrder = res.body.orders.find(o => o.id === orderIdB);
        expect(foundOrder).toBeUndefined();
    });
});
