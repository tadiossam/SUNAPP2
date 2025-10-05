// Seed script to populate initial equipment and sample spare parts data
import { db } from "./db";
import { equipment, spareParts, partCompatibility } from "@shared/schema";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Seed equipment from the provided spreadsheet
    const equipmentData = [
      // CAT Dozers
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0003", assetNo: "EMM 01-04", newAssetNo: "EM-DZ-0004", machineSerial: "7XM-03601" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0264", assetNo: "EMM 01-11", newAssetNo: "EM-DZ-0002", machineSerial: "9EM-02569" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0268", assetNo: "EMM 01-12", newAssetNo: "EM-DZ-0005", machineSerial: "9EM-02677" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0273", assetNo: "EMM 01-13", newAssetNo: "EM-DZ-0001", machineSerial: "9EM-02674" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0274", assetNo: "EMM 01-14", newAssetNo: "EM-DZ-0016", machineSerial: "9EM-02764" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0296", assetNo: "EMM 01-15", newAssetNo: "EM-DZ-0017", machineSerial: "9EM-02947" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0295", assetNo: "EMM 01-16", newAssetNo: "EM-DZ-0011", machineSerial: "9EM-02949" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0381", assetNo: "EMM 01-18", newAssetNo: "EM-DZ-0024", machineSerial: "9EM-03587" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0403", assetNo: "EMM 01-20", newAssetNo: "EM-DZ-0020", machineSerial: "9EM-03967" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0401", assetNo: "EMM 01-21", newAssetNo: "EM-DZ-0012", machineSerial: "9EM-03934" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0404", assetNo: "EMM 01-22", newAssetNo: "EM-DZ-0010", machineSerial: "9EM-04018" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-0402", assetNo: "EMM 01-23", newAssetNo: "EM-DZ-0018", machineSerial: "9EM-03782" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1169", assetNo: "EMM 01-24", newAssetNo: "EM-DZ-0013", machineSerial: "9EM-09077" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1170", assetNo: "EMM 01-25", newAssetNo: "EM-DZ-0009", machineSerial: "9EM-09078" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1316", assetNo: "EMM 01-26", newAssetNo: "EM-DZ-0023", machineSerial: "CAT00D8RCEM00Z" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1314", assetNo: "EMM 01-27", newAssetNo: "EM-DZ-0015", machineSerial: "CAT00D8RXME00Z" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1313", assetNo: "EMM 01-28", newAssetNo: "EM-DZ-0014", machineSerial: "CAT00D8RAME00Z" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1315", assetNo: "EMM 01-29", newAssetNo: "", machineSerial: "CAT00D8RCME00Z" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ-1330", assetNo: "EMM 01-30", newAssetNo: "EM-DZ-0021", machineSerial: "CAT00D8RFRM00S" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ_1329", assetNo: "EMM 01-31", newAssetNo: "EM-DZ-0025", machineSerial: "CAT00D8RKRJM00S" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ_0822", assetNo: "EMM 01-32", newAssetNo: "EM-DZ-0026", machineSerial: "9EMO 07976" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ_0825", assetNo: "EMM 01-33", newAssetNo: "EM-DZ-0008", machineSerial: "9EM-07929" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ_1493", assetNo: "EMM 01-34", newAssetNo: "EM-DZ-0022", machineSerial: "CAT00D8RERJM00S" },
      { equipmentType: "DOZER", make: "CAT", model: "D8R", plateNo: "DZ_1494", assetNo: "EMM 01-35", newAssetNo: "EM-DZ-0019", machineSerial: "CAT00D8RERJM00S" },

      // KOMATSU Dozer
      { equipmentType: "DOZER", make: "KOMATSU", model: "D155A-5", plateNo: "DZ-0368", assetNo: "EMM 01-17", newAssetNo: "EM-DZ-0006", machineSerial: "65601" },

      // Wheel Loaders
      { equipmentType: "WHEEL LOADER", make: "VOLVO", model: "L-90C", plateNo: "LD-0004", assetNo: "EMM 02-02", newAssetNo: "EM-WL-0006", machineSerial: "L90C-14387" },
      { equipmentType: "WHEEL LOADER", make: "CATERPILLAR", model: "938F", plateNo: "LD-0003", assetNo: "EMM 02-04", newAssetNo: "EM-WL-0009", machineSerial: "2BM-01022" },
      { equipmentType: "WHEEL LOADER", make: "CATERPILLAR", model: "966G", plateNo: "LD-0228", assetNo: "EMM 02-06", newAssetNo: "EM-WL-0015", machineSerial: "KAXJ-01111" },
    ];

    console.log(`Inserting ${equipmentData.length} equipment records...`);
    for (const item of equipmentData) {
      await db.insert(equipment).values(item);
    }

    // Seed sample spare parts with proper compatibility relationships
    interface PartWithCompatibility {
      part: {
        partNumber: string;
        partName: string;
        description: string;
        category: string;
        price: string;
        stockQuantity: number;
        stockStatus: string;
      };
      compatibility: { make: string; model?: string }[];
    }

    const partsData: PartWithCompatibility[] = [
      {
        part: {
          partNumber: "1R-0739",
          partName: "Engine Oil Filter",
          description: "High-efficiency engine oil filter for CAT equipment",
          category: "Engine",
          price: "45.99",
          stockQuantity: 125,
          stockStatus: "in_stock",
        },
        compatibility: [
          { make: "CAT", model: "D8R" },
          { make: "CATERPILLAR", model: "938F" },
          { make: "CATERPILLAR", model: "966G" },
        ],
      },
      {
        part: {
          partNumber: "1R-0750",
          partName: "Fuel Filter",
          description: "Primary fuel filter assembly",
          category: "Engine",
          price: "38.50",
          stockQuantity: 87,
          stockStatus: "in_stock",
        },
        compatibility: [
          { make: "CAT", model: "D8R" },
          { make: "CATERPILLAR", model: "938F" },
        ],
      },
      {
        part: {
          partNumber: "6I-2504",
          partName: "Turbocharger",
          description: "Complete turbocharger assembly for D8R",
          category: "Engine",
          price: "4250.00",
          stockQuantity: 8,
          stockStatus: "low_stock",
        },
        compatibility: [{ make: "CAT", model: "D8R" }],
      },
      {
        part: {
          partNumber: "4T-3914",
          partName: "Transmission Filter Kit",
          description: "Complete transmission filter service kit",
          category: "Transmission",
          price: "128.75",
          stockQuantity: 42,
          stockStatus: "in_stock",
        },
        compatibility: [
          { make: "CAT", model: "D8R" },
          { make: "CATERPILLAR", model: "938F" },
          { make: "CATERPILLAR", model: "966G" },
        ],
      },
      {
        part: {
          partNumber: "5I-7950",
          partName: "Transmission Pump",
          description: "High-pressure transmission hydraulic pump",
          category: "Transmission",
          price: "1850.00",
          stockQuantity: 5,
          stockStatus: "low_stock",
        },
        compatibility: [{ make: "CAT", model: "D8R" }],
      },
      {
        part: {
          partNumber: "9T-5829",
          partName: "Hydraulic Cylinder Seal Kit",
          description: "Complete seal kit for blade lift cylinder",
          category: "Hydraulic",
          price: "245.00",
          stockQuantity: 28,
          stockStatus: "in_stock",
        },
        compatibility: [
          { make: "CAT", model: "D8R" },
          { make: "KOMATSU", model: "D155A-5" },
        ],
      },
      {
        part: {
          partNumber: "7I-7533",
          partName: "Hydraulic Pump",
          description: "Main hydraulic pump assembly",
          category: "Hydraulic",
          price: "3200.00",
          stockQuantity: 0,
          stockStatus: "out_of_stock",
        },
        compatibility: [
          { make: "CAT", model: "D8R" },
          { make: "CATERPILLAR", model: "966G" },
        ],
      },
      {
        part: {
          partNumber: "8T-4994",
          partName: "Hydraulic Control Valve",
          description: "Multi-function hydraulic control valve block",
          category: "Hydraulic",
          price: "2750.00",
          stockQuantity: 3,
          stockStatus: "low_stock",
        },
        compatibility: [{ make: "VOLVO", model: "L-90C" }],
      },
      {
        part: {
          partNumber: "6Y-8723",
          partName: "Track Link Assembly",
          description: "Heavy-duty track link for dozers",
          category: "Track & Undercarriage",
          price: "185.00",
          stockQuantity: 156,
          stockStatus: "in_stock",
        },
        compatibility: [{ make: "CAT", model: "D8R" }],
      },
      {
        part: {
          partNumber: "8E-4197",
          partName: "Track Roller",
          description: "Double flange track roller with sealed bearings",
          category: "Track & Undercarriage",
          price: "425.00",
          stockQuantity: 34,
          stockStatus: "in_stock",
        },
        compatibility: [
          { make: "CAT", model: "D8R" },
          { make: "KOMATSU", model: "D155A-5" },
        ],
      },
      {
        part: {
          partNumber: "6Y-0271",
          partName: "Sprocket Segment",
          description: "Bolt-on sprocket segment",
          category: "Track & Undercarriage",
          price: "680.00",
          stockQuantity: 18,
          stockStatus: "in_stock",
        },
        compatibility: [{ make: "CAT", model: "D8R" }],
      },
      {
        part: {
          partNumber: "3E-9838",
          partName: "Alternator",
          description: "Heavy-duty 24V alternator",
          category: "Electrical",
          price: "850.00",
          stockQuantity: 12,
          stockStatus: "in_stock",
        },
        compatibility: [
          { make: "CAT", model: "D8R" },
          { make: "CATERPILLAR", model: "938F" },
          { make: "CATERPILLAR", model: "966G" },
        ],
      },
      {
        part: {
          partNumber: "6T-4121",
          partName: "Starting Motor",
          description: "24V electric starting motor",
          category: "Electrical",
          price: "1250.00",
          stockQuantity: 7,
          stockStatus: "low_stock",
        },
        compatibility: [{ make: "CAT", model: "D8R" }],
      },
      {
        part: {
          partNumber: "3I-1262",
          partName: "Radiator Core",
          description: "Complete radiator core assembly",
          category: "Cooling System",
          price: "2100.00",
          stockQuantity: 4,
          stockStatus: "low_stock",
        },
        compatibility: [{ make: "CAT", model: "D8R" }],
      },
      {
        part: {
          partNumber: "2W-1223",
          partName: "Water Pump",
          description: "Engine cooling water pump",
          category: "Cooling System",
          price: "385.00",
          stockQuantity: 22,
          stockStatus: "in_stock",
        },
        compatibility: [
          { make: "CAT", model: "D8R" },
          { make: "CATERPILLAR", model: "938F" },
          { make: "CATERPILLAR", model: "966G" },
        ],
      },
    ];

    console.log(`Inserting ${partsData.length} spare parts records...`);
    for (const item of partsData) {
      const [insertedPart] = await db.insert(spareParts).values(item.part).returning();

      // Insert compatibility records
      for (const compat of item.compatibility) {
        await db.insert(partCompatibility).values({
          partId: insertedPart.id,
          make: compat.make,
          model: compat.model,
        });
      }
    }

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("Seed complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
