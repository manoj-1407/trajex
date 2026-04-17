'use strict';
const db = require('../config/db');
const logger = require('../config/logger');

module.exports = function auditMiddleware(req, _res, next) {
    req.audit = async ({ action, entityType, entityId, before, after }) => {
        try {
            await db.query(
                `INSERT INTO audit_logs
                    (business_id, actor_id, action, entity_type, entity_id, before_state, after_state, ip)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [
                    req.user?.businessId || null,
                    req.user?.id || null,
                    action,
                    entityType,
                    entityId || null,
                    before ? JSON.stringify(before) : null,
                    after  ? JSON.stringify(after)  : null,
                    req.ip || null,
                ]
            );
        } catch (err) {
            logger.error({ err }, 'audit log write failed');
        }
    };
    next();
};
