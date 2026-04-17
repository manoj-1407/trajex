'use strict';
const db = require('../../config/db');
const logger = require('../../config/logger');

let _io = null;
let _simulationInterval = null;
let _activeSimulations = new Map(); // businessId -> { riders, orders }

function setIo(io) {
    _io = io;
}

/**
 * Bootstraps a "Rush Hour" simulation for a tenant.
 */
async function startChaos(businessId) {
    if (_activeSimulations.has(businessId)) return { message: 'Simulation already active' };

    logger.info({ businessId }, 'Initializing Rush Hour Simulation');

    // 1. Create 5 Elite Riders
    const riders = [];
    const names = ['UNIT-ALPHA', 'UNIT-BRAVO', 'UNIT-KILO', 'UNIT-DELTA', 'UNIT-ZULU'];
    
    // Base coords for Simulation (Central Park, NYC area)
    const baseLat = 40.785091;
    const baseLng = -73.968285;

    for (const name of names) {
        const res = await db.query(
            `INSERT INTO delivery_partners (business_id, name, phone, status, last_lat, last_lng, reliability_score) 
             VALUES ($1, $2, $3, 'available', $4, $5, $6) RETURNING *`,
            [businessId, name, '+1555000' + Math.floor(Math.random() * 9000), baseLat + (Math.random() - 0.5) * 0.02, baseLng + (Math.random() - 0.5) * 0.02, 4.8 + Math.random() * 0.2]
        );
        riders.push(res.rows[0]);
    }

    // 2. Create 10 Pending Orders
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
                '+1555999' + Math.floor(Math.random()*9000), 
                'Strategic Sector ' + String.fromCharCode(65 + i),
                baseLat + (Math.random() - 0.5) * 0.01,
                baseLng + (Math.random() - 0.5) * 0.01,
                baseLat + (Math.random() - 0.5) * 0.05,
                baseLng + (Math.random() - 0.5) * 0.05,
                crypto.randomBytes(16).toString('hex')
            ]
        );
    }

    _activeSimulations.set(businessId, { riders, status: 'active' });
    
    // 3. Start movement loop
    if (!_simulationInterval) {
        _simulationInterval = setInterval(moveSimulatedRiders, 3000);
    }

    return { message: 'Chaos engine engaged', ridersCreated: riders.length };
}

async function moveSimulatedRiders() {
    for (const [bizId, sim] of _activeSimulations.entries()) {
        for (const rider of sim.riders) {
            // Random jitter movement
            rider.last_lat += (Math.random() - 0.5) * 0.002;
            rider.last_lng += (Math.random() - 0.5) * 0.002;

            await db.query(
                'UPDATE delivery_partners SET last_lat = $1, last_lng = $2 WHERE id = $3',
                [rider.last_lat, rider.last_lng, rider.id]
            );

            if (_io) {
                _io.to('org:' + bizId).emit('rider-location', {
                    riderId: rider.id,
                    lat: rider.last_lat,
                    lng: rider.last_lng,
                    ts: Date.now()
                });
            }
        }
    }
}

async function stopChaos(businessId) {
    const sim = _activeSimulations.get(businessId);
    if (!sim) return { message: 'No simulation running' };

    // Clean up riders created for simulation
    const riderIds = sim.riders.map(r => r.id);
    await db.query('DELETE FROM delivery_partners WHERE id = ANY($1)', [riderIds]);
    
    _activeSimulations.delete(businessId);
    if (_activeSimulations.size === 0 && _simulationInterval) {
        clearInterval(_simulationInterval);
        _simulationInterval = null;
    }

    return { message: 'Chaos engine disengaged and data scrubbed' };
}

module.exports = { startChaos, stopChaos, setIo };
