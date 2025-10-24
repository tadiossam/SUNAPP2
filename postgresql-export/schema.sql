-- PostgreSQL Schema for Gelan Terminal Maintenance System
-- Generated: 2025-10-24T04:17:10.147Z

-- This file creates all tables needed for the application

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Equipment Categories
CREATE TABLE IF NOT EXISTS equipment_categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  background_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Garages
CREATE TABLE IF NOT EXISTS garages (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  capacity INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  manager_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Attendance Device Settings
CREATE TABLE IF NOT EXISTS attendance_device_settings (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  device_ip VARCHAR(50) NOT NULL,
  device_port INTEGER DEFAULT 4370,
  status VARCHAR(50) DEFAULT 'disconnected',
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  email VARCHAR(255),
  position VARCHAR(255),
  department VARCHAR(255),
  garage_id VARCHAR(36),
  user_id VARCHAR(36),
  status VARCHAR(50) DEFAULT 'active',
  device_user_id VARCHAR(50),
  device_synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


-- Workshops
CREATE TABLE IF NOT EXISTS workshops (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  garage_id VARCHAR(36),
  name VARCHAR(255) NOT NULL,
  foreman_id VARCHAR(36),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE CASCADE,
  FOREIGN KEY (foreman_id) REFERENCES employees(id) ON DELETE SET NULL
);


-- Equipment
CREATE TABLE IF NOT EXISTS equipment (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category_id VARCHAR(36),
  equipment_type VARCHAR(255) NOT NULL,
  make VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  plate_no VARCHAR(50),
  asset_no VARCHAR(50),
  new_asset_no VARCHAR(50),
  machine_serial VARCHAR(100),
  plant_number VARCHAR(50),
  project_area VARCHAR(255),
  assigned_driver_id VARCHAR(36),
  price DECIMAL(12,2),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES equipment_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_driver_id) REFERENCES employees(id) ON DELETE SET NULL
);


-- Spare Parts
CREATE TABLE IF NOT EXISTS spare_parts (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  part_number VARCHAR(100) NOT NULL UNIQUE,
  part_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  stock_status VARCHAR(50) DEFAULT 'in_stock',
  model_3d_path TEXT,
  image_urls TEXT,
  specifications TEXT,
  manufacturing_specs TEXT,
  location_instructions TEXT,
  tutorial_video_url TEXT,
  tutorial_animation_url TEXT,
  required_tools TEXT,
  install_time_minutes INTEGER,
  install_time_estimates TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Equipment Receptions
CREATE TABLE IF NOT EXISTS equipment_receptions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reception_number VARCHAR(50) UNIQUE,
  equipment_id VARCHAR(36),
  driver_id VARCHAR(36),
  garage_id VARCHAR(36),
  arrival_date DATE,
  kilometrage INTEGER,
  fuel_level VARCHAR(50),
  reason_for_maintenance TEXT,
  reported_issues TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  service_type VARCHAR(50),
  admin_issues TEXT,
  inspection_officer_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE SET NULL,
  FOREIGN KEY (inspection_officer_id) REFERENCES employees(id) ON DELETE SET NULL
);


-- Equipment Inspections
CREATE TABLE IF NOT EXISTS equipment_inspections (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  inspection_number VARCHAR(50) UNIQUE,
  reception_id VARCHAR(36),
  inspector_id VARCHAR(36),
  status VARCHAR(50) DEFAULT 'in_progress',
  service_type VARCHAR(50),
  inspection_date DATE,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reception_id) REFERENCES equipment_receptions(id) ON DELETE CASCADE,
  FOREIGN KEY (inspector_id) REFERENCES employees(id) ON DELETE SET NULL
);


-- Inspection Checklist Items
CREATE TABLE IF NOT EXISTS inspection_checklist_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  inspection_id VARCHAR(36),
  item_number INTEGER,
  item_name_amharic VARCHAR(255),
  status VARCHAR(50),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inspection_id) REFERENCES equipment_inspections(id) ON DELETE CASCADE
);


-- Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  work_order_number VARCHAR(50) UNIQUE,
  equipment_id VARCHAR(36),
  garage_id VARCHAR(36),
  assigned_to VARCHAR(36),
  team_members TEXT,
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  work_type VARCHAR(100),
  description TEXT,
  start_date DATE,
  estimated_completion DATE,
  actual_completion DATE,
  inspection_id VARCHAR(36),
  reception_id VARCHAR(36),
  required_parts TEXT,
  total_parts_cost DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
  FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL
);


-- Approvals
CREATE TABLE IF NOT EXISTS approvals (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type VARCHAR(50),
  reference_id VARCHAR(36),
  requester_id VARCHAR(36),
  approver_id VARCHAR(36),
  status VARCHAR(50) DEFAULT 'pending',
  department VARCHAR(100),
  amount DECIMAL(12,2),
  description TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (approver_id) REFERENCES employees(id) ON DELETE SET NULL
);


-- Schema creation completed successfully
