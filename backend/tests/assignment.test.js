'use strict';
require('./setup');
const { describe, test, expect } = require('@jest/globals');

// Unit test the pure scoring function — no DB needed
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const toRad = (v) => v * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const scoreRider = (pickupLat, pickupLng, rider) => {
  const distKm      = haversineKm(pickupLat, pickupLng, rider.last_lat, rider.last_lng);
  const distPenalty = Math.min(distKm / 10, 1);
  const loadPenalty = rider.active_orders * 0.15;
  const relBoost    = (parseFloat(rider.reliability_score) / 5) * 0.2;
  return Math.max(0, 1 - distPenalty - loadPenalty + relBoost);
};

describe('Haversine distance calculation', () => {
  test('same point returns 0 km', () => {
    expect(haversineKm(12.9716, 77.5946, 12.9716, 77.5946)).toBe(0);
  });

  test('Bengaluru to Mumbai is approximately 840 km', () => {
    const dist = haversineKm(12.9716, 77.5946, 19.0760, 72.8777);
    expect(dist).toBeGreaterThan(800);
    expect(dist).toBeLessThan(880);
  });

  test('short distance Koramangala to Indiranagar ~4.5 km', () => {
    const dist = haversineKm(12.9352, 77.6245, 12.9784, 77.6408);
    expect(dist).toBeGreaterThan(4);
    expect(dist).toBeLessThan(6);
  });
});

describe('Rider scoring algorithm', () => {
  const pickup = { lat: 12.9716, lng: 77.5946 };

  test('nearby available rider scores higher than distant one', () => {
    const nearby  = { last_lat: 12.975,  last_lng: 77.595,  active_orders: 0, reliability_score: '4.5' };
    const distant = { last_lat: 13.050,  last_lng: 77.620,  active_orders: 0, reliability_score: '4.5' };
    expect(scoreRider(pickup.lat, pickup.lng, nearby))
      .toBeGreaterThan(scoreRider(pickup.lat, pickup.lng, distant));
  });

  test('higher reliability boosts score', () => {
    const reliable = { last_lat: 12.975, last_lng: 77.595, active_orders: 0, reliability_score: '5.0' };
    const mediocre = { last_lat: 12.975, last_lng: 77.595, active_orders: 0, reliability_score: '2.0' };
    expect(scoreRider(pickup.lat, pickup.lng, reliable))
      .toBeGreaterThan(scoreRider(pickup.lat, pickup.lng, mediocre));
  });

  test('active orders reduce score', () => {
    const idle = { last_lat: 12.975, last_lng: 77.595, active_orders: 0, reliability_score: '4.5' };
    const busy = { last_lat: 12.975, last_lng: 77.595, active_orders: 3, reliability_score: '4.5' };
    expect(scoreRider(pickup.lat, pickup.lng, idle))
      .toBeGreaterThan(scoreRider(pickup.lat, pickup.lng, busy));
  });

  test('score is always >= 0 even for worst case rider', () => {
    const worst = { last_lat: 14.000, last_lng: 79.000, active_orders: 6, reliability_score: '1.0' };
    expect(scoreRider(pickup.lat, pickup.lng, worst)).toBeGreaterThanOrEqual(0);
  });

  test('score is always <= ~1.2 for best case rider', () => {
    const best = { last_lat: 12.972, last_lng: 77.595, active_orders: 0, reliability_score: '5.0' };
    expect(scoreRider(pickup.lat, pickup.lng, best)).toBeLessThan(1.25);
  });
});

describe('Tracking token entropy', () => {
  const crypto = require('crypto');

  test('generates 32-char hex token', () => {
    const token = crypto.randomBytes(16).toString('hex');
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  test('two tokens are never identical', () => {
    const t1 = crypto.randomBytes(16).toString('hex');
    const t2 = crypto.randomBytes(16).toString('hex');
    expect(t1).not.toBe(t2);
  });
});
