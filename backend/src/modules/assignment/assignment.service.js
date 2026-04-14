'use strict';
const db = require('../../config/db');

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = (v) => v * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function suggestRiders(businessId, orderId) {
    const orderRes = await db.queryForTenant(businessId, 'SELECT pickup_lat, pickup_lng FROM orders WHERE id = $1 AND business_id = $2', [orderId, businessId]);
    if (orderRes.rows.length === 0) return null;
    const { pickup_lat, pickup_lng } = orderRes.rows[0];
    if (!pickup_lat || !pickup_lng) return { error: 'Order has no pickup coordinates.' };
    const ridersRes = await db.queryForTenant(
        businessId,
        "SELECT id, name, phone, vehicle_type, active_orders, reliability_score, last_lat, last_lng FROM delivery_partners WHERE business_id = $1 AND status = 'available' AND is_active = TRUE AND last_lat IS NOT NULL AND last_lng IS NOT NULL",
        [businessId]
    );
    const scored = ridersRes.rows.map((r) => {
        const distKm      = haversineKm(pickup_lat, pickup_lng, r.last_lat, r.last_lng);
        const distPenalty = Math.min(distKm / 10, 1);
        const loadPenalty = r.active_orders * 0.15;
        const relBoost    = (parseFloat(r.reliability_score) / 5) * 0.2;
        const score       = Math.max(0, 1 - distPenalty - loadPenalty + relBoost);
        return { id: r.id, name: r.name, phone: r.phone, vehicleType: r.vehicle_type, activeOrders: r.active_orders, reliabilityScore: parseFloat(r.reliability_score), distKm: Math.round(distKm * 100) / 100, score: Math.round(score * 1000) / 1000 };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
    return { pickupLat: pickup_lat, pickupLng: pickup_lng, suggestions: scored };
}

module.exports = { suggestRiders };
