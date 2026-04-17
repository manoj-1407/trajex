# 🏛️ Trajex System Architecture

This document provides a technical deep-dive into the architectural decisions that power Trajex, focusing on multi-tenancy, real-time synchronization, and security.

## 👥 Multi-Tenancy Strategy: PostgreSQL RLS

Trajex uses **Row Level Security (RLS)** to provide a hardened, multi-tenant environment. Unlike application-level partitioning where a developer might forget a `WHERE business_id = ?` clause, RLS is enforced by the database engine itself.

### The Request Lifecycle
1.  **Authentication**: The client sends a JWT containing the `businessId`.
2.  **Middleware**: `queryForTenant` intercepts the request, grabs the `businessId` from the JWT, and initializes a database session.
3.  **Isolation**: The middleware executes `SET LOCAL app.business_id = '...'`.
4.  **Enforcement**: Every subsequent query in that session is automatically filtered by the Postgres RLS policies (e.g., `USING (business_id = current_setting('app.business_id')::uuid)`).

## 📡 Real-time Engine: Socket.io

Real-time rider tracking is handled via a dedicated WebSocket layer. 

### Synchronization Flow
- **Riders**: The mobile-optimized interface pings the backend with GPS coordinates every few seconds.
- **Backend**: The server validates the rider's session and broadcasts the location to a room scoped specifically to that business (`org:${businessId}`).
- **Dispatchers**: Map views joined to that room receive instant point updates, moving rider icons with CSS transitions for smooth visuals.

## 🔐 Security Hardening

### Token Rotation Family
To mitigate session hijacking, Trajex implements **Family-based Refresh Token Rotation**. When a refresh token is used, it is invalidated, and a new one is issued. If a leaked token is used *after* rotation (a "replay"), the entire refresh token family for that user is revoked, forcing a fresh login.

### Audit Integrity
The `audit_logs` table is protected by a database trigger that prevents `UPDATE` or `DELETE` operations. This ensures a tamper-proof record of every business-critical action.

## 🤖 Rider Assignment Logic

The automated assignment engine uses a **Haversine-based scoring system**. 
1.  Filter riders currently "Active" and within the business scope.
2.  Calculate the great-circle distance between the order's pickup location and each rider.
3.  Suggest riders prioritized by proximity and current order load.
