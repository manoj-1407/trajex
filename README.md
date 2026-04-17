# Trajex - Enterprise Logistics Management

Trajex is a production-grade, multi-tenant delivery dispatch platform. It provides specialized workspaces for logistics operations, featuring real-time rider tracking, automated dispatch logic, and deep analytics—all protected by PostgreSQL Row Level Security (RLS).

## Architecture & Security
The system is built on a "Zero-Trust" data model. Tenant isolation is enforced at the database layer using Postgres RLS, ensuring that each organization's data remains strictly private.

- **Backend**: Express.js with PostgreSQL & Socket.io for sub-second telemetry.
- **Frontend**: React-based SPA with a hardened API contract (100% camelCase enforcement).
- **Isolation**: Each query is session-scoped to a specific `business_id`.
- **Telemetry**: Real-time event propagation for order status and GPS tracking.

## Core Features
- **Live Dispatch HUD**: Precision rider tracking and movement pathing.
- **Smart Assignment**: Proximity-aware rider suggestions for optimized throughput.
- **SLA Monitoring**: Real-time flagging of delivery delays and breach risks.
- **Customer Tracking**: Secure, token-based public tracking links.
- **PWA Support**: Mobile-optimized interface for field teams.

## Getting Started

### Local Setup
1. **Install**: `npm install` (root) installs everything.
2. **Environment**: Configure `backend/.env` based on the provided example.
3. **Database**: 
   - Create `trajex_db`.
   - Run `npm run migrate:up` in the backend.
   - Apply `rls.sql` to enable security layers.
4. **Run**: `npm run dev` starts both servers.

### Production Deployment
The platform is optimized for cloud deployment (e.g., Railway for backend, Vercel for frontend).

**Required Variables:**
- `DATABASE_URL`: Production Postgres string.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: Secure random keys.
- `FRONTEND_URL`: Public URL of your frontend (e.g., `https://trajex.vercel.app`).
- `VITE_API_URL`: Public URL of your backend.

## Development Standards
This version (v1.0.0-hardened) implements a strict camelCase API contract across all services and components. 

---
Developed by **Manoj Kumar**.
