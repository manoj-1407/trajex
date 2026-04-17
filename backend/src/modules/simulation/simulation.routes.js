'use strict';
const express = require('express');
const router = express.Router();
const simService = require('./simulation.service');
const { requireAuth, requireRole } = require('../../middleware/auth');

// Note: In a real production system, these would be heavily guarded or restricted to dev/staging.
// For the final handover, we expose them to the 'owner' for demonstration purposes.

router.post('/start', requireAuth, requireRole(['owner']), async (req, res, next) => {
    try {
        const result = await simService.startChaos(req.user.businessId);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
});

router.post('/stop', requireAuth, requireRole(['owner']), async (req, res, next) => {
    try {
        const result = await simService.stopChaos(req.user.businessId);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
