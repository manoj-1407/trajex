'use strict';
const { Router } = require('express');
const { query, param } = require('express-validator');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const svc = require('./notifications.service');

const router = Router();
router.use(authenticate);

router.get('/', [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    validate
], async (req, res, next) => {
    try { res.json(await svc.getNotifications(req.user.businessId, req.user.id, req.query.page, req.query.limit)); } catch (err) { next(err); }
});

router.patch('/read-all', async (req, res, next) => {
    try { res.json(await svc.markAllRead(req.user.id, req.user.businessId)); } catch (err) { next(err); }
});

router.patch('/:id/read', [
    param('id').isUUID(),
    validate
], async (req, res, next) => {
    try {
        const notif = await svc.markRead(req.params.id, req.user.id, req.user.businessId);
        if (!notif) return res.status(404).json({ error: 'Notification not found' });
        res.json(notif);
    } catch (err) { next(err); }
});

module.exports = router;
