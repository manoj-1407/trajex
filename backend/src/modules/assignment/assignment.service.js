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
        "SELECT id, name, phone, vehicle_type AS \"vehicleType\", active_orders AS \"activeOrders\", reliability_score AS \"reliabilityScore\", last_lat AS \"lastLat\", last_lng AS \"lastLng\" FROM delivery_partners WHERE business_id = $1 AND status = 'available' AND is_active = TRUE AND last_lat IS NOT NULL AND last_lng IS NOT NULL",
        [businessId]
    );
    const scored = ridersRes.rows.map((r) => {
        const distKm = haversineKm(pickup_lat, pickup_lng, r.lastLat, r.lastLng);
        
        // Multi-dimensional Scoring Model (Higher is better)
        // 1. Proximity Score (0-100): inverse of distance. Optimal within 2km.
        const proximityScore = Math.max(0, 100 - (distKm * 15)); 
        
        // 2. Load Penalty: -20 per active order
        const loadScore = Math.max(0, 100 - (r.activeOrders * 25));
        
        // 3. Reliability Boost (0-100): based on 1-5 scale
        const reliabilityScore = (parseFloat(r.reliabilityScore) || 3) * 20;
        
        // Weighted Final Score: 50% proximity, 30% load, 20% reliability
        const finalScore = (proximityScore * 0.5) + (loadScore * 0.3) + (reliabilityScore * 0.2);
        
        return { 
            id: r.id, 
            name: r.name, 
            phone: r.phone, 
            vehicleType: r.vehicleType, 
            activeOrders: r.activeOrders, 
            reliabilityScore: parseFloat(r.reliabilityScore), 
            distKm: Math.round(distKm * 100) / 100, 
            score: Math.round(finalScore * 10) / 10,
            tier: finalScore > 85 ? 'ELITE' : finalScore > 65 ? 'OPTIMAL' : 'STANDARD'
        };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
    return { pickupLat: pickup_lat, pickupLng: pickup_lng, suggestions: scored };
}

module.exports = { suggestRiders };
