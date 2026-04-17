'use strict';
const { Router } = require('express');
const { param } = require('express-validator');
const validate = require('../../middleware/validate');
const svc = require('./tracking.service');

const router = Router();

router.get('/:token', [
    param('token').isLength({ min: 16, max: 64 }),
    validate,
], async (req, res, next) => {
    try {
        const order = await svc.getByToken(req.params.token);
        if (!order) return res.status(404).json({ error: 'Tracking information not found' });
        res.json(order);
    } catch (err) { next(err); }
});

module.exports = router;
