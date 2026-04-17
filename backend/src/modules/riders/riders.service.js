'use strict';
const db = require('../../config/db');

async function getRiders(businessId, { status, page, limit } = {}) {
    const conditions = ['business_id = $1', 'is_active = TRUE'];
    const params = [businessId];
    if (status) { params.push(status); conditions.push('status = $' + params.length); }
    const where = 'WHERE ' + conditions.join(' AND ');
    const countRes = await db.queryForTenant(businessId, 'SELECT COUNT(*) FROM delivery_partners ' + where, [...params]);
    const total = parseInt(countRes.rows[0].count, 10);
    const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const safePage  = Math.max(parseInt(page) || 1, 1);
    params.push(safeLimit); params.push((safePage - 1) * safeLimit);
    const result = await db.queryForTenant(
        businessId,
        `SELECT 
            id, 
            user_id AS "userId", 
            name, 
            phone, 
            vehicle_type AS "vehicleType", 
            status, 
            active_orders AS "activeOrders", 
            reliability_score AS "reliabilityScore", 
            last_lat AS "lastLat", 
            last_lng AS "lastLng", 
            last_seen_at AS "lastSeenAt", 
            created_at AS "createdAt" 
         FROM delivery_partners ${where} 
         ORDER BY status ASC, name ASC 
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
    );
    return { riders: result.rows, total, page: safePage, limit: safeLimit, pages: Math.ceil(total / safeLimit) };
}

async function getRider(businessId, riderId) {
    const result = await db.queryForTenant(
        businessId,
        `SELECT 
            dp.*, 
            dp.user_id AS "userId",
            dp.vehicle_type AS "vehicleType", 
            dp.active_orders AS "activeOrders",
            dp.reliability_score AS "reliabilityScore",
            dp.last_lat AS "lastLat",
            dp.last_lng AS "lastLng",
            dp.last_seen_at AS "lastSeenAt",
            dp.created_at AS "createdAt",
            u.email 
         FROM delivery_partners dp 
         LEFT JOIN users u ON u.id = dp.user_id 
         WHERE dp.id = $1 AND dp.business_id = $2`,
        [riderId, businessId]
    );
    return result.rows[0] || null;
}

async function createRider(businessId, data) {
    // Note: This is for manual creation without a separate user account flow
    // In production, we usually use inviteRider to ensure a user account exists.
    // However, if we use this, we should ensure the associated user (if any) is flagged.
    const { name, phone, vehicleType } = data;
    const result = await db.queryForTenant(
        businessId,
        'INSERT INTO delivery_partners (business_id, name, phone, vehicle_type) VALUES ($1,$2,$3,$4) RETURNING *',
        [businessId, name, phone, vehicleType || 'bike']
    );
    // Standardization: return camelCase
    const r = result.rows[0];
    return {
        id: r.id,
        userId: r.user_id,
        name: r.name,
        phone: r.phone,
        vehicleType: r.vehicle_type,
        status: r.status,
        activeOrders: r.active_orders,
        reliabilityScore: r.reliability_score,
        lastLat: r.last_lat,
        lastLng: r.last_lng,
        lastSeenAt: r.last_seen_at,
        createdAt: r.created_at
    };
}

async function updateStatus(businessId, riderId, status) {
    const result = await db.queryForTenant(
        businessId,
        'UPDATE delivery_partners SET status = $1 WHERE id = $2 AND business_id = $3 AND is_active = TRUE RETURNING id, status',
        [status, riderId, businessId]
    );
    return result.rows[0] || null;
}

async function updateLocation(businessId, riderId, lat, lng, io) {
    const result = await db.queryForTenant(
        businessId,
        'UPDATE delivery_partners SET last_lat = $1, last_lng = $2, last_seen_at = NOW() WHERE id = $3 AND business_id = $4 RETURNING id, last_lat AS "lastLat", last_lng AS "lastLng", last_seen_at AS "lastSeenAt"',
        [lat, lng, riderId, businessId]
    );
    if (!result.rows[0]) return null;
    if (io) io.to('org:' + businessId).emit('rider-location', { riderId, lastLat: lat, lastLng: lng, timestamp: Date.now() });
    return result.rows[0];
}

async function inviteRider(businessId, inviterUserId, { name, email, phone }) {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return { error: 'An account with this email already exists' };

    const crypto = require('crypto');
    const bcrypt = require('bcryptjs');
    const { sendInviteEmail } = require('../../config/mailer');

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const result = await db.withTenantTransaction(businessId, async (client) => {
        const uRes = await client.query(
            "INSERT INTO users (business_id, email, password_hash, name, phone, role, must_change_password) VALUES ($1,$2,$3,$4,$5,'staff', TRUE) RETURNING id, email, name",
            [businessId, email, passwordHash, name, phone || null]
        );
        const user = uRes.rows[0];
        await client.query(
            "INSERT INTO delivery_partners (user_id, business_id, name, phone, vehicle_type) VALUES ($1,$2,$3,$4,'bike')",
            [user.id, businessId, name, phone || null]
        );
        return user;
    });

    try {
        await sendInviteEmail({ to: email, name, tempPassword });
    } catch (e) {
        require('../../config/logger').error({ err: e }, 'Failed to send invite email');
    }

    return { userId: result.id, email: result.email, message: 'Invitation sent' };
}

module.exports = { getRiders, getRider, createRider, updateStatus, updateLocation, inviteRider };
