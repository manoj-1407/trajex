'use strict';
require('./setup');
const request = require('supertest');
const { app, httpServer } = require('../src/app');
const db = require('../src/config/db');
const { cleanupBusiness } = require('./cleanup');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { io: Client } = require('socket.io-client');

const RUN = Date.now();

describe('Security and Permission Escalation', () => {
    let bzId, ownerToken, staffToken;

    beforeAll(async () => {
        await new Promise(resolve => httpServer.listen(0, resolve));
        const reg = await request(app).post('/api/v1/auth/register').send({
            businessName: `Sec Biz ${RUN}`,
            name: 'Sec Owner',
            email: `sec-user-${RUN}@trajex.test`,
            password: 'Test@1234!',
        });
        bzId = reg.body.user.businessId;
        ownerToken = reg.body.accessToken;

        // Manually create a staff user using raw DB
        const staffRes = await db.query(
            "INSERT INTO users (business_id, email, password_hash, name, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, name, role, business_id",
            [bzId, `staff-${RUN}@trajex.test`, 'dummyhash', 'Staff', 'staff']
        );
        const staffUser = staffRes.rows[0];
        
        staffToken = jwt.sign(
            { id: staffUser.id, businessId: staffUser.business_id, role: staffUser.role, email: staffUser.email },
            env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );
    });

    afterAll(async () => {
        await cleanupBusiness(db, bzId);
        await new Promise(resolve => httpServer.close(resolve));
        await db.pool.end().catch(() => {});
    });

    test('Staff JWT returns 403 on manager-only routes (PATCH /settings)', async () => {
        const res = await request(app)
            .patch('/api/v1/settings')
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ name: 'Hacked Name' });
        
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Insufficient permissions');
    });

    test('Owner JWT allows manager-only routes', async () => {
        const res = await request(app)
            .patch('/api/v1/settings')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ name: `Sec Biz Renamed ${RUN}` });
        
        expect(res.status).toBe(200);
    });

    test('Invalid JWT returns 401', async () => {
        const res = await request(app)
            .get('/api/v1/orders')
            .set('Authorization', `Bearer invalid.jwt.token`);
        
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid token');
    });

    test('Missing auth header returns 401', async () => {
        const res = await request(app)
            .get('/api/v1/orders');
        
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Authentication required');
    });

    test('Unauthenticated socket cannot join org room', (done) => {
        // Find assigned dynamic port
        const port = httpServer.address().port;
        const clientSocket = Client(`http://localhost:${port}`);
        
        clientSocket.on('connect', () => {
            clientSocket.emit('join-org', bzId);
        });

        clientSocket.on('error', (err) => {
            expect(err.message).toBe('Authentication required');
            clientSocket.disconnect();
            done();
        });
    });
});
