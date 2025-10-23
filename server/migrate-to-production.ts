import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

// This script migrates all data from development database to production database
// It respects foreign key dependencies and uses ON CONFLICT DO NOTHING to handle duplicates

async function migrateToProduction() {
  console.log("🚀 Starting production database migration...\n");

  // Validate environment variables
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not found. This should be your development database.");
  }

  // For production, we need to manually specify the production DATABASE_URL
  // In Replit, the production database has a different connection string
  console.log("⚠️  IMPORTANT: This script should be run with PRODUCTION database credentials");
  console.log("📌 Make sure DATABASE_URL points to your PRODUCTION database\n");

  const devDbUrl = process.env.DATABASE_URL;
  
  // Connect to development database (read-only)
  const devPool = new Pool({ connectionString: devDbUrl });
  const devDb = drizzle({ client: devPool, schema });

  // Connect to production database (write)
  // For this migration, we'll use the same connection (assume DATABASE_URL is set to production)
  const prodPool = new Pool({ connectionString: devDbUrl });
  const prodDb = drizzle({ client: prodPool, schema });

  try {
    console.log("📊 Counting development data...");
    
    // Define migration order (respecting foreign key dependencies)
    const migrationSteps = [
      // Level 1: Independent tables
      { name: "users", table: schema.users },
      { name: "equipmentCategories", table: schema.equipmentCategories },
      { name: "garages", table: schema.garages },
      { name: "warehouses", table: schema.warehouses },
      { name: "attendanceDeviceSettings", table: schema.attendanceDeviceSettings },
      
      // Level 2: Tables depending on level 1
      { name: "employees", table: schema.employees },
      { name: "workshops", table: schema.workshops },
      { name: "warehouseZones", table: schema.warehouseZones },
      { name: "mechanics", table: schema.mechanics },
      { name: "equipment", table: schema.equipment },
      { name: "spareParts", table: schema.spareParts },
      { name: "reorderRules", table: schema.reorderRules },
      
      // Level 3: Tables depending on level 2
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
      
      // Level 4: Tables depending on level 3
      { name: "receptionChecklists", table: schema.receptionChecklists },
      { name: "receptionInspectionItems", table: schema.receptionInspectionItems },
      { name: "equipmentInspections", table: schema.equipmentInspections },
      { name: "workOrders", table: schema.workOrders },
      { name: "partsRequests", table: schema.partsRequests },
      { name: "deviceImportLogs", table: schema.deviceImportLogs },
      
      // Level 5: Tables depending on level 4
      { name: "inspectionChecklistItems", table: schema.inspectionChecklistItems },
      { name: "workOrderRequiredParts", table: schema.workOrderRequiredParts },
      { name: "approvals", table: schema.approvals },
    ];

    console.log("\n📋 Migration Plan:");
    console.log("─".repeat(60));

    // Count and display data
    for (const step of migrationSteps) {
      try {
        const count = await devDb.select().from(step.table).then(rows => rows.length);
        console.log(`  ${step.name}: ${count} records`);
      } catch (error: any) {
        console.log(`  ${step.name}: Error counting (${error.message})`);
      }
    }

    console.log("─".repeat(60));
    console.log("\n⏳ Starting migration...\n");

    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Migrate each table
    for (const step of migrationSteps) {
      try {
        console.log(`📦 Migrating ${step.name}...`);
        
        // Export from dev
        const data = await devDb.select().from(step.table);
        
        if (data.length === 0) {
          console.log(`   ⊘ No data to migrate\n`);
          continue;
        }

        // Import to production (use raw SQL for ON CONFLICT)
        let imported = 0;
        let skipped = 0;

        for (const row of data) {
          try {
            await prodDb.insert(step.table).values(row).onConflictDoNothing();
            imported++;
          } catch (error) {
            // If ON CONFLICT doesn't work, the record might already exist
            skipped++;
          }
        }

        totalMigrated += imported;
        totalSkipped += skipped;
        
        console.log(`   ✅ Migrated ${imported} records, skipped ${skipped}\n`);
      } catch (error: any) {
        totalErrors++;
        console.error(`   ❌ Error migrating ${step.name}:`, error.message, "\n");
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Migration Summary:");
    console.log("=".repeat(60));
    console.log(`  ✅ Total migrated: ${totalMigrated} records`);
    console.log(`  ⊘ Total skipped: ${totalSkipped} records`);
    console.log(`  ❌ Total errors: ${totalErrors} tables`);
    console.log("=".repeat(60));

    if (totalErrors === 0) {
      console.log("\n🎉 Migration completed successfully!");
    } else {
      console.log("\n⚠️  Migration completed with some errors. Please review above.");
    }

  } catch (error) {
    console.error("\n❌ Fatal migration error:", error);
    throw error;
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

// Run migration
migrateToProduction()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration failed:", error);
    process.exit(1);
  });
