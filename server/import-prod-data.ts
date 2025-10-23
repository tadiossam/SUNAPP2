import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { neonConfig } from '@neondatabase/serverless';
import { readFileSync, existsSync } from "fs";

neonConfig.webSocketConstructor = ws;

// Import data from JSON files to production database

async function importProdData() {
  console.log("📥 Importing data to production database...\n");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not found. Please set it to your PRODUCTION database URL.");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  try {
    // Check if migration-data directory exists
    if (!existsSync('migration-data')) {
      throw new Error("migration-data directory not found. Please run export-dev-data.ts first.");
    }

    // Read export summary
    const summary = JSON.parse(readFileSync('migration-data/export-summary.json', 'utf-8'));
    
    console.log("📋 Import Plan:");
    console.log("─".repeat(60));
    console.log(`  Export date: ${summary.exportDate}`);
    console.log(`  Total tables: ${summary.totalTables}`);
    console.log(`  Total records: ${summary.totalRecords}`);
    console.log("─".repeat(60));
    console.log("");

    // Define import order (must match export order)
    const importSteps = [
      { name: "users", table: schema.users },
      { name: "equipmentCategories", table: schema.equipmentCategories },
      { name: "garages", table: schema.garages },
      { name: "warehouses", table: schema.warehouses },
      { name: "attendanceDeviceSettings", table: schema.attendanceDeviceSettings },
      { name: "employees", table: schema.employees },
      { name: "workshops", table: schema.workshops },
      { name: "warehouseZones", table: schema.warehouseZones },
      { name: "mechanics", table: schema.mechanics },
      { name: "equipment", table: schema.equipment },
      { name: "spareParts", table: schema.spareParts },
      { name: "reorderRules", table: schema.reorderRules },
      { name: "workshopMembers", table: schema.workshopMembers },
      { name: "equipmentPartsCompatibility", table: schema.equipmentPartsCompatibility },
      { name: "partCompatibility", table: schema.partCompatibility },
      { name: "partsStorageLocations", table: schema.partsStorageLocations },
      { name: "equipmentLocations", table: schema.equipmentLocations },
      { name: "maintenanceRecords", table: schema.maintenanceRecords },
      { name: "partsUsageHistory", table: schema.partsUsageHistory },
      { name: "operatingBehaviorReports", table: schema.operatingBehaviorReports },
      { name: "equipmentReceptions", table: schema.equipmentReceptions },
      { name: "stockLedger", table: schema.stockLedger },
      { name: "stockReservations", table: schema.stockReservations },
      { name: "damageReports", table: schema.damageReports },
      { name: "repairEstimates", table: schema.repairEstimates },
      { name: "receptionChecklists", table: schema.receptionChecklists },
      { name: "receptionInspectionItems", table: schema.receptionInspectionItems },
      { name: "equipmentInspections", table: schema.equipmentInspections },
      { name: "workOrders", table: schema.workOrders },
      { name: "partsRequests", table: schema.partsRequests },
      { name: "deviceImportLogs", table: schema.deviceImportLogs },
      { name: "inspectionChecklistItems", table: schema.inspectionChecklistItems },
      { name: "workOrderRequiredParts", table: schema.workOrderRequiredParts },
      { name: "approvals", table: schema.approvals },
    ];

    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Import each table
    for (const step of importSteps) {
      const filePath = `migration-data/${step.name}.json`;
      
      if (!existsSync(filePath)) {
        console.log(`⊘  ${step.name}: No data file\n`);
        continue;
      }

      try {
        console.log(`📦 Importing ${step.name}...`);
        
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        
        if (data.length === 0) {
          console.log(`   ⊘ No data to import\n`);
          continue;
        }

        let imported = 0;
        let skipped = 0;

        // Import records one by one with conflict handling
        for (const row of data) {
          try {
            await db.insert(step.table).values(row).onConflictDoNothing();
            imported++;
          } catch (error) {
            // Record might already exist or have a conflict
            skipped++;
            console.log(`   ⚠️  Skipped record: ${(error as any).message.substring(0, 80)}`);
          }
        }

        totalImported += imported;
        totalSkipped += skipped;
        
        console.log(`   ✅ Imported ${imported} records, skipped ${skipped}\n`);
      } catch (error: any) {
        totalErrors++;
        console.error(`   ❌ Error importing ${step.name}:`, error.message, "\n");
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Import Summary:");
    console.log("=".repeat(60));
    console.log(`  ✅ Total imported: ${totalImported} records`);
    console.log(`  ⊘ Total skipped: ${totalSkipped} records`);
    console.log(`  ❌ Total errors: ${totalErrors} tables`);
    console.log("=".repeat(60));

    if (totalErrors === 0) {
      console.log("\n🎉 Import completed successfully!");
    } else {
      console.log("\n⚠️  Import completed with some errors. Please review above.");
    }

  } catch (error) {
    console.error("\n❌ Import failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run import
importProdData()
  .then(() => {
    console.log("\n✨ Done! Your production database now has all the data.");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
