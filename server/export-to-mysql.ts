import { db } from "./db";
import * as schema from "@shared/schema";
import { writeFileSync } from "fs";
import { mkdir } from "fs/promises";

/**
 * Export all data from PostgreSQL to MySQL-compatible SQL file
 * 
 * Usage: tsx server/export-to-mysql.ts
 */

async function exportToMySQL() {
  console.log("📦 Exporting PostgreSQL data to MySQL format...\n");

  try {
    await mkdir("mysql-export", { recursive: true });

    let sqlOutput = "-- MySQL Export from PostgreSQL\n";
    sqlOutput += "-- Generated: " + new Date().toISOString() + "\n\n";
    sqlOutput += "SET FOREIGN_KEY_CHECKS=0;\n\n";

    // Define export order (respecting foreign key dependencies)
    const tables = [
      { name: "users", table: schema.users },
      { name: "equipment_categories", table: schema.equipmentCategories },
      { name: "garages", table: schema.garages },
      { name: "warehouses", table: schema.warehouses },
      { name: "attendance_device_settings", table: schema.attendanceDeviceSettings },
      { name: "employees", table: schema.employees },
      { name: "workshops", table: schema.workshops },
      { name: "warehouse_zones", table: schema.warehouseZones },
      { name: "mechanics", table: schema.mechanics },
      { name: "equipment", table: schema.equipment },
      { name: "spare_parts", table: schema.spareParts },
      { name: "reorder_rules", table: schema.reorderRules },
      { name: "workshop_members", table: schema.workshopMembers },
      { name: "equipment_parts_compatibility", table: schema.equipmentPartsCompatibility },
      { name: "part_compatibility", table: schema.partCompatibility },
      { name: "parts_storage_locations", table: schema.partsStorageLocations },
      { name: "equipment_locations", table: schema.equipmentLocations },
      { name: "maintenance_records", table: schema.maintenanceRecords },
      { name: "parts_usage_history", table: schema.partsUsageHistory },
      { name: "operating_behavior_reports", table: schema.operatingBehaviorReports },
      { name: "equipment_receptions", table: schema.equipmentReceptions },
      { name: "stock_ledger", table: schema.stockLedger },
      { name: "stock_reservations", table: schema.stockReservations },
      { name: "damage_reports", table: schema.damageReports },
      { name: "repair_estimates", table: schema.repairEstimates },
      { name: "reception_checklists", table: schema.receptionChecklists },
      { name: "reception_inspection_items", table: schema.receptionInspectionItems },
      { name: "equipment_inspections", table: schema.equipmentInspections },
      { name: "work_orders", table: schema.workOrders },
      { name: "parts_requests", table: schema.partsRequests },
      { name: "device_import_logs", table: schema.deviceImportLogs },
      { name: "inspection_checklist_items", table: schema.inspectionChecklistItems },
      { name: "work_order_required_parts", table: schema.workOrderRequiredParts },
      { name: "approvals", table: schema.approvals },
    ];

    let totalRecords = 0;

    for (const { name, table } of tables) {
      try {
        console.log(`📄 Exporting ${name}...`);
        const data = await db.select().from(table);

        if (data.length === 0) {
          console.log(`   ⊘ No data\n`);
          continue;
        }

        sqlOutput += `-- Table: ${name}\n`;
        sqlOutput += `DELETE FROM ${name};\n`;

        for (const row of data) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const value = (row as any)[col];
            
            if (value === null || value === undefined) {
              return 'NULL';
            }
            
            if (typeof value === 'string') {
              return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
            }
            
            if (typeof value === 'boolean') {
              return value ? '1' : '0';
            }
            
            if (value instanceof Date) {
              return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            }
            
            if (Array.isArray(value)) {
              return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            }
            
            if (typeof value === 'object') {
              return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            }
            
            return value;
          });

          sqlOutput += `INSERT INTO ${name} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }

        sqlOutput += "\n";
        totalRecords += data.length;
        console.log(`   ✅ Exported ${data.length} records\n`);
      } catch (error: any) {
        console.error(`   ❌ Error exporting ${name}:`, error.message);
      }
    }

    sqlOutput += "SET FOREIGN_KEY_CHECKS=1;\n";

    // Write to file
    writeFileSync('mysql-export/data.sql', sqlOutput);

    console.log("=".repeat(60));
    console.log("📊 Export Summary:");
    console.log("=".repeat(60));
    console.log(`  Total records exported: ${totalRecords}`);
    console.log(`  Output file: mysql-export/data.sql`);
    console.log("=".repeat(60));
    console.log("\n✅ Export completed successfully!");
    console.log("\n📌 Next steps:");
    console.log("   1. Create MySQL database: CREATE DATABASE gelan_terminal;");
    console.log("   2. Import schema first (you'll need to create MySQL schema)");
    console.log("   3. Import data: mysql -u root -p gelan_terminal < mysql-export/data.sql");

  } catch (error: any) {
    console.error("\n❌ Export failed:", error);
    throw error;
  }
}

exportToMySQL()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
