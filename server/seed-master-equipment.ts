import { db } from "./db";
import { equipment } from "@shared/schema";

// Master equipment list for Sunshine Construction PLC
// This data is protected and can only be edited by CEO-level access

const masterEquipmentData = [
  // DOZER Equipment (25 units)
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0003", assetNo: "EMM 01-04", newAssetNo: "EM-DZ-0004", machineSerial: "7XM-03601" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0264", assetNo: "EMM 01-11", newAssetNo: "EM-DZ-0002", machineSerial: "9EM-02563" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0268", assetNo: "EMM 01-12", newAssetNo: "EM-DZ-0005", machineSerial: "9EM-02677" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0273", assetNo: "EMM 01-13", newAssetNo: "EM-DZ-0001", machineSerial: "9EM-02674" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0274", assetNo: "EMM 01-14", newAssetNo: "EM-DZ-0016", machineSerial: "9EM-02764" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0296", assetNo: "EMM 01-15", newAssetNo: "EM-DZ-0017", machineSerial: "9EM-02947" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0295", assetNo: "EMM 01-16", newAssetNo: "EM-DZ-0011", machineSerial: "9EM-02949" },
  { equipmentType: "DOZER", make: "KOMATSU", model: "D155A-5", plateNo: "DZ-0368", assetNo: "EMM 01-17", newAssetNo: "EM-DZ-0006", machineSerial: "65601" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0381", assetNo: "EMM 01-18", newAssetNo: "EM-DZ-0024", machineSerial: "9EM-03587" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0403", assetNo: "EMM 01-20", newAssetNo: "EM-DZ-0020", machineSerial: "9EM-03987" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0401", assetNo: "EMM 01-21", newAssetNo: "EM-DZ-0012", machineSerial: "9EM-03894" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0404", assetNo: "EMM 01-22", newAssetNo: "EM-DZ-0010", machineSerial: "9EM-04018" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0402", assetNo: "EMM 01-23", newAssetNo: "EM-DZ-0018", machineSerial: "9EM-03782" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1169", assetNo: "EMM 01-24", newAssetNo: "EM-DZ-0013", machineSerial: "9EM-09077" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1170", assetNo: "EMM 01-25", newAssetNo: "EM-DZ-0009", machineSerial: "9EM-09078" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1316", assetNo: "EMM 01-26", newAssetNo: "EM-DZ-0023", machineSerial: "CAT00D8RCME1002" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1314", assetNo: "EMM 01-27", newAssetNo: "EM-DZ-0015", machineSerial: "CAT00D8RVME1002" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1313", assetNo: "EMM 01-28", newAssetNo: "EM-DZ-0014", machineSerial: "CAT00D8RAME1002" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1315", assetNo: "EMM 01-29", newAssetNo: "", machineSerial: "CAT00D8RCME1002" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1330", assetNo: "EMM 01-30", newAssetNo: "EM-DZ-0021", machineSerial: "CAT00D8RTRJM002" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ_1329", assetNo: "EMM 01-31", newAssetNo: "EM-DZ-0025", machineSerial: "CAT00D8RKRJM002" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ_0822", assetNo: "EMM 01-32", newAssetNo: "EM-DZ-0026", machineSerial: "9EMO 07976" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ_0825", assetNo: "EMM 01-33", newAssetNo: "EM-DZ-0008", machineSerial: "9EMO 07929" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ_1493", assetNo: "EMM 01-34", newAssetNo: "EM-DZ-0022", machineSerial: "CAT00D8RER1M004" },
  { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ_1494", assetNo: "EMM 01-35", newAssetNo: "EM-DZ-0019", machineSerial: "CAT00D8RERJM004" },
  
  // WHEEL LOADER Equipment (5 units)
  { equipmentType: "WHEEL LOADER", make: "VOLVO", model: "L-90C", plateNo: "LD-0004", assetNo: "EMM 02-02", newAssetNo: "EM-WL-0006", machineSerial: "L90CV-14387" },
  { equipmentType: "WHEEL LOADER", make: "CATERPILLAR", model: "938F", plateNo: "LD-0003", assetNo: "EMM 02-04", newAssetNo: "EM-WL-0009", machineSerial: "2RM-01022" },
  { equipmentType: "WHEEL LOADER", make: "CATERPILLAR", model: "938F", plateNo: "LD-0228", assetNo: "EMM 02-06", newAssetNo: "EM-WL-0015", machineSerial: "KAXJ-01131" },
  { equipmentType: "WHEEL LOADER", make: "KOMATSU", model: "938E-2", plateNo: "LD-0258", assetNo: "EMM 02-07", newAssetNo: "EM-BL-0002", machineSerial: "93E-5451" },
  { equipmentType: "WHEEL LOADER", make: "VOLVO", model: "L-120E", plateNo: "LD-0309", assetNo: "EMM 02-09", newAssetNo: "EM-WL-0014", machineSerial: "L120CV-18691" },
];

async function seedMasterEquipment() {
  console.log("🌱 Seeding master equipment list for Sunshine Construction PLC...");
  
  try {
    // Clear existing equipment data
    await db.delete(equipment);
    console.log("Cleared existing equipment data");

    // Insert master equipment data
    await db.insert(equipment).values(masterEquipmentData);
    
    console.log(`✅ Successfully seeded ${masterEquipmentData.length} equipment records`);
    console.log("Master equipment list is now active");
  } catch (error) {
    console.error("❌ Error seeding master equipment:", error);
    throw error;
  }
}

seedMasterEquipment()
  .then(() => {
    console.log("Seed complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
