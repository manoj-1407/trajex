'use strict';
const db = require('../../config/db');

async function getByToken(token) {
    const result = await db.query(
        `SELECT 
            o.id, 
            o.customer_name AS "customerName", 
            o.status, 
            o.priority, 
            o.drop_address AS "dropAddress", 
            o.expected_delivery_at AS "expectedDeliveryAt", 
            o.is_delayed AS "isDelayed", 
            o.tracking_token AS "trackingToken", 
            o.created_at AS "createdAt", 
            dp.name AS "riderName", 
            dp.vehicle_type AS "vehicleType", 
            dp.last_lat AS "riderLat", 
            dp.last_lng AS "riderLng", 
            dp.last_seen_at AS "lastSeenAt", 
            b.name AS "businessName", 
            b.logo_url AS "logoUrl", 
            b.accent_color AS "accentColor" 
         FROM orders o 
         LEFT JOIN delivery_partners dp ON dp.id = o.rider_id 
         JOIN businesses b ON b.id = o.business_id 
         WHERE o.tracking_token = $1`,
        [token]
    );
    if (result.rows.length === 0) return null;
    const events = await db.query('SELECT type, lat, lng, notes, created_at AS "createdAt" FROM tracking_events WHERE order_id = $1 ORDER BY created_at ASC', [result.rows[0].id]);
    return { ...result.rows[0], timeline: events.rows };
}

module.exports = { getByToken };
