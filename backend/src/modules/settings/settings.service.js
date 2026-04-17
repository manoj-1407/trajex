'use strict';
const db = require('../../config/db');

async function getSettings(businessId) {
    const result = await db.query(
        'SELECT id, name, slug, logo_url AS "logoUrl", accent_color AS "accentColor", sla_default_minutes AS "slaDefaultMinutes", timezone, webhook_url AS "webhookUrl", webhook_secret AS "webhookSecret", created_at AS "createdAt" FROM businesses WHERE id = $1', 
        [businessId]
    );
    return result.rows[0] || null;
}

async function updateSettings(businessId, data) {
    const { name, logoUrl, accentColor, slaDefaultMinutes, timezone, webhookUrl, webhookSecret } = data;
    const result = await db.query(
        'UPDATE businesses SET name = COALESCE($1,name), logo_url = COALESCE($2,logo_url), accent_color = COALESCE($3,accent_color), sla_default_minutes = COALESCE($4,sla_default_minutes), timezone = COALESCE($5,timezone), webhook_url = COALESCE($6,webhook_url), webhook_secret = COALESCE($7,webhook_secret) WHERE id = $8 RETURNING id, name, slug, logo_url AS "logoUrl", accent_color AS "accentColor", sla_default_minutes AS "slaDefaultMinutes", timezone, webhook_url AS "webhookUrl", webhook_secret AS "webhookSecret"',
        [name || null, logoUrl || null, accentColor || null, slaDefaultMinutes || null, timezone || null, webhookUrl !== undefined ? webhookUrl : null, webhookSecret !== undefined ? webhookSecret : null, businessId]
    );
    return result.rows[0];
}

module.exports = { getSettings, updateSettings };
