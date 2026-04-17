'use strict';
const db = require('../../config/db');

async function getByToken(token) {
    const result = await db.query(
        'SELECT o.id, o.customer_name, o.status, o.priority, o.drop_address, o.expected_delivery_at, o.is_delayed, o.tracking_token, o.created_at, dp.name AS rider_name, dp.vehicle_type, dp.last_lat AS rider_lat, dp.last_lng AS rider_lng, dp.last_seen_at, b.name AS business_name, b.logo_url, b.accent_color FROM orders o LEFT JOIN delivery_partners dp ON dp.id = o.rider_id JOIN businesses b ON b.id = o.business_id WHERE o.tracking_token = $1',
        [token]
    );
    if (result.rows.length === 0) return null;
    const events = await db.query('SELECT type, lat, lng, notes, created_at FROM tracking_events WHERE order_id = $1 ORDER BY created_at ASC', [result.rows[0].id]);
    return { ...result.rows[0], timeline: events.rows };
}

module.exports = { getByToken };
