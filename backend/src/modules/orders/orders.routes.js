'use strict';
const { Router } = require('express');
const { body, query, param } = require('express-validator');
const { authenticate } = require('../../middleware/auth');
const { requireMinRole } = require('../../middleware/rbac');
const validate = require('../../middleware/validate');
const svc = require('./orders.service');

const router = Router();
router.use(authenticate);

const VALID_STATUSES = ['pending','confirmed','assigned','picked_up','in_transit','delivered','cancelled','failed'];

router.get('/', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(VALID_STATUSES),
    query('riderId').optional().isUUID(),
    validate,
], async (req, res, next) => {
    try { res.json(await svc.getOrders(req.user.businessId, req.query)); } catch (err) { next(err); }
});

router.get('/export', requireMinRole('manager'), [
    query('status').optional().isIn(VALID_STATUSES),
    query('riderId').optional().isUUID(),
    validate,
], async (req, res, next) => {
    try {
        const { status, riderId } = req.query;
        const csv = await svc.exportOrders(req.user.businessId, { status, riderId });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
        res.send(csv);
    } catch (err) { next(err); }
});

router.get('/:id', [param('id').isUUID(), validate], async (req, res, next) => {
    try {
        const order = await svc.getOrder(req.user.businessId, req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) { next(err); }
});

router.get('/:id/timeline', [param('id').isUUID(), validate], async (req, res, next) => {
    try {
        const timeline = await svc.getOrderTimeline(req.user.businessId, req.params.id);
        res.json(timeline);
    } catch (err) { next(err); }
});

router.post('/', [
    body('customerName').trim().notEmpty().withMessage('Customer name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Customer name must be between 2 and 100 characters'),
    body('dropAddress').trim().notEmpty().withMessage('Drop address is required')
        .isLength({ min: 5, max: 255 }).withMessage('Drop address must be between 5 and 255 characters'),
    body('customerPhone').optional({ nullable: true }).trim()
        .matches(/^\+?[1-9]\d{6,14}$/).withMessage('Valid phone number required (+E.164 format)'),
    body('storeId').optional({ nullable: true }).isUUID().withMessage('Invalid store ID format'),
    body('channel').optional().trim().isLength({ max: 50 }),
    body('pickupLat').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('pickupLng').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('dropLat').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('dropLng').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('priority').optional().isIn(['low','normal','high','urgent']),
    body('slaMinutes').optional().isInt({ min: 5, max: 10080 }).withMessage('SLA must be between 5 minutes and 1 week'),
    body('notes').optional({ nullable: true }).isString().isLength({ max: 1000 }),
    body('items').optional().isArray(),
    body('items.*.productId').optional({ nullable: true }).isUUID(),
    body('items.*.name').optional().trim().isLength({ min: 1, max: 200 }),
    body('items.*.price').optional().isFloat({ min: 0 }),
    body('items.*.qty').optional().isInt({ min: 1, max: 1000 }),
    body('items.*.tax').optional().isFloat({ min: 0 }),
    validate,
], async (req, res, next) => {
    try { res.status(201).json(await svc.createOrder(req.user.businessId, req.user.id, req.body)); } catch (err) { next(err); }
});

router.patch('/:id/status', [
    param('id').isUUID(),
    body('status').isIn(VALID_STATUSES),
    validate,
], async (req, res, next) => {
    try {
        const result = await svc.updateStatus(req.user.businessId, req.params.id, req.body.status, req.user.id, req.io);
        if (!result) return res.status(404).json({ error: 'Order not found' });
        await req.audit({ action: 'order.status_update', entityType: 'order', entityId: req.params.id, before: result.before, after: result.after });
        res.json(result.after);
    } catch (err) { next(err); }
});

router.post('/:id/assign', [
    param('id').isUUID(),
    body('riderId').isUUID(),
    validate,
], async (req, res, next) => {
    try {
        const result = await svc.assignRider(req.user.businessId, req.params.id, req.body.riderId, req.user.id, req.io);
        if (!result) return res.status(404).json({ error: 'Order not found' });
        if (result.error) return res.status(400).json({ error: result.error });
        res.json(result);
    } catch (err) { next(err); }
});

module.exports = router;
