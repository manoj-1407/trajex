'use strict';

/**
 * Trajex Backend Server Entry Point
 * 
 * This file bootstraps the application, verifies the database connection,
 * starts the Express HTTP server, and initiates background SLA listeners.
 */

require('dotenv').config();
const { httpServer } = require('./app');
const { testConnection } = require('./config/db');
const env    = require('./config/env');
const logger = require('./config/logger');

async function start() {
    // 1. Verify database connectivity before accepting HTTP traffic
    await testConnection();
    
    // 2. Start the HTTP server on the configured port
    httpServer.listen(env.PORT, () => {
        logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Trajex backend running');
    });
    
    // 3. Initialize background tasks (SLA Breach Checks) after a brief delay
    // This allows the server to fully initialize before hammering the DB.
    setTimeout(() => {
        const { checkSLABreaches, setIo } = require('./modules/sla/sla.service');
        const { io } = require('./app');
        setIo(io);
        
        // Run immediately, then interval every 5 minutes
        checkSLABreaches().catch(err => logger.error(err));
        setInterval(() => checkSLABreaches().catch(err => logger.error(err)), 5 * 60 * 1000);
    }, 30000);
    
    // 4. Graceful shutdown handler
    const shutdown = (sig) => { 
        logger.info({ sig }, 'Initiating graceful shutdown'); 
        httpServer.close(() => {
            logger.info('HTTP server closed, exiting process.');
            process.exit(0);
        }); 
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
}

// Bootstrap application
start().catch((err) => { 
    logger.error({ err }, 'Fatal error during startup'); 
    process.exit(1); 
});
