-- ============================================================
-- Migration: Remove users table and use employees table only
-- ============================================================
-- This migration consolidates authentication to use only the
-- employees table instead of having separate users and employees tables.
--
-- IMPORTANT: Run this after ensuring all employees who need admin access
-- have role='admin' or role='ceo' in the employees table.
-- ============================================================

BEGIN;

-- Step 1: Drop existing foreign key constraints
ALTER TABLE work_orders 
DROP CONSTRAINT IF EXISTS work_orders_created_by_id_users_id_fk;

ALTER TABLE dynamics365_settings 
DROP CONSTRAINT IF EXISTS dynamics365_settings_updated_by_users_fkey,
DROP CONSTRAINT IF EXISTS dynamics365_settings_updated_by_fkey;

ALTER TABLE system_settings 
DROP CONSTRAINT IF EXISTS system_settings_updated_by_users_fkey,
DROP CONSTRAINT IF EXISTS system_settings_updated_by_fkey;

-- Step 2: Update foreign keys to reference employees table
ALTER TABLE work_orders 
ADD CONSTRAINT work_orders_created_by_id_employees_id_fkey 
FOREIGN KEY (created_by_id) REFERENCES employees(id);

ALTER TABLE dynamics365_settings 
ADD CONSTRAINT dynamics365_settings_updated_by_employees_fkey 
FOREIGN KEY (updated_by) REFERENCES employees(id);

ALTER TABLE system_settings 
ADD CONSTRAINT system_settings_updated_by_employees_fkey 
FOREIGN KEY (updated_by) REFERENCES employees(id);

-- Step 3: Remove the users table
DROP TABLE IF EXISTS users CASCADE;

COMMIT;

-- ============================================================
-- Migration Complete!
-- ============================================================
-- Now all authentication uses the employees table only.
-- Employees with role='admin' or role='ceo' can access admin features.
-- ============================================================
