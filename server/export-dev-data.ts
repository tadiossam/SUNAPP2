import { db } from "./db";
import * as schema from "@shared/schema";
import { writeFileSync } from "fs";
import { mkdir } from "fs/promises";

// Export all development data to JSON files for migration to production

async function exportDevData() {
  console.log("📦 Exporting development database data...\n");

  try {
    // Create export directory
    await mkdir("migration-data", { recursive: true });

    // Define export order (respecting foreign key dependencies)
    const exportSteps = [
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

    let totalRecords = 0;
    const exportSummary: Array<{ name: string; count: number }> = [];

    // Export each table
    for (const step of exportSteps) {
      try {
        console.log(`📄 Exporting ${step.name}...`);
        
        const data = await db.select().from(step.table);
        const count = data.length;
        
        if (count > 0) {
          // Convert BigInt to string for JSON serialization
          const jsonData = JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          , 2);
          
          writeFileSync(`migration-data/${step.name}.json`, jsonData);
          console.log(`   ✅ Exported ${count} records`);
        } else {
          console.log(`   ⊘ No data`);
        }
        
        exportSummary.push({ name: step.name, count });
        totalRecords += count;
      } catch (error: any) {
        console.error(`   ❌ Error exporting ${step.name}:`, error.message);
      }
    }

    // Write summary
    const summary = {
      exportDate: new Date().toISOString(),
      totalTables: exportSteps.length,
      totalRecords,
      tables: exportSummary,
    };
    
    writeFileSync('migration-data/export-summary.json', JSON.stringify(summary, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("📊 Export Summary:");
    console.log("=".repeat(60));
    console.log(`  Total tables: ${exportSteps.length}`);
    console.log(`  Total records: ${totalRecords}`);
    console.log(`  Export location: ./migration-data/`);
    console.log("=".repeat(60));
    console.log("\n✅ Export completed successfully!");
    console.log("\n📌 Next steps:");
    console.log("   1. Download the migration-data folder");
    console.log("   2. Get your production DATABASE_URL from Replit");
    console.log("   3. Run: DATABASE_URL='<prod-url>' tsx server/import-prod-data.ts");

  } catch (error) {
    console.error("\n❌ Export failed:", error);
    throw error;
  }
}

// Run export
exportDevData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
