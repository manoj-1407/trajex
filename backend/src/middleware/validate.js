'use strict';
const { validationResult } = require('express-validator');

module.exports = function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        return res.status(422).json({
            error: firstError.msg,
            details: errors.array().map(e => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};
