'use strict';

require('dotenv').config();
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server }   = require('socket.io');
const pinoHttp     = require('pino-http');
const jwt          = require('jsonwebtoken');

const env            = require('./config/env');
const { setupDocs }  = require('./config/swagger');
const logger         = require('./config/logger');
const { apiLimiter } = require('./middleware/rateLimiters');
const { sanitizeInput, requireHttps, noSniff } = require('./middleware/security');
const errorHandler   = require('./middleware/errorHandler');
const auditMiddleware = require('./middleware/audit');

const authRoutes       = require('./modules/auth/auth.routes');
const ordersRoutes     = require('./modules/orders/orders.routes');
const ridersRoutes     = require('./modules/riders/riders.routes');
const assignmentRoutes = require('./modules/assignment/assignment.routes');
const analyticsRoutes  = require('./modules/analytics/analytics.routes');
const trackingRoutes   = require('./modules/tracking/tracking.routes');
const settingsRoutes   = require('./modules/settings/settings.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const simulationRoutes = require('./modules/simulation/simulation.routes');
const simulationService = require('./modules/simulation/simulation.service');


const app        = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, methods: ['GET', 'POST'], credentials: true },
});

const requestId = require('./middleware/requestId');
app.use(helmet({ 
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            // Note: 'unsafe-inline' and CDN sources are enabled specifically for Swagger UI documentation compatibility. 
            // In a locked-down production environment, these should be restricted and nonces should be implemented.
            "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"], 
            "img-src": ["'self'", "data:", "https://*"], // allow images from cloud providers
        },
    },
    hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false, 
    referrerPolicy: { policy: 'same-origin' } 
}));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(pinoHttp({ logger }));
app.use(requestId);
app.use(requireHttps);
app.use(noSniff);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(sanitizeInput);
app.use(cookieParser());
app.use(apiLimiter);
app.use(auditMiddleware);

const { csrfTokenGenerate, csrfProtect } = require('./middleware/csrf');
app.use(csrfTokenGenerate);
app.use(csrfProtect);

app.use((req, _res, next) => { req.io = io; next(); });

app.use('/api/v1/auth',       authRoutes);
app.use('/api/v1/orders',     ordersRoutes);
app.use('/api/v1/riders',     ridersRoutes);
app.use('/api/v1/assignment', assignmentRoutes);
app.use('/api/v1/analytics',  analyticsRoutes);
app.use('/api/v1/tracking',   trackingRoutes);
app.use('/api/v1/settings',   settingsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/simulation', simulationRoutes);

simulationService.setIo(io);


setupDocs(app);

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString(), uptime: process.uptime(), version: '1.0.0' }));
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) { socket.isAnonymous = true; return next(); }
    try {
        socket.user = jwt.verify(token, env.JWT_ACCESS_SECRET);
        socket.isAnonymous = false;
        next();
    } catch { next(new Error('Invalid token')); }
});

io.on('connection', (socket) => {
    logger.debug({ id: socket.id }, 'socket connected');

    socket.on('join-org', (orgId) => {
        if (socket.isAnonymous || !socket.user) return socket.emit('error', { message: 'Authentication required' });
        if (socket.user.businessId !== orgId) return socket.emit('error', { message: 'Not authorized' });
        socket.join('org:' + orgId);
    });

    socket.on('join-track', (token) => { socket.join('track:' + token); });

    socket.on('location-ping', ({ lat, lng, orderId } = {}) => {
        if (socket.isAnonymous || !socket.user || lat == null || lng == null) return;
        io.to('org:' + socket.user.businessId).emit('rider-location', { riderId: socket.user.id, lat, lng, ts: Date.now() });
        if (orderId) io.to('track:' + orderId).emit('rider-location', { lat, lng, ts: Date.now() });
    });

    socket.on('disconnect', () => logger.debug({ id: socket.id }, 'socket disconnected'));
});

module.exports = { app, httpServer, io };
