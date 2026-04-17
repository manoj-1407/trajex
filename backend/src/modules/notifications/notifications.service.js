'use strict';
const db = require('../../config/db');

async function getNotifications(businessId, userId, page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const safePage  = Math.max(parseInt(page) || 1, 1);
    const offset = (safePage - 1) * safeLimit;
    
    const countRes = await db.queryForTenant(businessId, 'SELECT COUNT(*) FROM notifications WHERE business_id=$1 AND user_id=$2', [businessId, userId]);
    const total = parseInt(countRes.rows[0].count, 10);
    
    const result = await db.queryForTenant(
        businessId,
        'SELECT id, type, title, message, metadata, read_at AS "readAt", created_at AS "createdAt" FROM notifications WHERE business_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
        [businessId, userId, safeLimit, offset]
    );
    return { notifications: result.rows, total, page: safePage, limit: safeLimit, pages: Math.ceil(total / safeLimit) };
}

async function markRead(notificationId, userId, businessId) {
    const result = await db.queryForTenant(
        businessId,
        'UPDATE notifications SET read_at=NOW() WHERE id=$1 AND user_id=$2 AND business_id=$3 AND read_at IS NULL RETURNING id, read_at AS "readAt"',
        [notificationId, userId, businessId]
    );
    return result.rows[0] || null;
}

async function markAllRead(userId, businessId) {
    await db.queryForTenant(
        businessId,
        'UPDATE notifications SET read_at=NOW() WHERE user_id=$1 AND business_id=$2 AND read_at IS NULL',
        [userId, businessId]
    );
    return { message: 'All notifications marked as read' };
}

async function createNotification(businessId, userId, type, title, message, metadata = {}, io) {
    const result = await db.queryForTenant(
        businessId,
        'INSERT INTO notifications (business_id, user_id, type, title, message, metadata) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, type, title, message, metadata, created_at AS "createdAt"',
        [businessId, userId, type, title, message, metadata]
    );
    const notification = result.rows[0];
    if (io) {
        io.to('org:' + businessId).emit('notification', notification);
    }
    return notification;
}

module.exports = { getNotifications, markRead, markAllRead, createNotification };
