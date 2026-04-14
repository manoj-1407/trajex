'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../config/db');
const env = require('../../config/env');
const logger = require('../../config/logger');
const { sendPasswordResetEmail } = require('../../config/mailer');

const REFRESH_COOKIE = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
};

function signAccess(user) {
    return jwt.sign(
        { id: user.id, businessId: user.business_id, role: user.role, email: user.email },
        env.JWT_ACCESS_SECRET,
        { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );
}

async function storeRefresh(userId, rawToken, req) {
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip, user_agent) VALUES ($1,$2,$3,$4,$5)',
        [userId, hash, expiresAt, req.ip, req.headers['user-agent'] || null]
    );
}

async function register(req, res, next) {
    try {
        const { businessName, password, name, phone } = req.body;
        const email = req.body.email.trim().toLowerCase();
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) return res.status(409).json({ error: 'An account with this email already exists' });

        let slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const slugExists = await db.query('SELECT id FROM businesses WHERE slug = $1', [slug]);
        if (slugExists.rows.length > 0) slug += '-' + crypto.randomBytes(3).toString('hex');

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await db.withTransaction(async (client) => {
            const biz = await client.query('INSERT INTO businesses (name, slug) VALUES ($1,$2) RETURNING id', [businessName, slug]);
            const bizId = biz.rows[0].id;
            const u = await client.query(
                'INSERT INTO users (business_id, email, password_hash, name, phone, role) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, email, name, role, business_id',
                [bizId, email, passwordHash, name, phone || null, 'owner']
            );
            return u.rows[0];
        });

        const accessToken = signAccess(user);
        const refreshRaw = crypto.randomBytes(64).toString('hex');
        await storeRefresh(user.id, refreshRaw, req);
        res.cookie('tx_refresh', refreshRaw, REFRESH_COOKIE);
        return res.status(201).json({
            accessToken,
            user: { id: user.id, email: user.email, name: user.name, role: user.role, businessId: user.business_id },
        });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { password } = req.body;
        const email = req.body.email.trim().toLowerCase();
        const result = await db.query(
            'SELECT id, email, name, role, password_hash, is_active, business_id FROM users WHERE email = $1',
            [email]
        );
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
        const user = result.rows[0];
        if (!user.is_active) return res.status(403).json({ error: 'Account is disabled. Contact your administrator.' });
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

        const accessToken = signAccess(user);
        const refreshRaw = crypto.randomBytes(64).toString('hex');
        await storeRefresh(user.id, refreshRaw, req);
        res.cookie('tx_refresh', refreshRaw, REFRESH_COOKIE);
        return res.status(200).json({
            accessToken,
            user: { id: user.id, email: user.email, name: user.name, role: user.role, businessId: user.business_id },
        });
    } catch (err) {
        next(err);
    }
}

async function refresh(req, res, next) {
    try {
        const rawToken = req.cookies?.tx_refresh;
        if (!rawToken) return res.status(401).json({ error: 'No refresh token' });
        const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const result = await db.query(
            'SELECT rt.id, rt.user_id, rt.expires_at, rt.is_revoked, u.email, u.name, u.role, u.business_id, u.is_active FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id WHERE rt.token_hash = $1',
            [hash]
        );
        if (result.rows.length === 0) {
            res.clearCookie('tx_refresh', { path: '/api/v1/auth' });
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        const rt = result.rows[0];
        if (rt.is_revoked || new Date(rt.expires_at) < new Date()) {
            res.clearCookie('tx_refresh', { path: '/api/v1/auth' });
            if (rt.is_revoked) {
                await db.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [rt.user_id]);
                logger.warn({ event: 'refresh_replay', userId: rt.user_id, ip: req.ip, ua: req.headers['user-agent'] }, 'Refresh token replay detected');
            } else {
                await db.query('DELETE FROM refresh_tokens WHERE id = $1', [rt.id]);
            }
            return res.status(401).json({ error: 'Refresh token expired or revoked' });
        }
        if (!rt.is_active) return res.status(403).json({ error: 'Account disabled' });
        await db.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1', [rt.id]);
        const user = { id: rt.user_id, business_id: rt.business_id, role: rt.role, email: rt.email };
        const accessToken = signAccess(user);
        const newRaw = crypto.randomBytes(64).toString('hex');
        await storeRefresh(rt.user_id, newRaw, req);
        res.cookie('tx_refresh', newRaw, REFRESH_COOKIE);
        return res.status(200).json({ accessToken });
    } catch (err) {
        next(err);
    }
}

async function logout(req, res, next) {
    try {
        const rawToken = req.cookies?.tx_refresh;
        if (rawToken) {
            const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
            await db.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1', [hash]);
        }
        res.clearCookie('tx_refresh', { path: '/api/v1/auth' });
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
}

async function forgotPassword(req, res, next) {
    try {
        const GENERIC = { message: 'If an account exists with that email, a reset link has been sent.' };
        const email = req.body.email.trim().toLowerCase();
        const result = await db.query('SELECT id, name, email FROM users WHERE email = $1 AND is_active = TRUE', [email]);
        if (result.rows.length === 0) return res.status(200).json(GENERIC);
        const user = result.rows[0];
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
        await db.query('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)', [user.id, tokenHash, expiresAt]);
        const resetUrl = env.CORS_ORIGIN + '/reset-password?token=' + rawToken;
        try {
            await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
        } catch (err) {
            logger.error({ err }, 'failed to send reset email');
        }
        return res.status(200).json(GENERIC);
    } catch (err) {
        next(err);
    }
}

async function resetPassword(req, res, next) {
    try {
        const { token, password } = req.body;
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const result = await db.query('SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1', [tokenHash]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired reset token' });
        const prt = result.rows[0];
        if (prt.used_at || new Date(prt.expires_at) < new Date()) return res.status(400).json({ error: 'Invalid or expired reset token' });
        const passwordHash = await bcrypt.hash(password, 12);
        await db.withTransaction(async (client) => {
            await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, prt.user_id]);
            await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [prt.id]);
            await client.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1 AND is_revoked = FALSE', [prt.user_id]);
        });
        return res.status(200).json({ message: 'Password updated successfully. Please log in.' });
    } catch (err) {
        next(err);
    }
}

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword };
