import { db } from "./db";
import * as schema from "@shared/schema";
import { writeFileSync } from "fs";
import { mkdir } from "fs/promises";

/**
 * Export all data from PostgreSQL to SQL Server-compatible SQL file
 * 
 * Usage: tsx server/export-to-sqlserver.ts
 */

async function exportToSQLServer() {
  console.log("📦 Exporting PostgreSQL data to SQL Server format...\n");

  try {
    await mkdir("sqlserver-export", { recursive: true });

    let sqlOutput = "-- SQL Server Data Export from PostgreSQL\n";
    sqlOutput += "-- Generated: " + new Date().toISOString() + "\n\n";
    sqlOutput += "USE GelanTerminal;\nGO\n\n";

    // Define export order (respecting foreign key dependencies)
    const tables = [
      { name: "users", table: schema.users },
      { name: "equipment_categories", table: schema.equipmentCategories },
      { name: "garages", table: schema.garages },
      { name: "employees", table: schema.employees },
      { name: "workshops", table: schema.workshops },
      { name: "equipment", table: schema.equipment },
      { name: "spare_parts", table: schema.spareParts },
      { name: "equipment_receptions", table: schema.equipmentReceptions },
      { name: "equipment_inspections", table: schema.equipmentInspections },
      { name: "work_orders", table: schema.workOrders },
      { name: "inspection_checklist_items", table: schema.inspectionChecklistItems },
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
        sqlOutput += `DELETE FROM dbo.${name};\nGO\n\n`;

        for (const row of data) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const value = (row as any)[col];
            
            if (value === null || value === undefined) {
              return 'NULL';
            }
            
            if (typeof value === 'string') {
              // Escape single quotes for SQL Server
              return `N'${value.replace(/'/g, "''")}'`;
            }
            
            if (typeof value === 'boolean') {
              return value ? '1' : '0';
            }
            
            if (value instanceof Date) {
              return `'${value.toISOString()}'`;
            }
            
            if (Array.isArray(value)) {
              // Store arrays as JSON strings
              return `N'${JSON.stringify(value).replace(/'/g, "''")}'`;
            }
            
            if (typeof value === 'object') {
              // Store objects as JSON strings
              return `N'${JSON.stringify(value).replace(/'/g, "''")}'`;
            }
            
            return value;
          });

          sqlOutput += `INSERT INTO dbo.${name} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }

        sqlOutput += "GO\n\n";
        totalRecords += data.length;
        console.log(`   ✅ Exported ${data.length} records\n`);
      } catch (error: any) {
        console.error(`   ❌ Error exporting ${name}:`, error.message);
      }
    }

    // Write to file
    writeFileSync('sqlserver-export/data.sql', sqlOutput);

    console.log("=".repeat(60));
    console.log("📊 Export Summary:");
    console.log("=".repeat(60));
    console.log(`  Total records exported: ${totalRecords}`);
    console.log(`  Output file: sqlserver-export/data.sql`);
    console.log("=".repeat(60));
    console.log("\n✅ Export completed successfully!");
    console.log("\n📌 Next steps:");
    console.log("   1. Import schema first: schema.sql");
    console.log("   2. Import data: data.sql");
    console.log("   3. Execute in SQL Server Management Studio (SSMS)");

  } catch (error: any) {
    console.error("\n❌ Export failed:", error);
    throw error;
  }
}

exportToSQLServer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
