-- Migration Script: Add D365 Settings and App Customizations Tables
-- Created: 2025-11-03
-- Description: Adds new tables for Dynamics 365 integration and app customization features

-- ========================================
-- 1. CREATE APP CUSTOMIZATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS app_customizations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    app_name TEXT NOT NULL DEFAULT 'Gelan Terminal Maintenance',
    logo_url TEXT,
    primary_color TEXT DEFAULT '#0ea5e9',
    theme_mode TEXT NOT NULL DEFAULT 'light',
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by VARCHAR REFERENCES employees(id)
);

-- Insert default customization record
INSERT INTO app_customizations (app_name, primary_color, theme_mode)
VALUES ('Gelan Terminal Maintenance', '#0ea5e9', 'light')
ON CONFLICT DO NOTHING;

-- ========================================
-- 2. CREATE DYNAMICS 365 SETTINGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS dynamics365_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    bc_url TEXT NOT NULL,
    bc_company TEXT NOT NULL,
    bc_username TEXT NOT NULL,
    bc_password TEXT NOT NULL,
    bc_domain TEXT,
    item_prefix TEXT,
    equipment_prefix TEXT,
    sync_interval_hours INTEGER DEFAULT 24,
    last_sync_date TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_test_date TIMESTAMP,
    last_test_status TEXT,
    last_test_message TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by VARCHAR REFERENCES employees(id)
);

-- ========================================
-- 3. CREATE D365 ITEMS PREVIEW TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS d365_items_preview (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_id VARCHAR NOT NULL,
    item_no TEXT NOT NULL,
    description TEXT,
    description_2 TEXT,
    type TEXT,
    base_unit_of_measure TEXT,
    unit_price TEXT,
    unit_cost TEXT,
    inventory TEXT,
    vendor_no TEXT,
    vendor_item_no TEXT,
    last_date_modified TEXT,
    is_selected BOOLEAN NOT NULL DEFAULT TRUE,
    already_exists BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================
-- 4. CREATE SYSTEM SETTINGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    server_host TEXT NOT NULL DEFAULT '0.0.0.0',
    server_port INTEGER NOT NULL DEFAULT 3000,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by VARCHAR REFERENCES employees(id)
);

-- Insert default system settings record
INSERT INTO system_settings (server_host, server_port)
VALUES ('0.0.0.0', 3000)
ON CONFLICT DO NOTHING;

-- ========================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ========================================
COMMENT ON TABLE app_customizations IS 'Application branding and theming configuration';
COMMENT ON TABLE dynamics365_settings IS 'Dynamics 365 Business Central connection settings';
COMMENT ON TABLE d365_items_preview IS 'Temporary staging table for D365 items before import';
COMMENT ON TABLE system_settings IS 'Server and deployment configuration settings';

-- ========================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_d365_preview_sync_id ON d365_items_preview(sync_id);
CREATE INDEX IF NOT EXISTS idx_d365_preview_item_no ON d365_items_preview(item_no);
CREATE INDEX IF NOT EXISTS idx_dynamics365_settings_active ON dynamics365_settings(is_active);

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- The following tables have been created:
-- ✓ app_customizations
-- ✓ dynamics365_settings
-- ✓ d365_items_preview
-- ✓ system_settings
--
-- Default records have been inserted for:
-- ✓ app_customizations (default branding)
-- ✓ system_settings (default server config)
