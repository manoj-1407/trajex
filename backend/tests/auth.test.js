'use strict';
require('./setup');
const request = require('supertest');
const { app, httpServer } = require('../src/app');
const db = require('../src/config/db');
const { cleanupBusiness } = require('./cleanup');

const BASE = '/api/v1';
const RUN = Date.now();
const BIZ = {
  businessName: `TestCo ${RUN}`,
  name: 'Test Owner',
  email: `owner-${RUN}@trajex-test.local`,
  password: 'Test@1234!',
};

let accessToken;

beforeAll(async () => {
  const reg = await request(app).post(`${BASE}/auth/register`).send(BIZ);
  if (reg.status !== 201) throw new Error(`register failed: ${JSON.stringify(reg.body)}`);
  accessToken = reg.body.accessToken;
  if (!accessToken) throw new Error('no accessToken from register');
}, 30000);

afterAll(async () => {
  try {
    const biz = await db.query(`SELECT id FROM businesses WHERE name = $1`, [BIZ.businessName]);
    if (biz.rows[0]) {
      const bizId = biz.rows[0].id;
      await cleanupBusiness(db, bizId);
    }
    if (id2) {
      await cleanupBusiness(db, id2);
    }
  } catch (e) {
    console.error('Cleanup error:', e.message);
  }
  await db.pool.end().catch(() => {});
  httpServer.close();
});

describe('POST /auth/register', () => {
  it('creates business and owner', async () => {
    const RUN2 = RUN + 1;
    const res = await request(app).post(`${BASE}/auth/register`).send({
      businessName: `TestCo ${RUN2}`,
      name: 'Owner B',
      email: `owner-b-${RUN2}@trajex-test.local`,
      password: 'Test@1234!',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    const biz2 = await db.query(`SELECT id FROM businesses WHERE name = $1`, [`TestCo ${RUN2}`]);
    if (biz2.rows[0]) {
      const id2 = biz2.rows[0].id;
      await db.query(`DELETE FROM audit_logs WHERE business_id = $1`, [id2]);
      await db.query(`DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE business_id = $1)`, [id2]);
      await db.query(`DELETE FROM users WHERE business_id = $1`, [id2]);
      await db.query(`DELETE FROM businesses WHERE id = $1`, [id2]);
    }
  });

  it('rejects duplicate email', async () => {
    const res = await request(app).post(`${BASE}/auth/register`).send(BIZ);
    expect([400, 409, 422]).toContain(res.status);
  });

  it('rejects weak password', async () => {
    const res = await request(app).post(`${BASE}/auth/register`).send({
      businessName: `Weak ${RUN}`,
      name: 'Weak',
      email: `weak-${RUN}@trajex-test.local`,
      password: 'weak',
    });
    expect([400, 422]).toContain(res.status);
  });

  it('rejects missing fields', async () => {
    const res = await request(app).post(`${BASE}/auth/register`).send({ email: 'x@x.com' });
    expect([400, 422]).toContain(res.status);
  });
});

describe('POST /auth/login', () => {
  it('returns access token for valid credentials', async () => {
    const res = await request(app)
      .post(`${BASE}/auth/login`)
      .send({ email: BIZ.email, password: BIZ.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post(`${BASE}/auth/login`)
      .send({ email: BIZ.email, password: 'WrongPass@1!' });
    expect(res.status).toBe(401);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app)
      .post(`${BASE}/auth/login`)
      .send({ email: `ghost-${RUN}@nowhere.test`, password: BIZ.password });
    expect(res.status).toBe(401);
  });

  it('rate limits after 5 attempts', async () => {
    const statuses = [];
    const rlIp = `rl-ip-${RUN}`;
    for (let i = 0; i < 6; i++) {
      const r = await request(app)
        .post(`${BASE}/auth/login`)
        .set('X-Test-IP', rlIp)
        .send({ email: `rl-${RUN}@nowhere.test`, password: 'wrong' });
      statuses.push(r.status);
    }
    expect(statuses).toContain(429);
  });
});

describe('Auth middleware', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get(`${BASE}/orders`);
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get(`${BASE}/orders`)
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });

  it('returns 200 with valid token', async () => {
    const res = await request(app)
      .get(`${BASE}/orders`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('orders');
  });
});

describe('POST /auth/logout', () => {
  it('clears refresh cookie', async () => {
    const agent = request.agent(app);
    const login = await agent
      .post(`${BASE}/auth/login`)
      .set('X-Test-IP', `logout-ip-${RUN}`)
      .send({ email: BIZ.email, password: BIZ.password });
    expect(login.status).toBe(200);
    const res = await agent.post(`${BASE}/auth/logout`);
    expect([200, 204]).toContain(res.status);
    const cookies = res.headers['set-cookie'] ?? [];
    const cleared = cookies.some(c =>
      c.includes('Max-Age=0') ||
      c.includes('max-age=0') ||
      /tx_refresh=;/.test(c) ||
      /tx_refresh=\s*;/.test(c)
    );
    expect(cleared).toBe(true);
  });
});

describe('POST /auth/forgot-password', () => {
  it('returns 200 for known email', async () => {
    const res = await request(app)
      .post(`${BASE}/auth/forgot-password`)
      .send({ email: BIZ.email });
    expect(res.status).toBe(200);
  });

  it('returns 200 for unknown email (no info leak)', async () => {
    const res = await request(app)
      .post(`${BASE}/auth/forgot-password`)
      .send({ email: `ghost-${RUN}@nowhere.test` });
    expect(res.status).toBe(200);
  });
});
