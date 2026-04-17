'use strict';

const { Pool } = require('pg');
const logger   = require('./logger');
const env      = require('./env');

const pool = new Pool({
    connectionString:        env.DATABASE_URL,
    max:                     20,
    idleTimeoutMillis:       30000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle:         false,
});

pool.on('error', (err) => {
    logger.error({ err }, 'Idle DB client error');
});

async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        if (env.NODE_ENV !== 'production') {
            logger.debug({ ms: Date.now() - start, rows: result.rowCount, q: text.slice(0, 80) }, 'sql');
        }
        return result;
    } catch (err) {
        logger.error({ err, q: text.slice(0, 80) }, 'sql error');
        throw err;
    }
}

async function withTransaction(fn) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

async function testConnection() {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT version()');
        logger.info({ version: result.rows[0].version }, 'Database connected');
    } finally {
        client.release();
    }
}


async function queryForTenant(businessId, text, params = []) {
    const client = await pool.connect();
    try {
        // Set session-level config. 'false' means it persists for the session/connection.
        await client.query("SELECT set_config('app.business_id', $1, false)", [String(businessId)]);
        const result = await client.query(text, params);
        return result;
    } catch (e) {
        throw e;
    } finally {
        // CRITICAL: Reset the session config before returning connection to the pool
        await client.query("SELECT set_config('app.business_id', '', false)").catch(() => {});
        client.release();
    }
}

async function withTenantTransaction(businessId, fn) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.business_id', $1, true)", [String(businessId)]);
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        throw e;
    } finally {
        client.release();
    }
}

module.exports = { pool, query, withTransaction, withTenantTransaction, queryForTenant, testConnection };
