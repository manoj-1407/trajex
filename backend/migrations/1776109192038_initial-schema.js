/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION prevent_audit_modification()
    RETURNS TRIGGER AS $$
    BEGIN
      RAISE EXCEPTION 'Audit logs cannot be modified or deleted';
    END;
    $$ LANGUAGE plpgsql;

    CREATE TABLE businesses (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name                TEXT NOT NULL,
      slug                TEXT UNIQUE NOT NULL,
      logo_url            TEXT,
      accent_color        VARCHAR(7) DEFAULT '#00e5cc',
      sla_default_minutes INT DEFAULT 45,
      timezone            TEXT DEFAULT 'Asia/Kolkata',
      webhook_url         TEXT,
      webhook_secret      TEXT,
      created_at          TIMESTAMPTZ DEFAULT NOW(),
      updated_at          TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      email         TEXT NOT NULL,
      password_hash TEXT,
      name          TEXT NOT NULL,
      phone         TEXT,
      role          TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner','manager','staff')),
      is_active     BOOLEAN DEFAULT TRUE,
      google_id     TEXT UNIQUE,
      avatar_url    TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(business_id, email)
    );

    CREATE TABLE refresh_tokens (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      is_revoked BOOLEAN DEFAULT FALSE,
      ip         TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE password_reset_tokens (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at    TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE stores (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      address     TEXT,
      lat         NUMERIC(10,7),
      lng         NUMERIC(10,7),
      phone       TEXT,
      type        TEXT DEFAULT 'warehouse',
      is_active   BOOLEAN DEFAULT TRUE,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE products (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      sku         TEXT,
      name        TEXT NOT NULL,
      brand       TEXT,
      category    TEXT,
      price       NUMERIC(12,2) DEFAULT 0,
      tax_percent NUMERIC(5,2) DEFAULT 0,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE inventory (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      on_hand       INT DEFAULT 0,
      reserved      INT DEFAULT 0,
      reorder_point INT DEFAULT 10,
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE delivery_partners (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
      business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      name              TEXT NOT NULL,
      phone             TEXT,
      vehicle_type      TEXT DEFAULT 'bike',
      status            TEXT DEFAULT 'available' CHECK (status IN ('available','busy','offline')),
      is_active         BOOLEAN DEFAULT TRUE,
      active_orders     INT DEFAULT 0,
      reliability_score NUMERIC(3,2) DEFAULT 5.00,
      last_lat          NUMERIC(10,7),
      last_lng          NUMERIC(10,7),
      last_seen_at      TIMESTAMPTZ,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE orders (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      store_id            UUID REFERENCES stores(id),
      rider_id            UUID REFERENCES delivery_partners(id) ON DELETE SET NULL,
      customer_name       TEXT NOT NULL,
      customer_phone      TEXT,
      channel             TEXT DEFAULT 'manual',
      pickup_lat          NUMERIC(10,7),
      pickup_lng          NUMERIC(10,7),
      drop_lat            NUMERIC(10,7),
      drop_lng            NUMERIC(10,7),
      drop_address        TEXT,
      priority            TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
      status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','assigned','picked_up','in_transit','delivered','cancelled','failed')),
      sla_minutes         INT DEFAULT 45,
      expected_delivery_at TIMESTAMPTZ,
      is_delayed          BOOLEAN DEFAULT FALSE,
      tracking_token      CHAR(32) UNIQUE NOT NULL,
      total_amount        NUMERIC(12,2) DEFAULT 0,
      notes               TEXT,
      created_at          TIMESTAMPTZ DEFAULT NOW(),
      updated_at          TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE order_items (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id),
      name       TEXT NOT NULL,
      qty        INT DEFAULT 1,
      price      NUMERIC(12,2) DEFAULT 0,
      tax        NUMERIC(12,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE tracking_events (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      rider_id   UUID REFERENCES delivery_partners(id),
      type       TEXT NOT NULL,
      lat        NUMERIC(10,7),
      lng        NUMERIC(10,7),
      notes      TEXT,
      actor_id   UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE delay_events (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      reason_code TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE notifications (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
      type        TEXT NOT NULL,
      title       TEXT NOT NULL,
      message     TEXT NOT NULL,
      metadata    JSONB DEFAULT '{}'::jsonb,
      read_at     TIMESTAMPTZ,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE audit_logs (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id  UUID REFERENCES businesses(id),
      actor_id     UUID REFERENCES users(id),
      action       TEXT NOT NULL,
      entity_type  TEXT,
      entity_id    UUID,
      before_state JSONB,
      after_state  JSONB,
      ip           TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TRIGGER trg_businesses_updated_at
      BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    CREATE TRIGGER trg_stores_updated_at
      BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    CREATE TRIGGER trg_delivery_partners_updated_at
      BEFORE UPDATE ON delivery_partners FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    CREATE TRIGGER trg_orders_updated_at
      BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    CREATE TRIGGER trg_products_updated_at
      BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

    CREATE TRIGGER trg_prevent_audit_mod
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

    CREATE INDEX idx_orders_business_status  ON orders(business_id, status);
    CREATE INDEX idx_orders_business_created ON orders(business_id, created_at DESC);
    CREATE INDEX idx_orders_tracking_token   ON orders(tracking_token);
    CREATE INDEX idx_orders_rider            ON orders(rider_id);
    CREATE INDEX idx_dp_business_status      ON delivery_partners(business_id, status);
    CREATE INDEX idx_users_business_email    ON users(business_id, email);
    CREATE INDEX idx_refresh_token_hash      ON refresh_tokens(token_hash);
    CREATE INDEX idx_audit_business_created  ON audit_logs(business_id, created_at DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS audit_logs CASCADE;
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS delay_events CASCADE;
    DROP TABLE IF EXISTS tracking_events CASCADE;
    DROP TABLE IF EXISTS order_items CASCADE;
    DROP TABLE IF EXISTS orders CASCADE;
    DROP TABLE IF EXISTS delivery_partners CASCADE;
    DROP TABLE IF EXISTS inventory CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS stores CASCADE;
    DROP TABLE IF EXISTS password_reset_tokens CASCADE;
    DROP TABLE IF EXISTS refresh_tokens CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS businesses CASCADE;
    DROP FUNCTION IF EXISTS set_updated_at CASCADE;
    DROP FUNCTION IF EXISTS prevent_audit_modification CASCADE;
  `);
};
