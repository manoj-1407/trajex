'use strict';
const crypto = require('crypto');
const db = require('../../config/db');

async function getOrders(businessId, { status, page, limit, search, riderId } = {}) {
    const conditions = ['o.business_id = $1'];
    const params = [businessId];
    if (status) {
        const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
        if (statuses.length === 1) {
            params.push(statuses[0]); conditions.push('o.status = $' + params.length);
        } else {
            params.push(statuses); conditions.push('o.status = ANY($' + params.length + ')');
        }
    }
    if (riderId) { params.push(riderId); conditions.push('o.rider_id = $' + params.length); }
    if (search) { params.push('%' + search + '%'); const n = params.length; conditions.push('(o.customer_name ILIKE $' + n + ' OR o.customer_phone ILIKE $' + n + ')'); }
    const where = 'WHERE ' + conditions.join(' AND ');
    const countRes = await db.queryForTenant(businessId, 'SELECT COUNT(*) FROM orders o ' + where, [...params]);
    const total = parseInt(countRes.rows[0].count, 10);
    const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const safePage  = Math.max(parseInt(page) || 1, 1);
    params.push(safeLimit); params.push((safePage - 1) * safeLimit);
    const result = await db.queryForTenant(
        businessId,
        `SELECT 
            o.id, 
            o.customer_name AS "customerName", 
            o.customer_phone AS "customerPhone", 
            o.status, 
            o.priority, 
            o.drop_address AS "dropAddress", 
            o.total_amount AS "totalAmount", 
            o.tracking_token AS "trackingToken", 
            o.is_delayed AS "isDelayed", 
            o.expected_delivery_at AS "expectedDeliveryAt", 
            o.created_at AS "createdAt", 
            o.updated_at AS "updatedAt", 
            o.rider_id AS "riderId", 
            dp.name AS "riderName", 
            dp.phone AS "riderPhone", 
            s.name AS "storeName" 
         FROM orders o 
         LEFT JOIN delivery_partners dp ON dp.id = o.rider_id 
         LEFT JOIN stores s ON s.id = o.store_id 
         ${where} 
         ORDER BY o.created_at DESC 
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
    );
    return { orders: result.rows, total, page: safePage, limit: safeLimit, pages: Math.ceil(total / safeLimit) };
}

async function getOrder(businessId, orderId) {
    const result = await db.queryForTenant(
        businessId,
        `SELECT 
            o.id, 
            o.customer_name AS "customerName", 
            o.customer_phone AS "customerPhone", 
            o.channel, 
            o.status, 
            o.pickup_lat AS "pickupLat", 
            o.pickup_lng AS "pickupLng", 
            o.drop_lat AS "dropLat", 
            o.drop_lng AS "dropLng", 
            o.drop_address AS "dropAddress", 
            o.priority, 
            o.sla_minutes AS "slaMinutes", 
            o.expected_delivery_at AS "expectedDeliveryAt", 
            o.total_amount AS "totalAmount", 
            o.notes, 
            o.created_at AS "createdAt",
            o.updated_at AS "updatedAt",
            dp.name AS "riderName", 
            dp.phone AS "riderPhone", 
            dp.vehicle_type AS "vehicleType", 
            s.name AS "storeName", 
            s.address AS "storeAddress" 
         FROM orders o 
         LEFT JOIN delivery_partners dp ON dp.id = o.rider_id 
         LEFT JOIN stores s ON s.id = o.store_id 
         WHERE o.id = $1 AND o.business_id = $2`,
        [orderId, businessId]
    );
    if (result.rows.length === 0) return null;
    const items  = await db.queryForTenant(businessId, 'SELECT id, product_id AS "productId", name, qty, price, tax FROM order_items WHERE order_id = $1 ORDER BY id', [orderId]);
    const events = await db.queryForTenant(businessId, 'SELECT te.id, te.type, te.notes, te.created_at AS "createdAt", dp.name AS "riderName" FROM tracking_events te LEFT JOIN delivery_partners dp ON dp.id = te.rider_id WHERE te.order_id = $1 ORDER BY te.created_at ASC', [orderId]);
    return { ...result.rows[0], items: items.rows, tracking: events.rows };
}

async function createOrder(businessId, userId, data) {
    const { customerName, customerPhone, storeId, channel, pickupLat, pickupLng, dropLat, dropLng, dropAddress, priority, slaMinutes, notes, items = [] } = data;
    const token = crypto.randomBytes(16).toString('hex');
    const sla = slaMinutes || 45;
    const expectedAt = new Date(Date.now() + sla * 60 * 1000);
    const order = await db.withTenantTransaction(businessId, async (client) => {
        const orderRes = await client.query(
            `INSERT INTO orders (business_id, store_id, customer_name, customer_phone, channel, pickup_lat, pickup_lng, drop_lat, drop_lng, drop_address, priority, sla_minutes, expected_delivery_at, tracking_token, notes, total_amount) 
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) 
             RETURNING 
                id, 
                customer_name AS "customerName", 
                customer_phone AS "customerPhone", 
                status, 
                expected_delivery_at AS "expectedDeliveryAt", 
                total_amount AS "totalAmount"`,
            [businessId, storeId || null, customerName, customerPhone || null, channel || 'manual', pickupLat || null, pickupLng || null, dropLat || null, dropLng || null, dropAddress || null, priority || 'normal', sla, expectedAt, token, notes || null, items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 1), 0)]
        );
        const orderObj = orderRes.rows[0];
        for (const item of items) {
            await client.query('INSERT INTO order_items (order_id, product_id, name, qty, price, tax) VALUES ($1,$2,$3,$4,$5,$6)', [orderObj.id, item.productId || null, item.name, item.qty || 1, item.price || 0, item.tax || 0]);
        }
        await client.query('INSERT INTO tracking_events (order_id, type, actor_id, notes) VALUES ($1,$2,$3,$4)', [orderObj.id, 'order_created', userId, 'Order placed']);
        return orderObj;
    });
    const { createNotification } = require('../notifications/notifications.service');
    const users = await db.queryForTenant(businessId, "SELECT id FROM users WHERE business_id=$1 AND role IN ('owner','manager')", [businessId]);
    for (const u of users.rows) {
        await createNotification(businessId, u.id, 'order_created', 'New Order', `Order for ${customerName} placed`, { orderId: order.id }).catch(()=>{});
    }
    return order;
}

async function updateStatus(businessId, orderId, status, actorId, io) {
    const existing = await db.queryForTenant(businessId, 'SELECT * FROM orders WHERE id = $1 AND business_id = $2', [orderId, businessId]);
    if (existing.rows.length === 0) return null;
    const before = existing.rows[0];
    const result = await db.queryForTenant(businessId, 'UPDATE orders SET status = $1 WHERE id = $2 AND business_id = $3 RETURNING *', [status, orderId, businessId]);
    const updated = result.rows[0];
    await db.queryForTenant(businessId, 'INSERT INTO tracking_events (order_id, type, actor_id) VALUES ($1,$2,$3)', [orderId, 'status_' + status, actorId]);
    if (status === 'delivered' && before.rider_id) {
        await db.queryForTenant(businessId, 'UPDATE delivery_partners SET active_orders = GREATEST(active_orders - 1, 0) WHERE id = $1', [before.rider_id]);
    }
    if (io) {
        io.to('org:' + businessId).emit('order-updated', { id: orderId, status });
        io.to('track:' + updated.tracking_token).emit('status-update', { status, ts: Date.now() });
    }
    const { createNotification } = require('../notifications/notifications.service');
    if (['delivered', 'cancelled', 'failed'].includes(status)) {
        const users = await db.queryForTenant(businessId, "SELECT id FROM users WHERE business_id=$1 AND role IN ('owner','manager')", [businessId]);
        for (const u of users.rows) {
            await createNotification(businessId, u.id, 'order_status', `Order ${status}`, `Order ${orderId} is now ${status}`, { orderId }, io).catch(()=>{});
        }
    }
    
    // Webhook dispatch
    const bizRes = await db.queryForTenant(businessId, 'SELECT webhook_url, webhook_secret FROM businesses WHERE id = $1', [businessId]);
    if (bizRes.rows[0] && bizRes.rows[0].webhook_url) {
        const payload = JSON.stringify({ event: 'order.status_updated', orderId, status, timestamp: new Date().toISOString() });
        const headers = { 'Content-Type': 'application/json' };
        if (bizRes.rows[0].webhook_secret) {
            const signature = require('crypto').createHmac('sha256', bizRes.rows[0].webhook_secret).update(payload).digest('hex');
            headers['X-Signature'] = signature;
        }
        require('../webhooks/webhook.queue').dispatchWebhook(bizRes.rows[0].webhook_url, payload, headers, orderId);
    }

    return { before, after: updated };
}

async function assignRider(businessId, orderId, riderId, actorId, io) {
    const orderRes = await db.queryForTenant(businessId, 'SELECT * FROM orders WHERE id = $1 AND business_id = $2', [orderId, businessId]);
    if (orderRes.rows.length === 0) return null;
    const riderRes = await db.queryForTenant(businessId, 'SELECT * FROM delivery_partners WHERE id = $1 AND business_id = $2 AND is_active = TRUE', [riderId, businessId]);
    if (riderRes.rows.length === 0) return { error: 'Rider not found' };
    const result = await db.withTenantTransaction(businessId, async (client) => {
        const updated = await client.query('UPDATE orders SET rider_id = $1, status = $2 WHERE id = $3 AND business_id = $4 RETURNING id, rider_id AS "riderId", status', [riderId, 'assigned', orderId, businessId]);
        await client.query('UPDATE delivery_partners SET active_orders = active_orders + 1, status = $1 WHERE id = $2', ['busy', riderId]);
        await client.query('INSERT INTO tracking_events (order_id, rider_id, type, actor_id) VALUES ($1,$2,$3,$4)', [orderId, riderId, 'rider_assigned', actorId]);
        return updated.rows[0];
    });
    if (io) io.to('org:' + businessId).emit('order-updated', { id: orderId, status: 'assigned', riderId });
    return result;
}

async function getOrderTimeline(businessId, orderId) {
    const result = await db.queryForTenant(
        businessId,
        "SELECT te.*, u.name as actor_name FROM tracking_events te LEFT JOIN users u ON u.id = te.actor_id WHERE te.order_id=$1 ORDER BY te.created_at ASC",
        [orderId]
    );
    return result.rows;
}

async function exportOrders(businessId, { status, riderId } = {}) {
    const conditions = ['o.business_id = $1'];
    const params = [businessId];
    if (status) {
        const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
        if (statuses.length === 1) {
            params.push(statuses[0]); conditions.push('o.status = $' + params.length);
        } else {
            params.push(statuses); conditions.push('o.status = ANY($' + params.length + ')');
        }
    }
    if (riderId) { params.push(riderId); conditions.push('o.rider_id = $' + params.length); }
    const where = 'WHERE ' + conditions.join(' AND ');
    
    const result = await db.queryForTenant(
        businessId,
        'SELECT o.id, o.customer_name, o.customer_phone, o.status, o.priority, o.total_amount, o.created_at, dp.name AS rider_name FROM orders o LEFT JOIN delivery_partners dp ON dp.id = o.rider_id ' + where + ' ORDER BY o.created_at DESC',
        params
    );
    
    let csv = 'ID,Customer Name,Phone,Status,Priority,Total Amount,Created At,Rider Name\n';
    for (const row of result.rows) {
        const line = [
            row.id,
            `"${(row.customer_name || '').replace(/"/g, '""')}"`,
            `"${(row.customer_phone || '').replace(/"/g, '""')}"`,
            row.status,
            row.priority,
            row.total_amount,
            row.created_at ? new Date(row.created_at).toISOString() : '',
            `"${(row.rider_name || '').replace(/"/g, '""')}"`
        ];
        csv += line.join(',') + '\n';
    }
    return csv;
}

module.exports = { getOrders, getOrder, createOrder, updateStatus, assignRider, getOrderTimeline, exportOrders };
