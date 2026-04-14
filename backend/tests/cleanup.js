'use strict';

/**
 * Global cleanup helper for tests
 * Handles dependencies and triggers correctly
 */
async function cleanupBusiness(db, businessId) {
    if (!businessId) return;
    
    try {
        await db.query('DELETE FROM notifications WHERE business_id = $1', [businessId]);
        await db.query('DELETE FROM delay_events WHERE business_id = $1', [businessId]);
        await db.query('DELETE FROM tracking_events WHERE order_id IN (SELECT id FROM orders WHERE business_id = $1)', [businessId]);
        await db.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE business_id = $1)', [businessId]);
        await db.query('DELETE FROM orders WHERE business_id = $1', [businessId]);
        await db.query('DELETE FROM delivery_partners WHERE business_id = $1', [businessId]);
        await db.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE business_id = $1)', [businessId]);
        
        // Audit logs protection bypass
        await db.query('ALTER TABLE audit_logs DISABLE TRIGGER trg_prevent_audit_mod');
        await db.query('DELETE FROM audit_logs WHERE business_id = $1', [businessId]);
        await db.query('ALTER TABLE audit_logs ENABLE TRIGGER trg_prevent_audit_mod');

        await db.query('DELETE FROM users WHERE business_id = $1', [businessId]);
        await db.query('DELETE FROM businesses WHERE id = $1', [businessId]);
    } catch (err) {
        console.error(`[Cleanup Error] Business ${businessId}:`, err.message);
    }
}

module.exports = { cleanupBusiness };
