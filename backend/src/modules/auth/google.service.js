'use strict';
const db = require('../../config/db');
const crypto = require('crypto');
const logger = require('../../config/logger');

/**
 * Google Auth Service
 * 
 * Logic for handling Google OAuth profiles, user provisioning, 
 * and organization auto-creation.
 */

async function handleGoogleLogin(profile, req) {
    const { id: googleId, emails, displayName, photos } = profile;
    const email = emails[0].value.toLowerCase();
    const avatarUrl = photos?.[0]?.value;

    // 1. Check if user already exists
    const result = await db.query(
        'SELECT id, business_id, role, is_active FROM users WHERE google_id = $1 OR email = $2',
        [googleId, email]
    );

    let user = result.rows[0];

    if (user) {
        // Update google_id if matched by email (link accounts)
        if (!user.google_id) {
            await db.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3', [googleId, avatarUrl, user.id]);
        }
        return user;
    }

    // 2. New User Provisioning
    // For social login, we auto-create a personal workspace if none is provided.
    return await db.withTransaction(async (client) => {
        const businessName = `${displayName.split(' ')[0]}'s Workspace`;
        let slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        // Collisions check for slug
        const slugExists = await client.query('SELECT id FROM businesses WHERE slug = $1', [slug]);
        if (slugExists.rows.length > 0) slug += '-' + crypto.randomBytes(3).toString('hex');

        const biz = await client.query(
            'INSERT INTO businesses (name, slug) VALUES ($1,$2) RETURNING id',
            [businessName, slug]
        );
        
        const bizId = biz.rows[0].id;
        const newUser = await client.query(
            `INSERT INTO users (business_id, email, name, role, google_id, avatar_url, auth_provider) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id, business_id, role, email, name`,
            [bizId, email, displayName, 'owner', googleId, avatarUrl, 'google']
        );

        return newUser.rows[0];
    });
}

module.exports = {
    handleGoogleLogin
};
