'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../../middleware/auth');
const { requireMinRole } = require('../../middleware/rbac');
const validate = require('../../middleware/validate');
const svc = require('./settings.service');

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
    try {
        const settings = await svc.getSettings(req.user.businessId);
        if (!settings) return res.status(404).json({ error: 'Business not found' });
        res.json(settings);
    } catch (err) { next(err); }
});

router.patch('/', requireMinRole('manager'), [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('accentColor').optional().matches(/^#[0-9a-fA-F]{6}$/),
    body('slaDefaultMinutes').optional().isInt({ min: 5, max: 1440 }),
    body('timezone').optional().isString(),
    body('webhookUrl').optional({ nullable: true }).isURL({ require_tld: false }),
    body('webhookSecret').optional({ nullable: true }).isString(),
    validate,
], async (req, res, next) => {
    try {
        const updated = await svc.updateSettings(req.user.businessId, req.body);
        await req.audit({ action: 'settings.update', entityType: 'business', entityId: req.user.businessId, after: req.body });
        res.json(updated);
    } catch (err) { next(err); }
});

module.exports = router;
