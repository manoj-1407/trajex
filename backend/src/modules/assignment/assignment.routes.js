'use strict';
const { Router } = require('express');
const { query } = require('express-validator');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const svc = require('./assignment.service');

const router = Router();
router.use(authenticate);

router.get('/suggest', [
    query('orderId').isUUID(),
    validate,
], async (req, res, next) => {
    try {
        const result = await svc.suggestRiders(req.user.businessId, req.query.orderId);
        if (!result) return res.status(404).json({ error: 'Order not found' });
        if (result.error) return res.status(400).json({ error: result.error });
        res.json(result);
    } catch (err) { next(err); }
});

module.exports = router;
