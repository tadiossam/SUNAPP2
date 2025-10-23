import { writeFileSync } from "fs";
import { mkdir } from "fs/promises";

/**
 * Generate MySQL schema from PostgreSQL schema
 * This creates the table structure for MySQL
 */

async function exportMySQLSchema() {
  console.log("📋 Generating MySQL schema...\n");

  try {
    await mkdir("mysql-export", { recursive: true });

    let schema = "-- MySQL Schema for Gelan Terminal Maintenance System\n";
    schema += "-- Generated: " + new Date().toISOString() + "\n\n";
    schema += "SET FOREIGN_KEY_CHECKS=0;\n\n";

    // Users table
    schema += `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

    // Equipment Categories
    schema += `
CREATE TABLE IF NOT EXISTS equipment_categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  background_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

    // Garages
    schema += `
CREATE TABLE IF NOT EXISTS garages (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  capacity INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

    // Employees
    schema += `
CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

    // Equipment
    schema += `
CREATE TABLE IF NOT EXISTS equipment (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

    // Spare Parts
    schema += `
CREATE TABLE IF NOT EXISTS spare_parts (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  part_number VARCHAR(100) NOT NULL UNIQUE,
  part_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2),
  stock_quantity INT DEFAULT 0,
  stock_status VARCHAR(50) DEFAULT 'in_stock',
  model_3d_path TEXT,
  image_urls JSON,
  specifications TEXT,
  manufacturing_specs TEXT,
  location_instructions TEXT,
  tutorial_video_url TEXT,
  tutorial_animation_url TEXT,
  required_tools JSON,
  install_time_minutes INT,
  install_time_estimates TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

    // Work Orders
    schema += `
CREATE TABLE IF NOT EXISTS work_orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  work_order_number VARCHAR(50) UNIQUE,
  equipment_id VARCHAR(36),
  garage_id VARCHAR(36),
  assigned_to VARCHAR(36),
  team_members JSON,
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  work_type VARCHAR(100),
  description TEXT,
  start_date DATE,
  estimated_completion DATE,
  actual_completion DATE,
  inspection_id VARCHAR(36),
  reception_id VARCHAR(36),
  required_parts JSON,
  total_parts_cost DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
  FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

    // Equipment Receptions
    schema += `
CREATE TABLE IF NOT EXISTS equipment_receptions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  reception_number VARCHAR(50) UNIQUE,
  equipment_id VARCHAR(36),
  driver_id VARCHAR(36),
  garage_id VARCHAR(36),
  arrival_date DATE,
  kilometrage INT,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

    // Equipment Inspections
    schema += `
CREATE TABLE IF NOT EXISTS equipment_inspections (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

    // Inspection Checklist Items
    schema += `
CREATE TABLE IF NOT EXISTS inspection_checklist_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  inspection_id VARCHAR(36),
  item_number INT,
  item_name_amharic VARCHAR(255),
  status VARCHAR(50),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inspection_id) REFERENCES equipment_inspections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

    // Approvals
    schema += `
CREATE TABLE IF NOT EXISTS approvals (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

    schema += "\nSET FOREIGN_KEY_CHECKS=1;\n";

    writeFileSync('mysql-export/schema.sql', schema);

    console.log("✅ MySQL schema generated successfully!");
    console.log("📄 File: mysql-export/schema.sql\n");
    console.log("📌 To import into MySQL:");
    console.log("   1. Create database: CREATE DATABASE gelan_terminal;");
    console.log("   2. Import schema: mysql -u root -p gelan_terminal < mysql-export/schema.sql");
    console.log("   3. Import data: tsx server/export-to-mysql.ts");
    console.log("   4. Import data file: mysql -u root -p gelan_terminal < mysql-export/data.sql\n");

  } catch (error: any) {
    console.error("❌ Error:", error);
    throw error;
  }
}

exportMySQLSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
