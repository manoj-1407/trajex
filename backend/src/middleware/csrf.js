'use strict';
const crypto = require('crypto');
const env = require('../config/env');

/**
 * Double-submit cookie pattern CSRF protection.
 * sameSite='none' + secure=true required for cross-origin (Vercel -> Railway).
 * sameSite='lax' used in development for local proxy compatibility.
 */
function csrfTokenGenerate(req, res, next) {
    let token = req.cookies['csrf_token'];
    if (!token) {
        token = crypto.randomBytes(32).toString('hex');
        res.cookie('csrf_token', token, {
            httpOnly: false, // Frontend must read this to send in header
            secure: env.NODE_ENV === 'production', // Must be true for sameSite:none
            sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });
    }
    req.csrfToken = token;
    next();
}

function csrfProtect(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || process.env.NODE_ENV === 'test') return next();

    // Excluded routes that don't need CSRF
    const excluded = [
        '/api/v1/auth/refresh',
        '/api/v1/health'
    ];
    if (excluded.some(p => req.path === p)) return next();
    if (req.path.startsWith('/api/v1/tracking')) return next(); // Public tracking

    const cookieToken = req.cookies['csrf_token'];
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ error: 'CSRF token mismatch or missing' });
    }
    
    next();
}

module.exports = { csrfTokenGenerate, csrfProtect };
