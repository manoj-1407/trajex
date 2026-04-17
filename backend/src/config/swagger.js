'use strict';
const swaggerUi = require('swagger-ui-express');

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Trajex API',
    version: '1.0.0',
    description: 'Multi-tenant logistics dispatch and fleet intelligence platform',
    contact: { name: 'Manoj Kumar', email: 'manojkumar148700@gmail.com', url: 'https://github.com/manoj-1407' },
  },
  servers: [{ url: '/api/v1', description: 'Production v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error:   { type: 'string', example: 'Validation failed' },
          details: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } },
        },
      },
      User: {
        type: 'object',
        properties: {
          id:         { type: 'string', format: 'uuid' },
          email:      { type: 'string', format: 'email' },
          name:       { type: 'string' },
          role:       { type: 'string', enum: ['owner', 'manager', 'staff'] },
          businessId: { type: 'string', format: 'uuid' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id:             { type: 'string', format: 'uuid' },
          customer_name:  { type: 'string' },
          customer_phone: { type: 'string', nullable: true },
          status:         { type: 'string', enum: ['pending','confirmed','assigned','picked_up','in_transit','delivered','cancelled','failed'] },
          priority:       { type: 'string', enum: ['low','normal','high','urgent'] },
          drop_address:   { type: 'string' },
          total_amount:   { type: 'string' },
          tracking_token: { type: 'string', minLength: 32, maxLength: 32 },
          is_delayed:     { type: 'boolean' },
          rider_name:     { type: 'string', nullable: true },
          created_at:     { type: 'string', format: 'date-time' },
          updated_at:     { type: 'string', format: 'date-time' },
        },
      },
      Rider: {
        type: 'object',
        properties: {
          id:                { type: 'string', format: 'uuid' },
          name:              { type: 'string' },
          phone:             { type: 'string', example: '+919876543210' },
          vehicle_type:      { type: 'string', enum: ['bike','scooter','car','van'] },
          status:            { type: 'string', enum: ['available','busy','offline'] },
          active_orders:     { type: 'integer', minimum: 0 },
          reliability_score: { type: 'string', example: '4.80' },
          last_lat:          { type: 'number', nullable: true },
          last_lng:          { type: 'number', nullable: true },
          last_seen_at:      { type: 'string', format: 'date-time', nullable: true },
        },
      },
      PaginatedOrders: {
        type: 'object',
        properties: {
          orders: { type: 'array', items: { '$ref': '#/components/schemas/Order' } },
          total:  { type: 'integer' },
          page:   { type: 'integer' },
          limit:  { type: 'integer' },
          pages:  { type: 'integer' },
        },
      },
      TrackingEvent: {
        type: 'object',
        properties: {
          type:       { type: 'string' },
          lat:        { type: 'number', nullable: true },
          lng:        { type: 'number', nullable: true },
          notes:      { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      DashboardStats: {
        type: 'object',
        properties: {
          orders: {
            type: 'object',
            properties: {
              total:            { type: 'integer' },
              byStatus:         { type: 'object', additionalProperties: { type: 'integer' } },
              deliveryRate:     { type: 'integer', description: 'Percentage 0–100' },
              delayedLast7Days: { type: 'integer' },
            },
          },
          riders: {
            type: 'object',
            properties: {
              total:    { type: 'integer' },
              byStatus: { type: 'object', additionalProperties: { type: 'integer' } },
            },
          },
          revenue: {
            type: 'object',
            properties: {
              today: { type: 'number' },
              week:  { type: 'number' },
              month: { type: 'number' },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth',       description: 'Authentication and session management' },
    { name: 'Orders',     description: 'Order lifecycle management' },
    { name: 'Riders',     description: 'Delivery partner management' },
    { name: 'Assignment', description: 'Haversine-scored rider assignment engine' },
    { name: 'Analytics',  description: 'Aggregated KPI and trend data' },
    { name: 'Tracking',   description: 'Public customer-facing order tracking' },
    { name: 'Settings',   description: 'Business workspace configuration' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register new business and owner account',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            required: ['businessName', 'name', 'email', 'password'],
            properties: {
              businessName: { type: 'string', minLength: 2, maxLength: 100, example: 'Acme Logistics' },
              name:         { type: 'string', minLength: 2, maxLength: 100, example: 'Arjun Mehta' },
              email:        { type: 'string', format: 'email', example: 'arjun@acme.com' },
              password:     { type: 'string', minLength: 8, description: 'Min 8 chars, 1 uppercase, 1 number, 1 special char' },
              phone:        { type: 'string', example: '+919876543210', description: 'E.164 format, optional' },
            },
          } } },
        },
        responses: {
          201: { description: 'Workspace created', content: { 'application/json': { schema: { type: 'object', properties: { accessToken: { type: 'string' }, user: { '$ref': '#/components/schemas/User' } } } } } },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
          422: { description: 'Validation failed', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Authenticate and receive access + refresh tokens',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email:    { type: 'string', format: 'email' },
              password: { type: 'string' },
            },
          } } },
        },
        responses: {
          200: { description: 'Authenticated. Sets tx_refresh httpOnly cookie (7d). Returns access token (15m).', content: { 'application/json': { schema: { type: 'object', properties: { accessToken: { type: 'string' }, user: { '$ref': '#/components/schemas/User' } } } } } },
          401: { description: 'Invalid credentials' },
          429: { description: 'Rate limited — max 5 attempts per 15 minutes' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'], summary: 'Rotate refresh token and issue new access token',
        security: [],
        description: 'Reads tx_refresh httpOnly cookie. Old token is immediately revoked. Issues new token pair.',
        responses: {
          200: { description: 'New access token issued', content: { 'application/json': { schema: { type: 'object', properties: { accessToken: { type: 'string' } } } } } },
          401: { description: 'Token missing, expired, or already revoked' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'], summary: 'Revoke refresh token and clear session cookie',
        responses: { 200: { description: 'Session terminated' } },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'], summary: 'Request password reset email',
        security: [],
        description: 'Always returns 200 regardless of whether email exists. Prevents user enumeration.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } },
        },
        responses: { 200: { description: 'Reset email sent if account exists (generic response)' } },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'], summary: 'Reset password using email token',
        security: [],
        description: 'Token is valid for 1 hour. All active refresh tokens for the user are revoked on success.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['token', 'password'], properties: { token: { type: 'string' }, password: { type: 'string', minLength: 8 } } } } },
        },
        responses: {
          200: { description: 'Password updated. All sessions revoked.' },
          400: { description: 'Invalid or expired token' },
        },
      },
    },
    '/orders': {
      get: {
        tags: ['Orders'], summary: 'List orders with pagination and filtering',
        parameters: [
          { name: 'page',   in: 'query', schema: { type: 'integer', default: 1, minimum: 1 } },
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending','confirmed','assigned','picked_up','in_transit','delivered','cancelled','failed'] } },
          { name: 'search', in: 'query', schema: { type: 'string', description: 'Search customer name or phone' } },
        ],
        responses: { 200: { description: 'Paginated order list', content: { 'application/json': { schema: { '$ref': '#/components/schemas/PaginatedOrders' } } } } },
      },
      post: {
        tags: ['Orders'], summary: 'Create a new delivery order',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            required: ['customerName', 'dropAddress'],
            properties: {
              customerName:  { type: 'string' },
              customerPhone: { type: 'string', example: '+919876543210' },
              storeId:       { type: 'string', format: 'uuid', nullable: true },
              dropAddress:   { type: 'string' },
              pickupLat:     { type: 'number' },
              pickupLng:     { type: 'number' },
              dropLat:       { type: 'number' },
              dropLng:       { type: 'number' },
              priority:      { type: 'string', enum: ['low','normal','high','urgent'], default: 'normal' },
              slaMinutes:    { type: 'integer', minimum: 5, default: 45 },
              notes:         { type: 'string' },
            },
          } } },
        },
        responses: {
          201: { description: 'Order created with 32-char hex tracking token', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Order' } } } },
          422: { description: 'Validation failed' },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'], summary: 'Get full order detail with items and tracking timeline',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Order with items[], tracking[]', content: { 'application/json': { schema: { allOf: [{ '$ref': '#/components/schemas/Order' }, { type: 'object', properties: { items: { type: 'array' }, tracking: { type: 'array', items: { '$ref': '#/components/schemas/TrackingEvent' } } } }] } } } },
          404: { description: 'Order not found (or belongs to different business)' },
        },
      },
    },
    '/orders/{id}/status': {
      patch: {
        tags: ['Orders'], summary: 'Update order status',
        description: 'Valid transitions: pending→confirmed, confirmed→assigned, assigned→picked_up, picked_up→in_transit, in_transit→delivered/failed. Any status→cancelled.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['pending','confirmed','assigned','picked_up','in_transit','delivered','cancelled','failed'] } } } } } },
        responses: { 200: { description: 'Updated order' }, 404: { description: 'Not found' }, 422: { description: 'Invalid status' } },
      },
    },
    '/orders/{id}/assign': {
      post: {
        tags: ['Orders'], summary: 'Assign a specific rider to an order',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['riderId'], properties: { riderId: { type: 'string', format: 'uuid' } } } } } },
        responses: { 200: { description: 'Order assigned, rider status set to busy' }, 400: { description: 'Rider not found or not active' }, 404: { description: 'Order not found' } },
      },
    },
    '/riders': {
      get: {
        tags: ['Riders'], summary: 'List delivery partners with pagination',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['available','busy','offline'] } },
          { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: { 200: { description: 'Paginated riders' } },
      },
      post: {
        tags: ['Riders'], summary: 'Register a new delivery partner',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            required: ['name', 'phone'],
            properties: {
              name:        { type: 'string' },
              phone:       { type: 'string', example: '+919876543210', description: 'E.164 format required' },
              vehicleType: { type: 'string', enum: ['bike','scooter','car','van'], default: 'bike' },
            },
          } } },
        },
        responses: { 201: { description: 'Rider created', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Rider' } } } }, 422: { description: 'Validation failed' } },
      },
    },
    '/riders/{id}/status': {
      patch: {
        tags: ['Riders'], summary: 'Update rider availability status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['available','busy','offline'] } } } } } },
        responses: { 200: { description: 'Updated rider' }, 404: { description: 'Not found' } },
      },
    },
    '/riders/{id}/location': {
      patch: {
        tags: ['Riders'], summary: 'Update rider GPS coordinates',
        description: 'Broadcasts rider-location event to the org Socket.io room on success.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['lat','lng'], properties: { lat: { type: 'number', minimum: -90, maximum: 90 }, lng: { type: 'number', minimum: -180, maximum: 180 } } } } } },
        responses: { 200: { description: 'Location updated and broadcast via socket' }, 404: { description: 'Rider not found' } },
      },
    },
    '/assignment/suggest': {
      get: {
        tags: ['Assignment'], summary: 'Get top 5 scored rider suggestions for an order',
        description: 'Score formula: 1 - min(dist/10, 1) - (active_orders * 0.15) + (reliability/5 * 0.2). Only riders with last_lat/lng are scored.',
        parameters: [{ name: 'orderId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Scored suggestions sorted by score descending',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                pickupLat:   { type: 'number' },
                pickupLng:   { type: 'number' },
                suggestions: { type: 'array', items: { type: 'object', properties: {
                  id:               { type: 'string', format: 'uuid' },
                  name:             { type: 'string' },
                  phone:            { type: 'string' },
                  vehicleType:      { type: 'string' },
                  activeOrders:     { type: 'integer' },
                  reliabilityScore: { type: 'number' },
                  distKm:           { type: 'number' },
                  score:            { type: 'number', description: '0.0 – 1.2 (higher is better)' },
                } } },
              },
            } } },
          },
          400: { description: 'Order has no pickup coordinates' },
          404: { description: 'Order not found in this workspace' },
        },
      },
    },
    '/analytics/dashboard': {
      get: {
        tags: ['Analytics'], summary: 'Workspace KPI dashboard',
        description: 'Returns order totals by status, rider fleet status, and revenue aggregates for today / last 7 days / last 30 days.',
        responses: { 200: { description: 'Dashboard stats', content: { 'application/json': { schema: { '$ref': '#/components/schemas/DashboardStats' } } } } },
      },
    },
    '/analytics/orders/trend': {
      get: {
        tags: ['Analytics'], summary: 'Daily order trend data',
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date', example: '2025-01-01' } },
          { name: 'to',   in: 'query', schema: { type: 'string', format: 'date', example: '2025-01-31' } },
        ],
        responses: { 200: { description: 'Array of daily totals: date, total, delivered, delayed, revenue' } },
      },
    },
    '/tracking/{token}': {
      get: {
        tags: ['Tracking'], summary: 'Public order tracking — no authentication required',
        security: [],
        description: 'Returns order status, rider info, and full delivery timeline. Safe to share publicly.',
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string', minLength: 16, maxLength: 64, example: 'a3f8c1d9e2b74506' } }],
        responses: {
          200: { description: 'Order with rider location and timeline events', content: { 'application/json': { schema: {
            allOf: [{ '$ref': '#/components/schemas/Order' }, { type: 'object', properties: {
              business_name:  { type: 'string' },
              rider_name:     { type: 'string', nullable: true },
              rider_lat:      { type: 'number', nullable: true },
              rider_lng:      { type: 'number', nullable: true },
              timeline:       { type: 'array', items: { '$ref': '#/components/schemas/TrackingEvent' } },
            } }],
          } } } },
          404: { description: 'Tracking token not found' },
        },
      },
    },
    '/settings': {
      get: {
        tags: ['Settings'], summary: 'Get business workspace settings',
        responses: { 200: { description: 'Business config including name, slug, SLA default, timezone, accent color' } },
      },
      patch: {
        tags: ['Settings'], summary: 'Update business settings (manager+ only)',
        requestBody: {
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              name:               { type: 'string', minLength: 2 },
              accentColor:        { type: 'string', pattern: '^#[0-9a-fA-F]{6}$', example: '#00e5cc' },
              slaDefaultMinutes:  { type: 'integer', minimum: 5, maximum: 1440 },
              timezone:           { type: 'string', example: 'Asia/Kolkata' },
            },
          } } },
        },
        responses: { 200: { description: 'Updated settings' }, 403: { description: 'Requires manager or owner role' } },
      },
    },
    '/health': {
      get: {
        tags: ['System'], summary: 'Health check',
        security: [],
        responses: { 200: { description: 'System operational', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' }, ts: { type: 'string', format: 'date-time' } } } } } } },
      },
    },
  },
};

const UI_OPTIONS = {
  customSiteTitle: 'Trajex API',
  customCss: `
    body, .swagger-ui { background: #07070f !important; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #00e5cc; font-family: 'JetBrains Mono', monospace; }
    .swagger-ui .info { background: #0e0e1c; padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.07); margin-bottom: 20px; }
    .swagger-ui .scheme-container { background: #0e0e1c; border: 1px solid rgba(255,255,255,0.07); }
    .swagger-ui .opblock-tag { color: #eef2ff !important; border-bottom: 1px solid rgba(255,255,255,0.07) !important; }
    .swagger-ui .opblock { background: #0e0e1c; border-color: rgba(255,255,255,0.07) !important; border-radius: 6px; }
    .swagger-ui .opblock-summary-description { color: rgba(255,255,255,0.5); }
    .swagger-ui .opblock.opblock-post .opblock-summary { background: rgba(34,197,94,0.05); }
    .swagger-ui .opblock.opblock-get .opblock-summary { background: rgba(96,165,250,0.05); }
    .swagger-ui .opblock.opblock-patch .opblock-summary { background: rgba(245,158,11,0.05); }
    .swagger-ui .opblock.opblock-delete .opblock-summary { background: rgba(239,68,68,0.05); }
    .swagger-ui .response-col_status { color: #00e5cc; }
    .swagger-ui input[type=text], .swagger-ui textarea, .swagger-ui select { background: #07070f; color: #eef2ff; border-color: rgba(255,255,255,0.15); }
    .swagger-ui .btn.authorize { background: #00e5cc; color: #000; border-color: #00e5cc; }
    .swagger-ui .model { background: #0e0e1c; }
    .swagger-ui .model-box { background: #07070f; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: false,
  },
};

function setupDocs(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, UI_OPTIONS));
  app.get('/api/docs.json', (_req, res) => res.json(spec));
}

module.exports = { setupDocs };
