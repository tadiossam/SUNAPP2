-- ============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- Run this in pgAdmin to fix schema issues
-- ============================================

-- Fix purchase_requests table
ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS requested_by_id VARCHAR REFERENCES employees(id);

ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS foreman_approved_by_id VARCHAR REFERENCES employees(id);

ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS store_manager_id VARCHAR REFERENCES employees(id);

ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS purchase_request_number TEXT UNIQUE;

ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS quantity_requested INTEGER;

ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS quantity_received INTEGER DEFAULT 0;

ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS date_requested TIMESTAMP;

ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS date_approved TIMESTAMP;

ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS order_date TIMESTAMP;

ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS received_date TIMESTAMP;

ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS unit_price TEXT;

ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS total_price TEXT;

ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ETB';

-- Fix employee_performance_snapshots table
ALTER TABLE employee_performance_snapshots 
ADD COLUMN IF NOT EXISTS snapshot_date TIMESTAMP;

ALTER TABLE employee_performance_snapshots 
ADD COLUMN IF NOT EXISTS granularity TEXT;

ALTER TABLE employee_performance_snapshots 
ADD COLUMN IF NOT EXISTS tasks_completed INTEGER DEFAULT 0;

ALTER TABLE employee_performance_snapshots 
ADD COLUMN IF NOT EXISTS total_labor_minutes INTEGER DEFAULT 0;

ALTER TABLE employee_performance_snapshots 
ADD COLUMN IF NOT EXISTS quality_score NUMERIC(5, 2);

ALTER TABLE employee_performance_snapshots 
ADD COLUMN IF NOT EXISTS work_orders_completed INTEGER DEFAULT 0;

ALTER TABLE employee_performance_snapshots 
ADD COLUMN IF NOT EXISTS item_requisitions_processed INTEGER DEFAULT 0;

-- Fix d365_items_preview table
ALTER TABLE d365_items_preview 
ADD COLUMN IF NOT EXISTS description_2 TEXT;

ALTER TABLE d365_items_preview 
ADD COLUMN IF NOT EXISTS type TEXT;

ALTER TABLE d365_items_preview 
ADD COLUMN IF NOT EXISTS base_unit_of_measure TEXT;

ALTER TABLE d365_items_preview 
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2);

ALTER TABLE d365_items_preview 
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12, 2);

ALTER TABLE d365_items_preview 
ADD COLUMN IF NOT EXISTS inventory NUMERIC(12, 2);

ALTER TABLE d365_items_preview 
ADD COLUMN IF NOT EXISTS vendor_no TEXT;

-- Fix parts_receipts table
ALTER TABLE parts_receipts 
ADD COLUMN IF NOT EXISTS requisition_line_id VARCHAR REFERENCES item_requisition_lines(id) ON DELETE CASCADE;

ALTER TABLE parts_receipts 
ADD COLUMN IF NOT EXISTS quantity_issued INTEGER;

ALTER TABLE parts_receipts 
ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP DEFAULT NOW();

ALTER TABLE parts_receipts 
ADD COLUMN IF NOT EXISTS issued_by_id VARCHAR REFERENCES employees(id);

-- Remove old columns that may conflict (if they exist with wrong names)
ALTER TABLE purchase_requests DROP COLUMN IF EXISTS requested_by;
ALTER TABLE employee_performance_snapshots DROP COLUMN IF EXISTS period_type;
ALTER TABLE employee_performance_snapshots DROP COLUMN IF EXISTS period_date;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Missing columns added successfully!';
END $$;
