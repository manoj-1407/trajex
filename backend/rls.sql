-- Trajex RLS Policies — apply once per DB
-- PGPASSWORD=your_password psql -U postgres -h 127.0.0.1 -d trajex_db -f rls.sql

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'trajex_app') THEN
    -- IMPORTANT: Change this password in your .env file and ensure it matches the 
    -- value in DATABASE_URL. Avoid hardcoding passwords in this SQL file.
    CREATE ROLE trajex_app LOGIN PASSWORD 'REPLACE_WITH_SECURE_PASSWORD';
  END IF;
END $$;

GRANT CONNECT ON DATABASE trajex TO trajex_app;
GRANT USAGE ON SCHEMA public TO trajex_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO trajex_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO trajex_app;

CREATE OR REPLACE FUNCTION app_business_id() RETURNS uuid AS $$
BEGIN
  RETURN current_setting('app.business_id', true)::uuid;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

ALTER TABLE businesses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_partners  ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores             ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE delay_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS businesses_tenant       ON businesses;
DROP POLICY IF EXISTS users_tenant            ON users;
DROP POLICY IF EXISTS orders_tenant           ON orders;
DROP POLICY IF EXISTS order_items_tenant      ON order_items;
DROP POLICY IF EXISTS riders_tenant           ON delivery_partners;
DROP POLICY IF EXISTS stores_tenant           ON stores;
DROP POLICY IF EXISTS products_tenant         ON products;
DROP POLICY IF EXISTS inventory_tenant        ON inventory;
DROP POLICY IF EXISTS audit_select            ON audit_logs;
DROP POLICY IF EXISTS audit_insert            ON audit_logs;
DROP POLICY IF EXISTS notif_tenant            ON notifications;
DROP POLICY IF EXISTS delay_tenant            ON delay_events;
DROP POLICY IF EXISTS tracking_events_tenant  ON tracking_events;

CREATE POLICY businesses_tenant ON businesses
  FOR ALL TO trajex_app USING (id = app_business_id());

CREATE POLICY users_tenant ON users
  FOR ALL TO trajex_app
  USING (business_id = app_business_id())
  WITH CHECK (business_id = app_business_id());

CREATE POLICY orders_tenant ON orders
  FOR ALL TO trajex_app
  USING (business_id = app_business_id())
  WITH CHECK (business_id = app_business_id());

CREATE POLICY order_items_tenant ON order_items
  FOR ALL TO trajex_app
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.business_id = app_business_id()));

CREATE POLICY riders_tenant ON delivery_partners
  FOR ALL TO trajex_app
  USING (business_id = app_business_id())
  WITH CHECK (business_id = app_business_id());

CREATE POLICY stores_tenant ON stores
  FOR ALL TO trajex_app
  USING (business_id = app_business_id())
  WITH CHECK (business_id = app_business_id());

CREATE POLICY products_tenant ON products
  FOR ALL TO trajex_app
  USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = products.store_id AND s.business_id = app_business_id()));

CREATE POLICY inventory_tenant ON inventory
  FOR ALL TO trajex_app
  USING (EXISTS (SELECT 1 FROM products p JOIN stores s ON s.id = p.store_id WHERE p.id = inventory.product_id AND s.business_id = app_business_id()));

CREATE POLICY audit_select ON audit_logs
  FOR SELECT TO trajex_app USING (business_id = app_business_id());
CREATE POLICY audit_insert ON audit_logs
  FOR INSERT TO trajex_app WITH CHECK (business_id = app_business_id());

CREATE POLICY notif_tenant ON notifications
  FOR ALL TO trajex_app
  USING (business_id = app_business_id())
  WITH CHECK (business_id = app_business_id());

CREATE POLICY delay_tenant ON delay_events
  FOR ALL TO trajex_app
  USING (business_id = app_business_id())
  WITH CHECK (business_id = app_business_id());

CREATE POLICY tracking_events_tenant ON tracking_events
  FOR ALL TO trajex_app
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = tracking_events.order_id AND o.business_id = app_business_id()));

SELECT 'RLS applied to ' || count(*)::text || ' tables' AS status
FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
