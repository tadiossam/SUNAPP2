#!/usr/bin/env tsx
/**
 * Direct schema migration script for new workflow system tables
 * Bypasses interactive drizzle-kit prompts
 */

import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function applyWorkflowSchema() {
  console.log("🚀 Applying new workflow system schema...\n");

  try {
    // Create work_order_garages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS work_order_garages (
        work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
        garage_id VARCHAR NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
        PRIMARY KEY (work_order_id, garage_id)
      );
    `);
    console.log("✅ Created work_order_garages table");

    // Create work_order_workshops table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS work_order_workshops (
        work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
        workshop_id VARCHAR NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
        foreman_id VARCHAR REFERENCES employees(id),
        is_primary BOOLEAN DEFAULT FALSE,
        assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
        PRIMARY KEY (work_order_id, workshop_id)
      );
    `);
    console.log("✅ Created work_order_workshops table");

    // Create work_order_memberships table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS work_order_memberships (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
        employee_id VARCHAR NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        assigned_by VARCHAR REFERENCES employees(id),
        assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        deactivated_at TIMESTAMP
      );
    `);
    console.log("✅ Created work_order_memberships table");

    // Create work_order_status_history table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS work_order_status_history (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
        from_status TEXT,
        to_status TEXT NOT NULL,
        changed_by_id VARCHAR NOT NULL REFERENCES employees(id),
        changed_by_role TEXT,
        notes TEXT,
        metadata TEXT,
        changed_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Created work_order_status_history table");

    // Create approval_stages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS approval_stages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        sequence INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Created approval_stages table");

    // Create work_order_approvals table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS work_order_approvals (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
        stage_id VARCHAR NOT NULL REFERENCES approval_stages(id),
        approver_id VARCHAR NOT NULL REFERENCES employees(id),
        status TEXT DEFAULT 'pending' NOT NULL,
        decided_at TIMESTAMP,
        remarks TEXT,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Created work_order_approvals table");

    // Create item_requisitions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS item_requisitions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        requisition_number TEXT NOT NULL UNIQUE,
        work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
        requester_id VARCHAR NOT NULL REFERENCES employees(id),
        workshop_id VARCHAR REFERENCES workshops(id),
        status TEXT DEFAULT 'draft' NOT NULL,
        foreman_approval_status TEXT DEFAULT 'pending',
        foreman_approved_by_id VARCHAR REFERENCES employees(id),
        foreman_approved_at TIMESTAMP,
        foreman_remarks TEXT,
        store_approval_status TEXT DEFAULT 'pending',
        store_approved_by_id VARCHAR REFERENCES employees(id),
        store_approved_at TIMESTAMP,
        store_remarks TEXT,
        needed_by TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Created item_requisitions table");

    // Create item_requisition_lines table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS item_requisition_lines (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        requisition_id VARCHAR NOT NULL REFERENCES item_requisitions(id) ON DELETE CASCADE,
        line_number INTEGER NOT NULL,
        spare_part_id VARCHAR REFERENCES spare_parts(id),
        description TEXT NOT NULL,
        unit_of_measure TEXT,
        quantity_requested INTEGER NOT NULL,
        quantity_approved INTEGER,
        status TEXT DEFAULT 'pending' NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Created item_requisition_lines table");

    // Create purchase_requests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS purchase_requests (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_request_number TEXT NOT NULL UNIQUE,
        requisition_line_id VARCHAR NOT NULL REFERENCES item_requisition_lines(id) ON DELETE CASCADE,
        store_manager_id VARCHAR NOT NULL REFERENCES employees(id),
        status TEXT DEFAULT 'pending' NOT NULL,
        vendor_id VARCHAR,
        vendor_name TEXT,
        expected_date TIMESTAMP,
        actual_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Created purchase_requests table");

    // Create employee_performance_snapshots table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS employee_performance_snapshots (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id VARCHAR NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        snapshot_date TIMESTAMP NOT NULL,
        granularity TEXT NOT NULL,
        tasks_completed INTEGER DEFAULT 0,
        total_labor_minutes INTEGER DEFAULT 0,
        quality_score NUMERIC(5, 2),
        work_orders_completed INTEGER DEFAULT 0,
        item_requisitions_processed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Created employee_performance_snapshots table");

    // Create employee_performance_totals table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS employee_performance_totals (
        employee_id VARCHAR PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
        total_tasks_completed INTEGER DEFAULT 0,
        total_work_orders_completed INTEGER DEFAULT 0,
        total_labor_hours NUMERIC(10, 2) DEFAULT 0,
        average_quality_score NUMERIC(5, 2),
        employee_of_month_count INTEGER DEFAULT 0,
        employee_of_year_count INTEGER DEFAULT 0,
        last_award_date TIMESTAMP,
        last_updated TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Created employee_performance_totals table");

    // Modify work_orders table to remove deprecated fields (if needed)
    await db.execute(sql`
      ALTER TABLE work_orders 
      DROP COLUMN IF EXISTS assigned_to_ids,
      DROP COLUMN IF EXISTS estimated_hours,
      DROP COLUMN IF EXISTS estimated_cost,
      DROP COLUMN IF EXISTS scheduled_date,
      DROP COLUMN IF EXISTS notes;
    `);
    console.log("✅ Modified work_orders table (removed deprecated fields)");

    console.log("\n✅ All workflow system tables created successfully!");
    console.log("📊 Total tables created: 11");
    console.log("\nNew workflow is ready to use! 🎉\n");

  } catch (error) {
    console.error("❌ Error applying schema:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

applyWorkflowSchema();
