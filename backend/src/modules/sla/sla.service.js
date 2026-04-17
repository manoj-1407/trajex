const { query, withTenantTransaction } = require('../../config/db');
const { createNotification } = require('../notifications/notifications.service');
const logger = require('../../config/logger');

let _io = null;

function setIo(io) { _io = io; }

/**
 * Background job to check for SLA breaches across all tenants.
 * Properly wraps side-effects in withTenantTransaction to ensure RLS compatibility.
 */
async function checkSLABreaches() {
    try {
        // 1. Check for actual breaches
        const breachResult = await query(`
            SELECT o.id, o.business_id, o.customer_name, o.created_at, o.sla_minutes
            FROM orders o
            WHERE o.status IN ('assigned', 'picked_up', 'in_transit')
            AND o.created_at < NOW() - (COALESCE(o.sla_minutes, 45) * INTERVAL '1 minute')
            AND NOT EXISTS (
                SELECT 1 FROM delay_events de WHERE de.order_id = o.id AND de.reason_code = 'sla_breach'
            )
        `);
        
        for (const order of breachResult.rows) {
            await processSLAEvent(order, 'sla_breach', 'SLA Breach Detected', 'has breached its');
        }

        // 2. Check for "Early Warnings" (10 minutes remaining)
        const warningResult = await query(`
            SELECT o.id, o.business_id, o.customer_name, o.created_at, o.sla_minutes
            FROM orders o
            WHERE o.status IN ('assigned', 'picked_up', 'in_transit', 'confirmed')
            AND o.created_at < NOW() - ((COALESCE(o.sla_minutes, 45) - 10) * INTERVAL '1 minute')
            AND o.created_at > NOW() - (COALESCE(o.sla_minutes, 45) * INTERVAL '1 minute')
            AND NOT EXISTS (
                SELECT 1 FROM delay_events de WHERE de.order_id = o.id AND de.reason_code IN ('sla_breach', 'sla_warning')
            )
        `);

        for (const order of warningResult.rows) {
            await processSLAEvent(order, 'sla_warning', 'SLA Early Warning', 'is within 10 minutes of breaching its');
        }

        if (breachResult.rows.length > 0 || warningResult.rows.length > 0) {
            logger.info({ breaches: breachResult.rows.length, warnings: warningResult.rows.length }, 'Processed SLA checks');
        }
    } catch (err) {
        logger.error({ err }, 'Error checking SLA status');
    }
}

async function processSLAEvent(order, code, title, phrase) {
    try {
        await withTenantTransaction(order.business_id, async (client) => {
            await client.query(
                `INSERT INTO delay_events (business_id, order_id, reason_code) VALUES ($1, $2, $3)`,
                [order.business_id, order.id, code]
            );
            
            const users = await client.query(
                `SELECT id FROM users WHERE business_id = $1 AND role IN ('owner', 'manager')`,
                [order.business_id]
            );
            
            for (const u of users.rows) {
                await createNotification(
                    order.business_id, u.id, code, title,
                    `Order ${order.id.substring(0,8)} for ${order.customer_name} ${phrase} ${order.sla_minutes || 45}-minute SLA.`,
                    { orderId: order.id }, _io
                ).catch(() => {});
            }
        });

        if (_io) {
            _io.to('org:' + order.business_id).emit('sla-update', {
                orderId: order.id,
                type: code,
                customerName: order.customer_name
            });
        }
    } catch (err) {
        logger.error({ err, orderId: order.id, code }, 'Error processing SLA event');
    }
}

module.exports = { checkSLABreaches, setIo };
