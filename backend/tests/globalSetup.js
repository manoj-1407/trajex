'use strict';
const { Pool } = require('pg');
const { execSync } = require('child_process');

module.exports = async () => {
    // We recreate the schema cleanly before ALL test suites run
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error('DATABASE_URL must be set for test execution. Check your .env file.');
    }
    const pool = new Pool({ connectionString: url });
    try {
        // Drop and recreate public schema for a truly blank slate
        await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS pgcrypto;');
        
        console.log('Running migrations for test database...');
        // Execute migrations via CLI to ensure test DB matches production schemaExactly
        execSync('npx node-pg-migrate up', {
            env: { ...process.env, DATABASE_URL: url },
            stdio: 'inherit'
        });
        console.log('Migrations complete.');
        
    } catch (err) {
        console.error('Failed to run global test setup migrations', err);
        throw err;
    } finally {
        await pool.end();
    }
};
