import { writeFileSync } from "fs";
import { mkdir } from "fs/promises";

/**
 * Generate SQL Server schema from PostgreSQL schema
 * This creates the table structure for SQL Server / Azure SQL
 */

async function exportSQLServerSchema() {
  console.log("📋 Generating SQL Server schema...\n");

  try {
    await mkdir("sqlserver-export", { recursive: true });

    let schema = "-- SQL Server Schema for Gelan Terminal Maintenance System\n";
    schema += "-- Generated: " + new Date().toISOString() + "\n\n";
    schema += "-- Disable constraints during import\n";
    schema += "ALTER DATABASE CURRENT SET ALLOW_SNAPSHOT_ISOLATION ON;\n";
    schema += "GO\n\n";

    // Users table
    schema += `
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
GO

CREATE TABLE dbo.users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  username NVARCHAR(255) NOT NULL UNIQUE,
  password NVARCHAR(255) NOT NULL,
  full_name NVARCHAR(255) NOT NULL,
  role NVARCHAR(50) NOT NULL DEFAULT 'user',
  language NVARCHAR(10) NOT NULL DEFAULT 'en',
  created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

`;

    // Equipment Categories
    schema += `
IF OBJECT_ID('dbo.equipment_categories', 'U') IS NOT NULL DROP TABLE dbo.equipment_categories;
GO

CREATE TABLE dbo.equipment_categories (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(255) NOT NULL UNIQUE,
  description NVARCHAR(MAX),
  background_image NVARCHAR(MAX),
  created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

`;

    // Garages
    schema += `
IF OBJECT_ID('dbo.garages', 'U') IS NOT NULL DROP TABLE dbo.garages;
GO

CREATE TABLE dbo.garages (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(255) NOT NULL,
  location NVARCHAR(255),
  capacity INT,
  created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

`;

    // Employees
    schema += `
IF OBJECT_ID('dbo.employees', 'U') IS NOT NULL DROP TABLE dbo.employees;
GO

CREATE TABLE dbo.employees (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  full_name NVARCHAR(255) NOT NULL,
  phone_number NVARCHAR(50),
  email NVARCHAR(255),
  position NVARCHAR(255),
  department NVARCHAR(255),
  garage_id UNIQUEIDENTIFIER,
  user_id UNIQUEIDENTIFIER,
  status NVARCHAR(50) DEFAULT 'active',
  device_user_id NVARCHAR(50),
  device_synced BIT DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  FOREIGN KEY (garage_id) REFERENCES dbo.garages(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE SET NULL
);
GO

`;

    // Equipment
    schema += `
IF OBJECT_ID('dbo.equipment', 'U') IS NOT NULL DROP TABLE dbo.equipment;
GO

CREATE TABLE dbo.equipment (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  category_id UNIQUEIDENTIFIER,
  equipment_type NVARCHAR(255) NOT NULL,
  make NVARCHAR(255) NOT NULL,
  model NVARCHAR(255) NOT NULL,
  plate_no NVARCHAR(50),
  asset_no NVARCHAR(50),
  new_asset_no NVARCHAR(50),
  machine_serial NVARCHAR(100),
  plant_number NVARCHAR(50),
  project_area NVARCHAR(255),
  assigned_driver_id UNIQUEIDENTIFIER,
  price DECIMAL(12,2),
  remarks NVARCHAR(MAX),
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  FOREIGN KEY (category_id) REFERENCES dbo.equipment_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_driver_id) REFERENCES dbo.employees(id) ON DELETE SET NULL
);
GO

`;

    // Spare Parts
    schema += `
IF OBJECT_ID('dbo.spare_parts', 'U') IS NOT NULL DROP TABLE dbo.spare_parts;
GO

CREATE TABLE dbo.spare_parts (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  part_number NVARCHAR(100) NOT NULL UNIQUE,
  part_name NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  category NVARCHAR(100) NOT NULL,
  price DECIMAL(10,2),
  stock_quantity INT DEFAULT 0,
  stock_status NVARCHAR(50) DEFAULT 'in_stock',
  model_3d_path NVARCHAR(MAX),
  image_urls NVARCHAR(MAX), -- JSON stored as string
  specifications NVARCHAR(MAX),
  manufacturing_specs NVARCHAR(MAX),
  location_instructions NVARCHAR(MAX),
  tutorial_video_url NVARCHAR(MAX),
  tutorial_animation_url NVARCHAR(MAX),
  required_tools NVARCHAR(MAX), -- JSON stored as string
  install_time_minutes INT,
  install_time_estimates NVARCHAR(MAX),
  created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

`;

    // Workshops
    schema += `
IF OBJECT_ID('dbo.workshops', 'U') IS NOT NULL DROP TABLE dbo.workshops;
GO

CREATE TABLE dbo.workshops (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  garage_id UNIQUEIDENTIFIER,
  name NVARCHAR(255) NOT NULL,
  foreman_id UNIQUEIDENTIFIER,
  description NVARCHAR(MAX),
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  FOREIGN KEY (garage_id) REFERENCES dbo.garages(id) ON DELETE CASCADE,
  FOREIGN KEY (foreman_id) REFERENCES dbo.employees(id) ON DELETE SET NULL
);
GO

`;

    // Work Orders
    schema += `
IF OBJECT_ID('dbo.work_orders', 'U') IS NOT NULL DROP TABLE dbo.work_orders;
GO

CREATE TABLE dbo.work_orders (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  work_order_number NVARCHAR(50) UNIQUE,
  equipment_id UNIQUEIDENTIFIER,
  garage_id UNIQUEIDENTIFIER,
  assigned_to UNIQUEIDENTIFIER,
  team_members NVARCHAR(MAX), -- JSON stored as string
  priority NVARCHAR(50) DEFAULT 'medium',
  status NVARCHAR(50) DEFAULT 'pending',
  work_type NVARCHAR(100),
  description NVARCHAR(MAX),
  start_date DATE,
  estimated_completion DATE,
  actual_completion DATE,
  inspection_id UNIQUEIDENTIFIER,
  reception_id UNIQUEIDENTIFIER,
  required_parts NVARCHAR(MAX), -- JSON stored as string
  total_parts_cost DECIMAL(12,2) DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  FOREIGN KEY (equipment_id) REFERENCES dbo.equipment(id) ON DELETE SET NULL,
  FOREIGN KEY (garage_id) REFERENCES dbo.garages(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES dbo.employees(id) ON DELETE SET NULL
);
GO

`;

    // Equipment Receptions
    schema += `
IF OBJECT_ID('dbo.equipment_receptions', 'U') IS NOT NULL DROP TABLE dbo.equipment_receptions;
GO

CREATE TABLE dbo.equipment_receptions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  reception_number NVARCHAR(50) UNIQUE,
  equipment_id UNIQUEIDENTIFIER,
  driver_id UNIQUEIDENTIFIER,
  garage_id UNIQUEIDENTIFIER,
  arrival_date DATE,
  kilometrage INT,
  fuel_level NVARCHAR(50),
  reason_for_maintenance NVARCHAR(MAX),
  reported_issues NVARCHAR(MAX),
  status NVARCHAR(50) DEFAULT 'pending',
  service_type NVARCHAR(50),
  admin_issues NVARCHAR(MAX),
  inspection_officer_id UNIQUEIDENTIFIER,
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  FOREIGN KEY (equipment_id) REFERENCES dbo.equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES dbo.employees(id) ON DELETE SET NULL,
  FOREIGN KEY (garage_id) REFERENCES dbo.garages(id) ON DELETE SET NULL,
  FOREIGN KEY (inspection_officer_id) REFERENCES dbo.employees(id) ON DELETE SET NULL
);
GO

`;

    // Equipment Inspections
    schema += `
IF OBJECT_ID('dbo.equipment_inspections', 'U') IS NOT NULL DROP TABLE dbo.equipment_inspections;
GO

CREATE TABLE dbo.equipment_inspections (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  inspection_number NVARCHAR(50) UNIQUE,
  reception_id UNIQUEIDENTIFIER,
  inspector_id UNIQUEIDENTIFIER,
  status NVARCHAR(50) DEFAULT 'in_progress',
  service_type NVARCHAR(50),
  inspection_date DATE,
  submitted_at DATETIME2,
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  FOREIGN KEY (reception_id) REFERENCES dbo.equipment_receptions(id) ON DELETE CASCADE,
  FOREIGN KEY (inspector_id) REFERENCES dbo.employees(id) ON DELETE SET NULL
);
GO

`;

    // Inspection Checklist Items
    schema += `
IF OBJECT_ID('dbo.inspection_checklist_items', 'U') IS NOT NULL DROP TABLE dbo.inspection_checklist_items;
GO

CREATE TABLE dbo.inspection_checklist_items (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  inspection_id UNIQUEIDENTIFIER,
  item_number INT,
  item_name_amharic NVARCHAR(255),
  status NVARCHAR(50),
  comments NVARCHAR(MAX),
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  FOREIGN KEY (inspection_id) REFERENCES dbo.equipment_inspections(id) ON DELETE CASCADE
);
GO

`;

    // Approvals
    schema += `
IF OBJECT_ID('dbo.approvals', 'U') IS NOT NULL DROP TABLE dbo.approvals;
GO

CREATE TABLE dbo.approvals (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  type NVARCHAR(50),
  reference_id UNIQUEIDENTIFIER,
  requester_id UNIQUEIDENTIFIER,
  approver_id UNIQUEIDENTIFIER,
  status NVARCHAR(50) DEFAULT 'pending',
  department NVARCHAR(100),
  amount DECIMAL(12,2),
  description NVARCHAR(MAX),
  requested_at DATETIME2 DEFAULT GETDATE(),
  reviewed_at DATETIME2,
  comments NVARCHAR(MAX),
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  FOREIGN KEY (requester_id) REFERENCES dbo.employees(id) ON DELETE SET NULL,
  FOREIGN KEY (approver_id) REFERENCES dbo.employees(id) ON DELETE SET NULL
);
GO

`;

    schema += "\n-- Schema creation completed\n";
    schema += "PRINT 'SQL Server schema created successfully!'\n";
    schema += "GO\n";

    writeFileSync('sqlserver-export/schema.sql', schema);

    console.log("✅ SQL Server schema generated successfully!");
    console.log("📄 File: sqlserver-export/schema.sql\n");
    console.log("📌 To import into SQL Server:");
    console.log("   1. Open SQL Server Management Studio (SSMS)");
    console.log("   2. Create database: CREATE DATABASE GelanTerminal;");
    console.log("   3. Open schema.sql file");
    console.log("   4. Execute the script");
    console.log("   5. Then run: tsx server/export-to-sqlserver.ts");
    console.log("   6. Import the data.sql file\n");

  } catch (error: any) {
    console.error("❌ Error:", error);
    throw error;
  }
}

exportSQLServerSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
