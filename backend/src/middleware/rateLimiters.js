'use strict';
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (process.env.NODE_ENV !== 'production' && req.headers['x-test-ip']) || req.ip,
    message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (process.env.NODE_ENV !== 'production' && req.headers['x-test-ip']) || req.ip,
    message: { error: 'Too many reset attempts. Try again in 1 hour.' },
});

const inviteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (process.env.NODE_ENV !== 'production' && req.headers['x-test-ip']) || req.ip,
    message: { error: 'Too many invites. Try again in 1 hour.' },
});

module.exports = { apiLimiter, authLimiter, forgotPasswordLimiter, inviteLimiter };
