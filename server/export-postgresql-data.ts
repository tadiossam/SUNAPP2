import { db } from "./db";
import * as schema from "@shared/schema";
import { writeFileSync } from "fs";
import { mkdir } from "fs/promises";

/**
 * Export all data from PostgreSQL (Replit) to local PostgreSQL format
 * 
 * Usage: tsx server/export-postgresql-data.ts
 */

async function exportToPostgreSQL() {
  console.log("📦 Exporting data to PostgreSQL format...\n");

  try {
    await mkdir("postgresql-export", { recursive: true });

    let sqlOutput = "-- PostgreSQL Data Export\n";
    sqlOutput += "-- Generated: " + new Date().toISOString() + "\n\n";

    // Define export order (respecting foreign key dependencies)
    const tables = [
      { name: "users", table: schema.users },
      { name: "equipment_categories", table: schema.equipmentCategories },
      { name: "garages", table: schema.garages },
      { name: "warehouses", table: schema.warehouses },
      { name: "attendance_device_settings", table: schema.attendanceDeviceSettings },
      { name: "employees", table: schema.employees },
      { name: "workshops", table: schema.workshops },
      { name: "equipment", table: schema.equipment },
      { name: "spare_parts", table: schema.spareParts },
      { name: "equipment_receptions", table: schema.equipmentReceptions },
      { name: "equipment_inspections", table: schema.equipmentInspections },
      { name: "inspection_checklist_items", table: schema.inspectionChecklistItems },
      { name: "work_orders", table: schema.workOrders },
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
              return `'${value.replace(/'/g, "''")}'`;
            }
            
            if (typeof value === 'boolean') {
              return value ? 'TRUE' : 'FALSE';
            }
            
            if (value instanceof Date) {
              return `'${value.toISOString()}'`;
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

    // Write to file
    writeFileSync('postgresql-export/data.sql', sqlOutput);

    console.log("=".repeat(60));
    console.log("📊 Export Summary:");
    console.log("=".repeat(60));
    console.log(`  Total records exported: ${totalRecords}`);
    console.log(`  Output file: postgresql-export/data.sql`);
    console.log("=".repeat(60));
    console.log("\n✅ Export completed successfully!");
    console.log("\n📌 To import:");
    console.log("   psql -U postgres -d gelan_terminal -f postgresql-export/data.sql");

  } catch (error: any) {
    console.error("\n❌ Export failed:", error);
    throw error;
  }
}

exportToPostgreSQL()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
