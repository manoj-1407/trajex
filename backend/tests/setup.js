'use strict';
process.env.NODE_ENV       = 'test';
process.env.JWT_ACCESS_SECRET  = 'test-access-secret-32-chars-minimum!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-minimum!';
process.env.DATABASE_URL       = process.env.DATABASE_URL; // Required: set in shell or via .env
process.env.CORS_ORIGIN    = 'http://localhost:5173';
process.env.PORT           = '4001';
