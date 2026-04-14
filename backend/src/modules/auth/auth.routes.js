'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiters');
const auth = require('./auth.service');

const router = Router();
const { authenticate } = require('../../middleware/auth');

const passwordRules = [
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
        .matches(/[a-z]/).withMessage('Must contain a lowercase letter')
        .matches(/[0-9]/).withMessage('Must contain a number')
        .matches(/[^A-Za-z0-9]/).withMessage('Must contain a special character'),
];

router.post('/register', [
    body('businessName').trim().isLength({ min: 2, max: 100 }),
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    ...passwordRules,
    body('phone').optional({ nullable: true }).matches(/^\+[1-9]\d{6,14}$/),
    validate,
], auth.register);

router.post('/login', authLimiter, [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate,
], auth.login);

router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);

const { forgotPasswordLimiter } = require('../../middleware/rateLimiters');
router.post('/forgot-password', forgotPasswordLimiter, [
    body('email').isEmail().normalizeEmail(),
    validate,
], auth.forgotPassword);

router.post('/reset-password', [
    body('token').notEmpty(),
    ...passwordRules,
    validate,
], auth.resetPassword);


router.get('/me', authenticate, async (req, res, next) => {
    try {
        const db = require('../../config/db');
        const r = await db.query(
            `SELECT u.id, u.name, u.email, u.role, u.avatar_url,
                    b.name AS business_name, b.slug, b.accent_color
             FROM users u JOIN businesses b ON b.id = u.business_id
             WHERE u.id = $1 AND u.is_active = true`,
            [req.user.id]
        );
        if (!r.rows.length) return res.status(401).json({ error: 'User not found' });
        res.json({ user: r.rows[0] });
    } catch (err) { next(err); }
});

router.patch('/profile', authenticate, [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    validate,
], async (req, res, next) => {
    try {
        const db = require('../../config/db');
        const { name } = req.body;
        const r = await db.query(
            `UPDATE users SET name = COALESCE($1, name) WHERE id = $2 RETURNING id, name, email, role`,
            [name || null, req.user.id]
        );
        res.json(r.rows[0]);
    } catch (err) { next(err); }
});

module.exports = router;
