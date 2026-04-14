'use strict';
const db = require('../../config/db');

async function getDashboard(businessId) {
    const [orders, riders, delays, revenue] = await Promise.all([
        db.queryForTenant(businessId, "SELECT status, COUNT(*) AS count FROM orders WHERE business_id = $1 GROUP BY status", [businessId]),
        db.queryForTenant(businessId, "SELECT status, COUNT(*) AS count FROM delivery_partners WHERE business_id = $1 AND is_active = TRUE GROUP BY status", [businessId]),
        db.queryForTenant(businessId, "SELECT COUNT(*) AS count FROM orders WHERE business_id = $1 AND is_delayed = TRUE AND created_at >= NOW() - INTERVAL '7 days'", [businessId]),
        db.queryForTenant(businessId, "SELECT COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN total_amount END),0) AS today, COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN total_amount END),0) AS week, COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN total_amount END),0) AS month FROM orders WHERE business_id = $1 AND status = 'delivered'", [businessId]),
    ]);
    const orderMap = Object.fromEntries(orders.rows.map((r) => [r.status, parseInt(r.count)]));
    const riderMap = Object.fromEntries(riders.rows.map((r) => [r.status, parseInt(r.count)]));
    const totalOrders = Object.values(orderMap).reduce((s, n) => s + n, 0);
    return {
        orders: { total: totalOrders, byStatus: orderMap, deliveryRate: totalOrders ? Math.round(((orderMap.delivered || 0) / totalOrders) * 100) : 0, delayedLast7Days: parseInt(delays.rows[0].count) },
        riders: { total: Object.values(riderMap).reduce((s, n) => s + n, 0), byStatus: riderMap },
        revenue: { today: parseFloat(revenue.rows[0].today), week: parseFloat(revenue.rows[0].week), month: parseFloat(revenue.rows[0].month) },
    };
}

async function getOrderTrend(businessId, { from, to } = {}) {
    const start = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end   = to   || new Date().toISOString();
    const result = await db.queryForTenant(
        businessId,
        "SELECT DATE(created_at AT TIME ZONE 'UTC') AS date, COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'delivered') AS delivered, COUNT(*) FILTER (WHERE is_delayed = TRUE) AS delayed, COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'),0) AS revenue FROM orders WHERE business_id = $1 AND created_at BETWEEN $2 AND $3 GROUP BY DATE(created_at AT TIME ZONE 'UTC') ORDER BY date ASC",
        [businessId, start, end]
    );
    return result.rows.map((r) => ({ date: r.date, total: parseInt(r.total), delivered: parseInt(r.delivered), delayed: parseInt(r.delayed), revenue: parseFloat(r.revenue) }));
}

async function getOrdersByDay(businessId, days) {
    const result = await db.queryForTenant(
        businessId,
        "SELECT date_trunc('day', created_at) as date, COUNT(*) as count FROM orders WHERE business_id=$1 AND created_at >= NOW() - INTERVAL '1 day' * $2 GROUP BY date ORDER BY date ASC",
        [businessId, days]
    );
    return result.rows.map(r => ({ date: r.date, count: parseInt(r.count) }));
}

async function getDeliveryTimeTrend(businessId, days) {
    const result = await db.queryForTenant(
        businessId,
        "SELECT date_trunc('day', created_at) as date, AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_minutes FROM orders WHERE business_id=$1 AND status='delivered' AND created_at >= NOW() - INTERVAL '1 day' * $2 GROUP BY date ORDER BY date ASC",
        [businessId, days]
    );
    return result.rows.map(r => ({ date: r.date, avg_minutes: parseFloat(r.avg_minutes || 0) }));
}

async function getStatusBreakdown(businessId, days) {
    const result = await db.queryForTenant(
        businessId,
        "SELECT status, COUNT(*) as count FROM orders WHERE business_id=$1 AND created_at >= NOW() - INTERVAL '1 day' * $2 GROUP BY status",
        [businessId, days]
    );
    return result.rows.map(r => ({ status: r.status, count: parseInt(r.count) }));
}

async function getTopRiders(businessId, days, limit = 5) {
    const result = await db.queryForTenant(
        businessId,
        "SELECT u.id, u.name as full_name, u.email, COUNT(o.id) as deliveries, AVG(EXTRACT(EPOCH FROM (o.updated_at - o.created_at))/60) as avg_minutes, COUNT(CASE WHEN o.status='delivered' THEN 1 END)::float / NULLIF(COUNT(o.id),0) as success_rate, dp.reliability_score FROM users u JOIN delivery_partners dp ON dp.user_id = u.id LEFT JOIN orders o ON o.rider_id = dp.id AND o.created_at >= NOW() - INTERVAL '1 day' * $2 WHERE u.business_id=$1 GROUP BY u.id, u.name, u.email, dp.reliability_score ORDER BY deliveries DESC LIMIT $3",
        [businessId, days, limit]
    );
    return result.rows.map(r => ({
        id: r.id, full_name: r.full_name, email: r.email, deliveries: parseInt(r.deliveries),
        avg_minutes: parseFloat(r.avg_minutes || 0), success_rate: parseFloat(r.success_rate || 0),
        reliability_score: parseFloat(r.reliability_score)
    }));
}

async function getHourlyHeatmap(businessId, days) {
    const result = await db.queryForTenant(
        businessId,
        "SELECT EXTRACT(DOW FROM created_at) as dow, EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count FROM orders WHERE business_id=$1 AND created_at >= NOW() - INTERVAL '1 day' * $2 GROUP BY dow, hour ORDER BY dow, hour",
        [businessId, days]
    );
    return result.rows.map(r => ({ dow: parseInt(r.dow), hour: parseInt(r.hour), count: parseInt(r.count) }));
}

module.exports = { getDashboard, getOrderTrend, getOrdersByDay, getDeliveryTimeTrend, getStatusBreakdown, getTopRiders, getHourlyHeatmap };
