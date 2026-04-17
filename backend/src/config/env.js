'use strict';

const required = [
    'NODE_ENV',
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'CORS_ORIGIN',
];

for (const key of required) {
    if (!process.env[key]) {
        throw new Error('Missing required environment variable: ' + key);
    }
}

// Sensible fallbacks for non-fatal variables
if (!process.env.FRONTEND_URL) {
    console.warn('⚠️  WARNING: FRONTEND_URL is not set. Reset password links and email redirects may not function correctly.');
}
if (!process.env.CORS_ORIGIN) {
    console.error('❌ FATAL: CORS_ORIGIN is not set. Access will be blocked. Please set your frontend URL in the environment.');
}

module.exports = {
    NODE_ENV:              process.env.NODE_ENV,
    PORT:                  parseInt(process.env.PORT || '4000', 10),
    DATABASE_URL:          process.env.DATABASE_URL,
    JWT_ACCESS_SECRET:     process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET:    process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN  || '15m',
    JWT_REFRESH_EXPIRES_IN:process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    CORS_ORIGIN:           process.env.CORS_ORIGIN,
    FRONTEND_URL:          process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
    SMTP_HOST:             process.env.SMTP_HOST  || null,
    SMTP_PORT:             parseInt(process.env.SMTP_PORT || '587', 10),
    SMTP_USER:             process.env.SMTP_USER  || null,
    SMTP_PASS:             process.env.SMTP_PASS  || null,
    SMTP_FROM:             process.env.SMTP_FROM  || 'noreply@trajex.io',
    ENABLE_SMS:            process.env.ENABLE_SMS === 'true',
};
