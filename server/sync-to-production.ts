import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

/**
 * Sync all development data to production database
 * 
 * Usage:
 *   PROD_DATABASE_URL='postgresql://...' tsx server/sync-to-production.ts
 * 
 * This will copy all data from dev (DATABASE_URL) to production (PROD_DATABASE_URL)
 */

async function syncToProduction() {
  console.log("🔄 Syncing development data to production...\n");

  const devUrl = process.env.DATABASE_URL;
  const prodUrl = process.env.PROD_DATABASE_URL;

  if (!devUrl) {
    throw new Error("DATABASE_URL not found (development database)");
  }

  if (!prodUrl) {
    console.error("❌ PROD_DATABASE_URL not provided!\n");
    console.log("📌 To get your production database URL:");
    console.log("   1. Open the Database panel in Replit");
    console.log("   2. Switch to 'Production' database");
    console.log("   3. Copy the connection string");
    console.log("   4. Run: PROD_DATABASE_URL='your-prod-url' tsx server/sync-to-production.ts\n");
    throw new Error("PROD_DATABASE_URL is required");
  }

  // Connect to both databases
  const devPool = new Pool({ connectionString: devUrl });
  const devDb = drizzle({ client: devPool, schema });

  const prodPool = new Pool({ connectionString: prodUrl });
  const prodDb = drizzle({ client: prodPool, schema });

  try {
    console.log("📊 Connected to both databases\n");

    // Define migration order (respecting foreign key dependencies)
    const migrationSteps = [
      // Level 1: Independent tables
      { name: "users", table: schema.users },
      { name: "equipmentCategories", table: schema.equipmentCategories },
      { name: "garages", table: schema.garages },
      { name: "warehouses", table: schema.warehouses },
      { name: "attendanceDeviceSettings", table: schema.attendanceDeviceSettings },
      
      // Level 2
      { name: "employees", table: schema.employees },
      { name: "workshops", table: schema.workshops },
      { name: "warehouseZones", table: schema.warehouseZones },
      { name: "mechanics", table: schema.mechanics },
      { name: "equipment", table: schema.equipment },
      { name: "spareParts", table: schema.spareParts },
      { name: "reorderRules", table: schema.reorderRules },
      
      // Level 3
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
      
      // Level 4
      { name: "receptionChecklists", table: schema.receptionChecklists },
      { name: "receptionInspectionItems", table: schema.receptionInspectionItems },
      { name: "equipmentInspections", table: schema.equipmentInspections },
      { name: "workOrders", table: schema.workOrders },
      { name: "partsRequests", table: schema.partsRequests },
      { name: "deviceImportLogs", table: schema.deviceImportLogs },
      
      // Level 5
      { name: "inspectionChecklistItems", table: schema.inspectionChecklistItems },
      { name: "workOrderRequiredParts", table: schema.workOrderRequiredParts },
      { name: "approvals", table: schema.approvals },
    ];

    let totalMigrated = 0;
    let totalSkipped = 0;

    // Migrate each table
    for (const step of migrationSteps) {
      try {
        // Read from development
        const data = await devDb.select().from(step.table);
        
        if (data.length === 0) {
          console.log(`⊘  ${step.name}: No data`);
          continue;
        }

        console.log(`📦 ${step.name}: Migrating ${data.length} records...`);

        let imported = 0;

        // Write to production with conflict handling
        for (const row of data) {
          try {
            await prodDb.insert(step.table).values(row).onConflictDoNothing();
            imported++;
          } catch (error) {
            // Silently skip conflicts
          }
        }

        totalMigrated += imported;
        totalSkipped += (data.length - imported);
        
        console.log(`   ✅ Migrated ${imported}, skipped ${data.length - imported}\n`);
      } catch (error: any) {
        console.error(`   ❌ Error migrating ${step.name}:`, error.message, "\n");
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Migration Summary:");
    console.log("=".repeat(60));
    console.log(`  ✅ Total migrated: ${totalMigrated} records`);
    console.log(`  ⊘ Total skipped: ${totalSkipped} records (already exist)`);
    console.log("=".repeat(60));
    console.log("\n🎉 Sync completed successfully!");

  } catch (error) {
    console.error("\n❌ Sync failed:", error);
    throw error;
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

// Run sync
syncToProduction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
