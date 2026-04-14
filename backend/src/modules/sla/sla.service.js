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
        const sqlQuery = `
            SELECT o.id, o.business_id, o.customer_name, o.created_at, o.sla_minutes
            FROM orders o
            WHERE o.status IN ('assigned', 'picked_up', 'in_transit')
            AND o.created_at < NOW() - (COALESCE(o.sla_minutes, 45) * INTERVAL '1 minute')
            AND NOT EXISTS (
                SELECT 1 FROM delay_events de WHERE de.order_id = o.id AND de.reason_code = 'sla_breach'
            )
        `;
        const result = await query(sqlQuery);
        
        for (const order of result.rows) {
            try {
                // Ensure all DB mutations for this specific order are scoped to its tenant
                await withTenantTransaction(order.business_id, async (client) => {
                    await client.query(
                        `INSERT INTO delay_events (business_id, order_id, reason_code) VALUES ($1, $2, $3)`,
                        [order.business_id, order.id, 'sla_breach']
                    );
                    
                    const users = await client.query(
                        `SELECT id FROM users WHERE business_id = $1 AND role IN ('owner', 'manager')`,
                        [order.business_id]
                    );
                    
                    for (const u of users.rows) {
                        await createNotification(
                            order.business_id,
                            u.id,
                            'sla_breach',
                            'SLA Breach Detected',
                            `Order ${order.id} for ${order.customer_name} has breached its ${order.sla_minutes || 45}-minute SLA.`,
                            { orderId: order.id },
                            _io
                        ).catch(() => {});
                    }
                });

                if (_io) {
                    _io.to('org:' + order.business_id).emit('sla-breach', {
                        orderId: order.id,
                        customerName: order.customer_name,
                        createdAt: order.created_at
                    });
                }
            } catch (innerErr) {
                logger.error({ err: innerErr, orderId: order.id }, 'Error processing individual SLA breach');
            }
        }
        if (result.rows.length > 0) {
            logger.info({ count: result.rows.length }, 'Processed SLA breaches');
        }
    } catch (err) {
        logger.error({ err }, 'Error checking SLA breaches');
    }
}

module.exports = { checkSLABreaches, setIo };
