'use strict';
const rateLimit = require('express-rate-limit');

function sanitizeInput(req, _res, next) {
  const clean = (val) => {
    if (typeof val !== 'string') return val;
    return val
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  };

  function sanitizeObj(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = typeof v === 'object' && v !== null ? sanitizeObj(v) : clean(v);
    }
    return out;
  }

  if (req.body && typeof req.body === 'object') req.body = sanitizeObj(req.body);
  next();
}

function requireHttps(req, res, next) {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.status(301).redirect('https://' + req.headers.host + req.url);
  }
  next();
}

function noSniff(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
}

module.exports = { sanitizeInput, requireHttps, noSniff };
