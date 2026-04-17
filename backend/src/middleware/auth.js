'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const token = header.slice(7);
    try {
        req.user = jwt.verify(token, env.JWT_ACCESS_SECRET);
        next();
    } catch (err) {
        const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
        return res.status(401).json({ error: msg });
    }
}

function requireAuth(req, res, next) {
    return authenticate(req, res, next);
}

function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
}

module.exports = { authenticate, requireAuth, requireRole };
