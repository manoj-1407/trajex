'use strict';
const { Router } = require('express');
const { query } = require('express-validator');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { requireMinRole } = require('../../middleware/rbac');
const svc = require('./analytics.service');

const router = Router();
router.use(authenticate);
router.use(requireMinRole('staff'));

const validateDays = [
    query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
    validate
];

router.get('/dashboard', async (req, res, next) => {
    try { res.json(await svc.getDashboard(req.user.businessId)); } catch (err) { next(err); }
});

router.get('/orders/trend', async (req, res, next) => {
    try { res.json(await svc.getOrderTrend(req.user.businessId, req.query)); } catch (err) { next(err); }
});

router.get('/daily', validateDays, async (req, res, next) => {
    try { res.json(await svc.getOrdersByDay(req.user.businessId, req.query.days || 7)); } catch (err) { next(err); }
});

router.get('/trend', validateDays, async (req, res, next) => {
    try { res.json(await svc.getDeliveryTimeTrend(req.user.businessId, req.query.days || 7)); } catch (err) { next(err); }
});

router.get('/status-breakdown', validateDays, async (req, res, next) => {
    try { res.json(await svc.getStatusBreakdown(req.user.businessId, req.query.days || 7)); } catch (err) { next(err); }
});

router.get('/top-riders', [
    query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    validate
], async (req, res, next) => {
    try { res.json(await svc.getTopRiders(req.user.businessId, req.query.days || 7, req.query.limit || 5)); } catch (err) { next(err); }
});

router.get('/heatmap', validateDays, async (req, res, next) => {
    try { res.json(await svc.getHourlyHeatmap(req.user.businessId, req.query.days || 30)); } catch (err) { next(err); }
});

module.exports = router;
