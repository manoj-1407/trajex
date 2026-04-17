'use strict';
const logger = require('../config/logger');
const env = require('../config/env');

module.exports = function errorHandler(err, req, res, _next) {
    const status = err.status || err.statusCode || 500;
    logger.error({ err: { message: err.message, stack: err.stack }, req: { method: req.method, url: req.url } }, 'unhandled error');
    if (env.NODE_ENV === 'production') {
        return res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
    }
    return res.status(status).json({ error: err.message, ...(status >= 500 && { stack: err.stack }) });
};
