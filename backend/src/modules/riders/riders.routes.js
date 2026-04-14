'use strict';
const { Router } = require('express');
const { body, query, param } = require('express-validator');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const svc = require('./riders.service');

const router = Router();
router.use(authenticate);

const { requireMinRole } = require('../../middleware/rbac');
const { inviteLimiter } = require('../../middleware/rateLimiters');

router.get('/', [
    query('status').optional().isIn(['available','busy','offline']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
], async (req, res, next) => {
    try { res.json(await svc.getRiders(req.user.businessId, req.query)); } catch (err) { next(err); }
});

router.get('/:id', [param('id').isUUID(), validate], async (req, res, next) => {
    try {
        const rider = await svc.getRider(req.user.businessId, req.params.id);
        if (!rider) return res.status(404).json({ error: 'Rider not found' });
        res.json(rider);
    } catch (err) { next(err); }
});

router.post('/invite', requireMinRole('manager'), inviteLimiter, [
    body('name').trim().notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('phone').optional({ nullable: true }).trim()
        .matches(/^\+?[1-9]\d{6,14}$/).withMessage('Valid phone number required (+E.164 format)'),
    validate,
], async (req, res, next) => {
    try {
        const result = await svc.inviteRider(req.user.businessId, req.user.id, req.body);
        if (result.error) return res.status(400).json({ error: result.error });
        res.status(201).json(result);
    } catch (err) { next(err); }
});

router.post('/', [
    body('name').trim().notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }),
    body('phone').trim().matches(/^\+?[1-9]\d{6,14}$/).withMessage('Valid phone number required (+E.164 format)'),
    body('vehicleType').optional().isIn(['bike','scooter','car','van']),
    validate,
], async (req, res, next) => {
    try { res.status(201).json(await svc.createRider(req.user.businessId, req.body)); } catch (err) { next(err); }
});

router.patch('/:id/status', [
    param('id').isUUID(),
    body('status').isIn(['available','busy','offline']),
    validate,
], async (req, res, next) => {
    try {
        const rider = await svc.updateStatus(req.user.businessId, req.params.id, req.body.status);
        if (!rider) return res.status(404).json({ error: 'Rider not found' });
        res.json(rider);
    } catch (err) { next(err); }
});

router.patch('/:id/location', [
    param('id').isUUID(),
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
    validate,
], async (req, res, next) => {
    try {
        const result = await svc.updateLocation(req.user.businessId, req.params.id, req.body.lat, req.body.lng, req.io);
        if (!result) return res.status(404).json({ error: 'Rider not found' });
        res.json(result);
    } catch (err) { next(err); }
});


router.patch('/by-user/location', [
    body('lat').isFloat({ min: -90,  max: 90  }).withMessage('Valid latitude required'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    validate,
], async (req, res, next) => {
    try {
        const riderRes = await require('../../config/db').query(
            'SELECT id FROM delivery_partners WHERE user_id = $1 AND business_id = $2',
            [req.user.id, req.user.businessId]
        );
        if (!riderRes.rows.length) return res.status(404).json({ error: 'No rider profile found for your account' });
        const result = await svc.updateLocation(req.user.businessId, riderRes.rows[0].id, req.body.lat, req.body.lng, req.io);
        res.json(result);
    } catch (err) { next(err); }
});

module.exports = router;
