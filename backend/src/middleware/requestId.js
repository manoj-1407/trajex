'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = function requestId(req, res, next) {
    req.id = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-ID', req.id);
    req.log = req.log.child({ req_id: req.id });
    next();
};
