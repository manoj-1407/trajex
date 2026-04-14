'use strict';
require('./setup');
const request = require('supertest');
const { app } = require('../src/app');
const db = require('../src/config/db');
const crypto = require('crypto');

const RUN = Date.now();

describe('Refresh Token Replay Detection', () => {
    let bzId, userId;
    let t1Cookies, t2Cookies;

    beforeAll(async () => {
        const reg = await request(app).post('/api/v1/auth/register').send({
            businessName: `Replay Biz ${RUN}`,
            name: 'Replay User',
            email: `replay-${RUN}@trajex.test`,
            password: 'Test@1234!',
        });
        bzId = reg.body.user.businessId;
        userId = reg.body.user.id;

        // This registration creates Token 1 (`tx_refresh` cookie)
        t1Cookies = reg.headers['set-cookie'];

        // Login again to legitimately create Token 2 (e.g. from another device)
        const login = await request(app).post('/api/v1/auth/login').send({
            email: `replay-${RUN}@trajex.test`,
            password: 'Test@1234!',
        });
        t2Cookies = login.headers['set-cookie'];
    });

    afterAll(async () => {
        try {
            await db.query(`DELETE FROM businesses WHERE id = $1`, [bzId]);
        } catch {}
        await db.pool.end().catch(() => {});
    });

    test('Logout correctly revokes Token 1', async () => {
        // Logout using Token 1
        const res = await request(app)
            .post('/api/v1/auth/logout')
            .set('Cookie', t1Cookies);
        
        expect(res.status).toBe(200);

        // Verify in DB it is revoked
        const dbRes = await db.query('SELECT is_revoked FROM refresh_tokens WHERE user_id = $1', [userId]);
        // Note: Two tokens exist. T1 is revoked, T2 is not.
        const rowCount = dbRes.rows.filter(r => r.is_revoked).length;
        expect(rowCount).toBeGreaterThanOrEqual(1);
    });

    test('Reusing revoked Token 1 invalidates ALL tokens (Replay Detection)', async () => {
        // Use T1 again (replay attack)
        const replayRes = await request(app)
            .post('/api/v1/auth/refresh')
            .set('Cookie', t1Cookies);
        
        expect(replayRes.status).toBe(401);
        expect(replayRes.body.error).toBe('Refresh token expired or revoked');

        // Check DB: BOTH T1 and T2 should now be revoked
        const dbRes = await db.query('SELECT is_revoked FROM refresh_tokens WHERE user_id = $1', [userId]);
        for (const row of dbRes.rows) {
            expect(row.is_revoked).toBe(true);
        }

        // T2 refresh should now independently fail since it was revoked by T1's replay
        const t2Res = await request(app)
            .post('/api/v1/auth/refresh')
            .set('Cookie', t2Cookies);
        
        expect(t2Res.status).toBe(401);
    });
});
