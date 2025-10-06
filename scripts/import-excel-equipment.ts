import { db } from "../server/db";
import { equipment } from "@shared/schema";

const excelEquipmentData = [
  // EXCAVATORS
  { equipmentType: "EXCAVATOR", make: "KOMATSU", model: "PC220-7", plateNo: "EX-0097", assetNo: "EMM 03-02", newAssetNo: "EM-EX-0008", machineSerial: "60614" },
  { equipmentType: "EXCAVATOR", make: "CAT WHEEL", model: "M316D", plateNo: "EX-0242", assetNo: "EMM 03-09", newAssetNo: "EM-EX-0017", machineSerial: "W6A00315" },
  { equipmentType: "EXCAVATOR", make: "CAT WHEEL", model: "M316D", plateNo: "EX-0284", assetNo: "EMM 03-10", newAssetNo: "EM-EX-0010", machineSerial: "W6A00788" },
  { equipmentType: "EXCAVATOR", make: "KOMATSU", model: "PC300-7", plateNo: "EX-0289", assetNo: "EMM 03-11", newAssetNo: "EM-EX-0018", machineSerial: "KMTPC0651O2046d" },
  { equipmentType: "EXCAVATOR", make: "KOMATSU", model: "PC300-7", plateNo: "EX-0291", assetNo: "EMM 03-12", newAssetNo: "EM-EX-0011", machineSerial: "KMTPC0650204d" },
  { equipmentType: "EXCAVATOR", make: "KOMATSU", model: "PC300-7", plateNo: "EX-0290", assetNo: "EMM 03-13", newAssetNo: "EM-EX-0004", machineSerial: "KMTPC0650204d" },
  { equipmentType: "EXCAVATOR", make: "KOMATSU", model: "PC300-8MO", plateNo: "EX-1984", assetNo: "EMM 03-14", newAssetNo: "EM-EX-0005", machineSerial: "*KMTPC247AFC0804" },
  { equipmentType: "EXCAVATOR", make: "KOMATSU", model: "PC300-8MO", plateNo: "EX-1466", assetNo: "EMM 03-15", newAssetNo: "EM-EX-0012", machineSerial: "*KMTPC247AFC0804" },
  { equipmentType: "EXCAVATOR", make: "KOMATSU", model: "PC300-8MO", plateNo: "EX-1659", assetNo: "EMM 03-16", newAssetNo: "EM-EX-0007", machineSerial: "*KMTPC247AFC0804" },
  { equipmentType: "EXCAVATOR", make: "KOMATSU", model: "PC300-8MO", plateNo: "EX-1467", assetNo: "EMM 03-17", newAssetNo: "EM-EX-0020", machineSerial: "115670308" },
  { equipmentType: "EXCAVATOR", make: "KOMATSU", model: "PC300", plateNo: "EX-1733", assetNo: "EMM 03-18", newAssetNo: "EM-EX-0019", machineSerial: "80823" },
  { equipmentType: "EXCAVATOR", make: "KOMATSU", model: "PC300", plateNo: "EX-1732", assetNo: "EMM 03-19", newAssetNo: "EM-EX-0015", machineSerial: "80825" },
  { equipmentType: "EXCAVATOR", make: "DOOSAN", model: "DX340LCA", plateNo: "EX-2184", assetNo: "EMM 03-20", newAssetNo: "EM-EX-0013", machineSerial: "CECAP011236" },
  { equipmentType: "EXCAVATOR", make: "DOOSAN", model: "DX340LCA", plateNo: "EX-2185", assetNo: "EMM 03-21", newAssetNo: "EM-EX-0009", machineSerial: "CECAP011242" },
  { equipmentType: "EXCAVATOR", make: "DOOSAN", model: "DX340LCA", plateNo: "EX 2186", assetNo: "EMM 03-22", newAssetNo: "EM-EX-0014", machineSerial: "CECAP011243" },
  { equipmentType: "EXCAVATOR", make: "DOOSAN", model: "DX340LCA", plateNo: "EX 2183", assetNo: "EMM 03-23", newAssetNo: "EM-EX-0016", machineSerial: "CECAP011261" },
  { equipmentType: "EXCAVATOR", make: "DEVELON", model: "DX360LCA-7M", plateNo: "EX 3266", assetNo: "", newAssetNo: "EM-EX-0022", machineSerial: "DWCGECFWCP1011" },
  { equipmentType: "EXCAVATOR", make: "DEVELON", model: "DX360LCA-7M", plateNo: "EX 3265", assetNo: "", newAssetNo: "EM-EX-0021", machineSerial: "DWCGECFWCP1011" },
  { equipmentType: "EXCAVATOR", make: "DEVELON", model: "DX360LCA-7M", plateNo: "EX 3268", assetNo: "", newAssetNo: "EM-EX-0023", machineSerial: "DWCGECFWCP1011" },
  { equipmentType: "EXCAVATOR", make: "DEVELON", model: "DX360LCA-7M", plateNo: "EX 3267", assetNo: "", newAssetNo: "EM-EX-0024", machineSerial: "DWCGECFWCP1011" },
  { equipmentType: "WHEEL EXCAVATOR", make: "DEVELON", model: "DX210WA", plateNo: "EX 3441", assetNo: "", newAssetNo: "EM-EX-0025", machineSerial: "CWBA-006623" },
  { equipmentType: "EXCAVATOR", make: "DEVELON", model: "DX360LCA-7M", plateNo: "EX 3440", assetNo: "", newAssetNo: "EM-EX-0026", machineSerial: "CECFW011565" },
  { equipmentType: "EXCAVATOR", make: "DEVELON", model: "DX360LCA-7M", plateNo: "EX 3439", assetNo: "", newAssetNo: "EM-EX-0027", machineSerial: "CECFW011579" },
  { equipmentType: "EXCAVATOR", make: "DEVELON", model: "DX360LCA-7M", plateNo: "EX 3438", assetNo: "", newAssetNo: "EM-EX-0028", machineSerial: "CECFW011571" },
  { equipmentType: "EXCAVATOR", make: "DEVELON", model: "DX360LCA-7M", plateNo: "EX 3437", assetNo: "", newAssetNo: "EM-EX-0029", machineSerial: "CECFW011573" },
  { equipmentType: "WHEEL EXCAVATOR", make: "DEVELON", model: "DX210WA", plateNo: "", assetNo: "", newAssetNo: "EM-EX-0030", machineSerial: "-CEWBA-006635" },
  { equipmentType: "WHEEL EXCAVATOR", make: "DEVELON", model: "DX210WA", plateNo: "", assetNo: "", newAssetNo: "EM-EX-0031", machineSerial: "-CEWBA-006634" },
  
  // GRADER
  { equipmentType: "GRADER", make: "CAT", model: "12G", plateNo: "GR-0001", assetNo: "EMM 04-03", newAssetNo: "EM-MG-0013", machineSerial: "3PL-01283" },
];

async function importEquipment() {
  console.log("Starting Excel equipment import...");
  console.log(`Total records to import: ${excelEquipmentData.length}`);
  
  let importedCount = 0;
  let skippedCount = 0;
  
  for (const equipmentData of excelEquipmentData) {
    try {
      // Check if equipment already exists (by new asset number which is unique)
      const existing = await db.query.equipment.findFirst({
        where: (equipment, { eq }) => eq(equipment.newAssetNo, equipmentData.newAssetNo)
      });
      
      if (existing) {
        console.log(`⏭️  Skipped: ${equipmentData.equipmentType} ${equipmentData.make} ${equipmentData.model} - Already exists (${equipmentData.newAssetNo})`);
        skippedCount++;
        continue;
      }
      
      // Insert new equipment
      await db.insert(equipment).values(equipmentData);
      console.log(`✅ Imported: ${equipmentData.equipmentType} ${equipmentData.make} ${equipmentData.model} - ${equipmentData.newAssetNo}`);
      importedCount++;
      
    } catch (error) {
      console.error(`❌ Error importing ${equipmentData.newAssetNo}:`, error);
    }
  }
  
  console.log("\n📊 Import Summary:");
  console.log(`   ✅ Successfully imported: ${importedCount}`);
  console.log(`   ⏭️  Skipped (duplicates): ${skippedCount}`);
  console.log(`   📝 Total processed: ${excelEquipmentData.length}`);
  
  // Show final counts by type
  const counts = await db.query.equipment.findMany();
  const typeCounts = counts.reduce((acc, eq) => {
    acc[eq.equipmentType] = (acc[eq.equipmentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log("\n📈 Database Equipment Totals:");
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
  console.log(`   TOTAL: ${counts.length}`);
}

// Run the import
importEquipment()
  .then(() => {
    console.log("\n✨ Import completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  });
