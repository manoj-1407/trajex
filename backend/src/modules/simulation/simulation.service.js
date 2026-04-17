'use strict';
const db = require('../../config/db');
const logger = require('../../config/logger');

let _io = null;
let _simulationInterval = null;
let _activeSimulations = new Map(); // businessId -> { riders, status }

// HYDERABAD HUB (HITEC City / Gachibowli Area)
const CITY_CENTER = { lat: 17.4483, lng: 78.3915 };
const MOVEMENT_SPEED = 0.0005; // Base movement step

function setIo(io) {
    _io = io;
}

/**
 * Bootstraps a "Rush Hour" simulation for a tenant.
 */
async function startChaos(businessId) {
    if (_activeSimulations.has(businessId)) return { message: 'Simulation already active' };

    logger.info({ businessId }, 'Initializing Rush Hour Simulation (Hyderabad Hub)');

    // 1. Create 5 Elite Riders
    const riders = [];
    const names = ['UNIT-ALPHA', 'UNIT-BRAVO', 'UNIT-KILO', 'UNIT-DELTA', 'UNIT-ZULU'];
    
    for (const name of names) {
        const res = await db.query(
            `INSERT INTO delivery_partners (business_id, name, phone, status, last_lat, last_lng, reliability_score) 
             VALUES ($1, $2, $3, 'available', $4, $5, $6) RETURNING id, name, phone, status, last_lat AS "lastLat", last_lng AS "lastLng", reliability_score AS "reliabilityScore"`,
            [
                businessId, 
                name, 
                '+919000' + Math.floor(Math.random() * 90000), 
                'available', 
                CITY_CENTER.lat + (Math.random() - 0.5) * 0.04, 
                CITY_CENTER.lng + (Math.random() - 0.5) * 0.04, 
                4.8 + Math.random() * 0.2
            ]
        );
        riders.push(res.rows[0]);
    }

    // 2. Create 10 Pending Orders across Hyderabad
    for (let i = 0; i < 10; i++) {
        const clients = [
            'Aether Strategic Corp', 'Hyperion Dynamics', 'Nebula Industries', 
            'Omni-Channel Express', 'Quantum Logistics Group', 'Titan Resources',
            'Vanguard Systems', 'Zenith Global', 'Solaris Energy', 'Atlas Prime'
        ];
        const crypto = require('crypto');
        await db.query(
            `INSERT INTO orders (business_id, customer_name, customer_phone, drop_address, status, pickup_lat, pickup_lng, drop_lat, drop_lng, tracking_token)
             VALUES ($1, $2, $3, $4, 'confirmed', $5, $6, $7, $8, $9)`,
            [
                businessId, 
                clients[i] || `Enterprise Partner ${100 + i}`, 
                '+91888' + Math.floor(Math.random()*90000), 
                'Strategic Sector ' + String.fromCharCode(65 + i),
                CITY_CENTER.lat + (Math.random() - 0.5) * 0.02,
                CITY_CENTER.lng + (Math.random() - 0.5) * 0.02,
                CITY_CENTER.lat + (Math.random() - 0.5) * 0.08,
                CITY_CENTER.lng + (Math.random() - 0.5) * 0.08,
                crypto.randomBytes(16).toString('hex')
            ]
        );
    }

    _activeSimulations.set(businessId, { riders, status: 'active' });
    
    // 3. Start movement loop
    if (!_simulationInterval) {
        _simulationInterval = setInterval(moveSimulatedRiders, 3000);
    }

    return { message: 'Chaos engine engaged in Hyderabad Hub', ridersCreated: riders.length };
}

async function moveSimulatedRiders() {
    for (const [bizId, sim] of _activeSimulations.entries()) {
        for (const rider of sim.riders) {
            const jitterLat = (Math.random() - 0.5) * 0.0015;
            const jitterLng = (Math.random() - 0.5) * 0.0015;

            rider.lastLat = parseFloat(rider.lastLat) + jitterLat;
            rider.lastLng = parseFloat(rider.lastLng) + jitterLng;

            await db.query(
                'UPDATE delivery_partners SET last_lat = $1, last_lng = $2, last_seen_at = NOW() WHERE id = $3',
                [rider.lastLat, rider.lastLng, rider.id]
            );

            if (_io) {
                _io.to('org:' + bizId).emit('rider-location', {
                    riderId: rider.id,
                    lastLat: rider.lastLat,
                    lastLng: rider.lastLng,
                    ts: Date.now()
                });
            }
        }
    }
}

async function stopChaos(businessId) {
    const sim = _activeSimulations.get(businessId);
    if (!sim) return { message: 'No simulation running' };

    const riderIds = sim.riders.map(r => r.id);
    await db.query('DELETE FROM delivery_partners WHERE id = ANY($1)', [riderIds]);
    
    _activeSimulations.delete(businessId);
    if (_activeSimulations.size === 0 && _simulationInterval) {
        clearInterval(_simulationInterval);
        _simulationInterval = null;
    }

    return { message: 'Chaos engine disengaged and Hyderabad data scrubbed' };
}

module.exports = { startChaos, stopChaos, setIo };
