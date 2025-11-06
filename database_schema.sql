-- ============================================
-- GELAN TERMINAL MAINTENANCE DATABASE SCHEMA
-- Complete PostgreSQL Schema for Manual Execution
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- EQUIPMENT MANAGEMENT
-- ============================================

-- Equipment Categories
CREATE TABLE IF NOT EXISTS equipment_categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  background_image TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Equipment
CREATE TABLE IF NOT EXISTS equipment (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id VARCHAR REFERENCES equipment_categories(id) ON DELETE SET NULL,
  equipment_type TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  plate_no TEXT,
  asset_no TEXT,
  new_asset_no TEXT,
  machine_serial TEXT,
  plant_number TEXT,
  project_area TEXT,
  assigned_driver_id VARCHAR,
  price NUMERIC(12, 2),
  remarks TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- SPARE PARTS CATALOG
-- ============================================

-- Spare Parts
CREATE TABLE IF NOT EXISTS spare_parts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT NOT NULL UNIQUE,
  part_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  stock_status TEXT NOT NULL DEFAULT 'in_stock',
  model_3d_path TEXT,
  image_urls TEXT[],
  specifications TEXT,
  manufacturing_specs TEXT,
  location_instructions TEXT,
  tutorial_video_url TEXT,
  tutorial_animation_url TEXT,
  required_tools TEXT[],
  install_time_minutes INTEGER,
  install_time_estimates TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Equipment-Parts Compatibility
CREATE TABLE IF NOT EXISTS equipment_parts_compatibility (
  equipment_id VARCHAR NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  part_id VARCHAR NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (equipment_id, part_id)
);

-- Part Compatibility (Make/Model)
CREATE TABLE IF NOT EXISTS part_compatibility (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id VARCHAR NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- GARAGE MANAGEMENT
-- ============================================

-- Garages
CREATE TABLE IF NOT EXISTS garages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  capacity INTEGER,
  contact_person TEXT,
  phone_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL UNIQUE,
  device_user_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT NOT NULL,
  specialty TEXT,
  phone_number TEXT,
  email TEXT,
  profile_picture TEXT,
  garage_id VARCHAR REFERENCES garages(id),
  department TEXT,
  can_approve BOOLEAN DEFAULT FALSE,
  approval_limit NUMERIC(12, 2),
  supervisor_id VARCHAR REFERENCES employees(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  hire_date TIMESTAMP,
  certifications TEXT[],
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add FK to equipment after employees table is created
ALTER TABLE equipment ADD CONSTRAINT fk_equipment_driver 
  FOREIGN KEY (assigned_driver_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Workshops
CREATE TABLE IF NOT EXISTS workshops (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id VARCHAR NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  foreman_id VARCHAR NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  monthly_target INTEGER,
  q1_target INTEGER,
  q2_target INTEGER,
  q3_target INTEGER,
  q4_target INTEGER,
  annual_target INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Workshop Members
CREATE TABLE IF NOT EXISTS workshop_members (
  workshop_id VARCHAR NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  employee_id VARCHAR NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role TEXT,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workshop_id, employee_id)
);

-- ============================================
-- WORK ORDER SYSTEM
-- ============================================

-- Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number TEXT NOT NULL UNIQUE,
  equipment_id VARCHAR NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  inspection_id VARCHAR,
  reception_id VARCHAR,
  priority TEXT NOT NULL DEFAULT 'medium',
  work_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_allocation',
  actual_hours NUMERIC(5, 2),
  actual_cost NUMERIC(12, 2),
  direct_maintenance_cost NUMERIC(12, 2),
  overtime_cost NUMERIC(12, 2),
  outsource_cost NUMERIC(12, 2),
  overhead_cost NUMERIC(12, 2),
  is_outsourced BOOLEAN DEFAULT FALSE,
  approval_status TEXT DEFAULT 'not_required',
  approved_by_id VARCHAR REFERENCES employees(id),
  approved_at TIMESTAMP,
  approval_notes TEXT,
  completion_approval_status TEXT DEFAULT 'not_required',
  completion_approved_by_id VARCHAR REFERENCES employees(id),
  completion_approved_at TIMESTAMP,
  completion_approval_notes TEXT,
  created_by_id VARCHAR REFERENCES employees(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Work Order Garages (Junction)
CREATE TABLE IF NOT EXISTS work_order_garages (
  work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  garage_id VARCHAR NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (work_order_id, garage_id)
);

-- Work Order Workshops (Junction)
CREATE TABLE IF NOT EXISTS work_order_workshops (
  work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  workshop_id VARCHAR NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  foreman_id VARCHAR REFERENCES employees(id),
  is_primary BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (work_order_id, workshop_id)
);

-- Work Order Memberships
CREATE TABLE IF NOT EXISTS work_order_memberships (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  employee_id VARCHAR NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  assigned_by VARCHAR REFERENCES employees(id),
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deactivated_at TIMESTAMP
);

-- Work Order Status History
CREATE TABLE IF NOT EXISTS work_order_status_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by_id VARCHAR NOT NULL REFERENCES employees(id),
  changed_by_role TEXT,
  notes TEXT,
  metadata TEXT,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Work Order Time Tracking
CREATE TABLE IF NOT EXISTS work_order_time_tracking (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Approval Stages
CREATE TABLE IF NOT EXISTS approval_stages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  required_role TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Work Order Approvals
CREATE TABLE IF NOT EXISTS work_order_approvals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  stage_id VARCHAR NOT NULL REFERENCES approval_stages(id),
  approver_id VARCHAR REFERENCES employees(id),
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- ITEM REQUISITION SYSTEM
-- ============================================

-- Item Requisitions
CREATE TABLE IF NOT EXISTS item_requisitions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_number TEXT NOT NULL UNIQUE,
  work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  requester_id VARCHAR NOT NULL REFERENCES employees(id),
  workshop_id VARCHAR REFERENCES workshops(id),
  overall_status TEXT NOT NULL DEFAULT 'pending',
  foreman_reviewed BOOLEAN DEFAULT FALSE,
  store_manager_processed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Item Requisition Lines
CREATE TABLE IF NOT EXISTS item_requisition_lines (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id VARCHAR NOT NULL REFERENCES item_requisitions(id) ON DELETE CASCADE,
  spare_part_id VARCHAR REFERENCES spare_parts(id) ON DELETE SET NULL,
  part_description TEXT NOT NULL,
  quantity_requested INTEGER NOT NULL,
  foreman_decision TEXT DEFAULT 'pending',
  foreman_approved_quantity INTEGER,
  foreman_reviewer_id VARCHAR REFERENCES employees(id),
  foreman_reviewed_at TIMESTAMP,
  foreman_notes TEXT,
  store_manager_decision TEXT DEFAULT 'pending',
  quantity_fulfilled INTEGER DEFAULT 0,
  store_manager_notes TEXT,
  store_manager_processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Purchase Requests
CREATE TABLE IF NOT EXISTS purchase_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_number TEXT NOT NULL UNIQUE,
  requisition_line_id VARCHAR NOT NULL REFERENCES item_requisition_lines(id) ON DELETE CASCADE,
  spare_part_id VARCHAR REFERENCES spare_parts(id),
  part_description TEXT NOT NULL,
  quantity_needed INTEGER NOT NULL,
  estimated_unit_cost NUMERIC(10, 2),
  total_estimated_cost NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by_id VARCHAR NOT NULL REFERENCES employees(id),
  foreman_approved_by_id VARCHAR REFERENCES employees(id),
  foreman_approved_at TIMESTAMP,
  store_manager_id VARCHAR REFERENCES employees(id),
  vendor_name TEXT,
  vendor_contact TEXT,
  expected_delivery_date TIMESTAMP,
  received_date TIMESTAMP,
  actual_cost NUMERIC(12, 2),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Parts Receipts (Issued Parts)
CREATE TABLE IF NOT EXISTS parts_receipts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  requisition_line_id VARCHAR REFERENCES item_requisition_lines(id),
  spare_part_id VARCHAR NOT NULL REFERENCES spare_parts(id),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(10, 2),
  total_cost NUMERIC(12, 2),
  issued_by_id VARCHAR REFERENCES employees(id),
  issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- EMPLOYEE PERFORMANCE TRACKING
-- ============================================

-- Employee Performance Snapshots
CREATE TABLE IF NOT EXISTS employee_performance_snapshots (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL,
  period_date DATE NOT NULL,
  completed_work_orders INTEGER NOT NULL DEFAULT 0,
  total_active_duration_seconds INTEGER NOT NULL DEFAULT 0,
  avg_completion_time_seconds INTEGER,
  performance_score NUMERIC(5, 2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, period_type, period_date)
);

-- Employee Performance Totals
CREATE TABLE IF NOT EXISTS employee_performance_totals (
  employee_id VARCHAR PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  total_completed_work_orders INTEGER NOT NULL DEFAULT 0,
  total_active_duration_seconds INTEGER NOT NULL DEFAULT 0,
  avg_completion_time_seconds INTEGER,
  overall_performance_score NUMERIC(5, 2),
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- STORAGE & LOCATION TRACKING
-- ============================================

-- Parts Storage Locations
CREATE TABLE IF NOT EXISTS parts_storage_locations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id VARCHAR NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  garage_id VARCHAR REFERENCES garages(id),
  zone TEXT,
  aisle TEXT,
  rack TEXT,
  bin TEXT,
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Equipment Locations
CREATE TABLE IF NOT EXISTS equipment_locations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id VARCHAR NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  garage_id VARCHAR REFERENCES garages(id),
  workshop_id VARCHAR REFERENCES workshops(id),
  location_type TEXT NOT NULL,
  status TEXT,
  arrived_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- WAREHOUSE MANAGEMENT
-- ============================================

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Warehouse Zones
CREATE TABLE IF NOT EXISTS warehouse_zones (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id VARCHAR NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  zone_type TEXT,
  capacity INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Stock Ledger
CREATE TABLE IF NOT EXISTS stock_ledger (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  spare_part_id VARCHAR NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reference_type TEXT,
  reference_id VARCHAR,
  performed_by_id VARCHAR REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Stock Reservations
CREATE TABLE IF NOT EXISTS stock_reservations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  spare_part_id VARCHAR NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  work_order_id VARCHAR REFERENCES work_orders(id) ON DELETE CASCADE,
  quantity_reserved INTEGER NOT NULL,
  reserved_by_id VARCHAR REFERENCES employees(id),
  expires_at TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Reorder Rules
CREATE TABLE IF NOT EXISTS reorder_rules (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  spare_part_id VARCHAR NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  reorder_point INTEGER NOT NULL,
  reorder_quantity INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- EQUIPMENT RECEPTION & INSPECTION
-- ============================================

-- Equipment Receptions
CREATE TABLE IF NOT EXISTS equipment_receptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_number TEXT NOT NULL UNIQUE,
  equipment_id VARCHAR NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  driver_id VARCHAR REFERENCES employees(id),
  reception_type TEXT NOT NULL,
  check_in_date TIMESTAMP NOT NULL,
  operating_hours INTEGER,
  fuel_level TEXT,
  mileage INTEGER,
  condition_notes TEXT,
  reported_issues TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending_review',
  mechanic_id VARCHAR REFERENCES employees(id),
  inspection_officer_id VARCHAR REFERENCES employees(id),
  admin_reviewed_by_id VARCHAR REFERENCES employees(id),
  admin_reviewed_at TIMESTAMP,
  admin_notes TEXT,
  work_order_id VARCHAR REFERENCES work_orders(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Reception Checklists
CREATE TABLE IF NOT EXISTS reception_checklists (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  reception_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Reception Inspection Items
CREATE TABLE IF NOT EXISTS reception_inspection_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_id VARCHAR NOT NULL REFERENCES equipment_receptions(id) ON DELETE CASCADE,
  checklist_id VARCHAR REFERENCES reception_checklists(id),
  item_name TEXT NOT NULL,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Damage Reports
CREATE TABLE IF NOT EXISTS damage_reports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_id VARCHAR NOT NULL REFERENCES equipment_receptions(id) ON DELETE CASCADE,
  damage_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  location_on_equipment TEXT,
  photo_urls TEXT[],
  estimated_repair_cost NUMERIC(12, 2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Repair Estimates
CREATE TABLE IF NOT EXISTS repair_estimates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_id VARCHAR NOT NULL REFERENCES equipment_receptions(id) ON DELETE CASCADE,
  estimated_labor_hours NUMERIC(5, 2),
  estimated_parts_cost NUMERIC(12, 2),
  estimated_labor_cost NUMERIC(12, 2),
  estimated_total_cost NUMERIC(12, 2),
  estimated_completion_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Equipment Inspections
CREATE TABLE IF NOT EXISTS equipment_inspections (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_number TEXT NOT NULL UNIQUE,
  reception_id VARCHAR REFERENCES equipment_receptions(id),
  equipment_id VARCHAR NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  inspector_id VARCHAR NOT NULL REFERENCES employees(id),
  inspection_type TEXT NOT NULL,
  inspection_date TIMESTAMP NOT NULL,
  overall_condition TEXT,
  recommendations TEXT,
  requires_immediate_attention BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  work_order_id VARCHAR REFERENCES work_orders(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Inspection Checklist Items
CREATE TABLE IF NOT EXISTS inspection_checklist_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id VARCHAR NOT NULL REFERENCES equipment_inspections(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  requires_repair BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- LEGACY MAINTENANCE SYSTEM
-- ============================================

-- Mechanics (Legacy)
CREATE TABLE IF NOT EXISTS mechanics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  specialty TEXT,
  phone_number TEXT,
  email TEXT,
  employee_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Maintenance Records (Legacy)
CREATE TABLE IF NOT EXISTS maintenance_records (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id VARCHAR NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  mechanic_id VARCHAR REFERENCES mechanics(id),
  maintenance_type TEXT NOT NULL,
  description TEXT NOT NULL,
  operating_hours INTEGER,
  labor_hours NUMERIC(5, 2),
  cost NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'completed',
  maintenance_date TIMESTAMP NOT NULL,
  completed_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Parts Usage History (Legacy)
CREATE TABLE IF NOT EXISTS parts_usage_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_record_id VARCHAR NOT NULL REFERENCES maintenance_records(id) ON DELETE CASCADE,
  part_id VARCHAR NOT NULL REFERENCES spare_parts(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Operating Behavior Reports
CREATE TABLE IF NOT EXISTS operating_behavior_reports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id VARCHAR NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  report_date TIMESTAMP NOT NULL,
  operating_hours INTEGER NOT NULL,
  fuel_consumption NUMERIC(10, 2),
  productivity TEXT,
  issues_reported TEXT,
  operator_notes TEXT,
  performance_rating INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Work Order Required Parts (DEPRECATED - Legacy)
CREATE TABLE IF NOT EXISTS work_order_required_parts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  spare_part_id VARCHAR REFERENCES spare_parts(id) ON DELETE SET NULL,
  part_name TEXT NOT NULL,
  part_number TEXT NOT NULL,
  stock_status TEXT,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- APPROVAL SYSTEM (Legacy/Generic)
-- ============================================

-- Parts Requests (Legacy)
CREATE TABLE IF NOT EXISTS parts_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id VARCHAR REFERENCES work_orders(id) ON DELETE CASCADE,
  requested_by_id VARCHAR NOT NULL REFERENCES employees(id),
  approved_by_id VARCHAR REFERENCES employees(id),
  status TEXT NOT NULL DEFAULT 'pending',
  request_details TEXT,
  approval_notes TEXT,
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Approvals (Generic)
CREATE TABLE IF NOT EXISTS approvals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_type TEXT NOT NULL,
  reference_id VARCHAR NOT NULL,
  requested_by_id VARCHAR NOT NULL REFERENCES employees(id),
  assigned_to_id VARCHAR REFERENCES employees(id),
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  decision_notes TEXT,
  escalated_to_id VARCHAR REFERENCES employees(id),
  escalated_at TIMESTAMP,
  decided_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- ATTENDANCE DEVICE INTEGRATION
-- ============================================

-- Attendance Device Settings
CREATE TABLE IF NOT EXISTS attendance_device_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  device_ip TEXT NOT NULL,
  device_port INTEGER NOT NULL DEFAULT 4370,
  device_model TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Device Import Logs
CREATE TABLE IF NOT EXISTS device_import_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type TEXT NOT NULL,
  records_imported INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  status TEXT NOT NULL,
  imported_by_id VARCHAR REFERENCES employees(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- DYNAMICS 365 BUSINESS CENTRAL INTEGRATION
-- ============================================

-- Dynamics 365 Settings
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

-- D365 Sync Logs
CREATE TABLE IF NOT EXISTS d365_sync_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  triggered_by VARCHAR REFERENCES employees(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Items (Synced from D365)
CREATE TABLE IF NOT EXISTS items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  item_no TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  description_2 TEXT,
  type TEXT,
  base_unit_of_measure TEXT,
  unit_price NUMERIC(12, 2),
  unit_cost NUMERIC(12, 2),
  inventory NUMERIC(12, 2),
  vendor_no TEXT,
  vendor_item_no TEXT,
  last_date_modified TEXT,
  synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- D365 Items Preview (Staging)
CREATE TABLE IF NOT EXISTS d365_items_preview (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id VARCHAR NOT NULL,
  item_no TEXT NOT NULL,
  description TEXT,
  description_2 TEXT,
  type TEXT,
  base_unit_of_measure TEXT,
  unit_price NUMERIC(12, 2),
  unit_cost NUMERIC(12, 2),
  inventory NUMERIC(12, 2),
  vendor_no TEXT,
  vendor_item_no TEXT,
  last_date_modified TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Equipment indexes
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_driver ON equipment(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_equipment_plate ON equipment(plate_no);

-- Spare parts indexes
CREATE INDEX IF NOT EXISTS idx_spare_parts_number ON spare_parts(part_number);
CREATE INDEX IF NOT EXISTS idx_spare_parts_category ON spare_parts(category);
CREATE INDEX IF NOT EXISTS idx_spare_parts_status ON spare_parts(stock_status);

-- Employee indexes
CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_garage ON employees(garage_id);

-- Work order indexes
CREATE INDEX IF NOT EXISTS idx_work_orders_number ON work_orders(work_order_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_equipment ON work_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_by ON work_orders(created_by_id);

-- Item requisition indexes
CREATE INDEX IF NOT EXISTS idx_requisitions_number ON item_requisitions(requisition_number);
CREATE INDEX IF NOT EXISTS idx_requisitions_work_order ON item_requisitions(work_order_id);
CREATE INDEX IF NOT EXISTS idx_requisition_lines_requisition ON item_requisition_lines(requisition_id);
CREATE INDEX IF NOT EXISTS idx_requisition_lines_part ON item_requisition_lines(spare_part_id);

-- Parts receipts indexes
CREATE INDEX IF NOT EXISTS idx_parts_receipts_work_order ON parts_receipts(work_order_id);
CREATE INDEX IF NOT EXISTS idx_parts_receipts_part ON parts_receipts(spare_part_id);

-- Performance tracking indexes
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_employee ON employee_performance_snapshots(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_period ON employee_performance_snapshots(period_type, period_date);

-- Equipment reception indexes
CREATE INDEX IF NOT EXISTS idx_receptions_number ON equipment_receptions(reception_number);
CREATE INDEX IF NOT EXISTS idx_receptions_equipment ON equipment_receptions(equipment_id);
CREATE INDEX IF NOT EXISTS idx_receptions_status ON equipment_receptions(status);

-- Inspection indexes
CREATE INDEX IF NOT EXISTS idx_inspections_number ON equipment_inspections(inspection_number);
CREATE INDEX IF NOT EXISTS idx_inspections_equipment ON equipment_inspections(equipment_id);

-- D365 indexes
CREATE INDEX IF NOT EXISTS idx_items_no ON items(item_no);

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

-- Schema creation complete
DO $$ 
BEGIN 
  RAISE NOTICE 'Gelan Terminal Maintenance database schema created successfully!';
END $$;
