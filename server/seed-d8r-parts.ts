import { db } from "./db";
import { equipment, spareParts } from "@shared/schema";
import { eq } from "drizzle-orm";

interface PartData {
  partNumber: string;
  partName: string;
  category: string;
  description?: string;
  unitPrice?: number;
  stockLevel?: number;
  compatibleModels: string[];
}

// CAT D8R Parts from Official Parts Reference Guide
const d8rParts: PartData[] = [
  // GREASES - Standard Maintenance
  {
    partNumber: "452-5996",
    partName: "Cat Extreme Application Grease 1 Cartridge",
    category: "Lubricants",
    description: "NLGI Grade 1, Mineral base, -35 to +40°C, 390g/14oz cartridge",
    unitPrice: 15.99,
    stockLevel: 50,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "452-6001",
    partName: "Cat Extreme Application Grease 2 Cartridge",
    category: "Lubricants",
    description: "NLGI Grade 2, Mineral base, -30 to +50°C, 390g/14oz cartridge",
    unitPrice: 15.99,
    stockLevel: 75,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "452-6006",
    partName: "Cat Prime Application Grease Cartridge",
    category: "Lubricants",
    description: "NLGI Grade 2, Mineral base, -20 to +40°C, 390g/14oz cartridge",
    unitPrice: 14.99,
    stockLevel: 60,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "452-6016",
    partName: "Cat Extreme Application Grease Desert Cartridge",
    category: "Lubricants",
    description: "NLGI Grade 2, Mineral base, -30 to +50°C, Desert application, 390g/14oz",
    unitPrice: 18.99,
    stockLevel: 40,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "452-6011",
    partName: "Cat Utility Grease Cartridge",
    category: "Lubricants",
    description: "NLGI Grade 2, Mineral base, -30 to +40°C, Multipurpose, 390g/14oz",
    unitPrice: 12.99,
    stockLevel: 80,
    compatibleModels: ["D8R"]
  },

  // GREASES - Plastic Pails
  {
    partNumber: "452-5999",
    partName: "Cat Extreme Application Grease 1 Pail",
    category: "Lubricants",
    description: "16 kg / 35 lb plastic pail",
    unitPrice: 189.99,
    stockLevel: 15,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "452-6004",
    partName: "Cat Extreme Application Grease 2 Pail",
    category: "Lubricants",
    description: "16 kg / 35 lb plastic pail",
    unitPrice: 189.99,
    stockLevel: 20,
    compatibleModels: ["D8R"]
  },

  // COOLANTS
  {
    partNumber: "205-6611",
    partName: "Cat ELC Premix Coolant 5L",
    category: "Coolants",
    description: "Extended Life Coolant premix, 5 liters, 12,000-hour drain interval",
    unitPrice: 45.99,
    stockLevel: 30,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "205-6612",
    partName: "Cat ELC Premix Coolant 20L",
    category: "Coolants",
    description: "Extended Life Coolant premix, 20 liters",
    unitPrice: 165.99,
    stockLevel: 25,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "205-6613",
    partName: "Cat ELC Premix Coolant 210L",
    category: "Coolants",
    description: "Extended Life Coolant premix, 210 liters (drum)",
    unitPrice: 1499.99,
    stockLevel: 5,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "119-5152",
    partName: "Cat ELC Extender 0.9L",
    category: "Coolants",
    description: "Extended Life Coolant extender, 0.9 liter, add at 6,000 hours",
    unitPrice: 25.99,
    stockLevel: 40,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "210-0786",
    partName: "Cat ELC Extender 3.8L",
    category: "Coolants",
    description: "Extended Life Coolant extender, 3.8 liters",
    unitPrice: 89.99,
    stockLevel: 20,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "369-0805",
    partName: "Cooling System Conditioner 74ml",
    category: "Coolants",
    description: "For aluminum components protection, 74 ml",
    unitPrice: 18.99,
    stockLevel: 35,
    compatibleModels: ["D8R"]
  },

  // ENGINE OIL FILTERS
  {
    partNumber: "1R-1808",
    partName: "Engine Oil Filter Element",
    category: "Filters",
    description: "Primary engine oil filter for 9EM, T5X, RJM, MEJ, JR8, DWJ prefixes",
    unitPrice: 42.50,
    stockLevel: 100,
    compatibleModels: ["D8R"]
  },

  // FUEL FILTERS
  {
    partNumber: "326-1642",
    partName: "Primary Fuel Filter Element",
    category: "Filters",
    description: "Fuel filter primary element for 9EM, T5X, RJM, MEJ prefixes",
    unitPrice: 38.99,
    stockLevel: 80,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "326-1643",
    partName: "Primary Fuel Filter Element",
    category: "Filters",
    description: "Fuel filter primary element for JR8, DWJ prefixes",
    unitPrice: 38.99,
    stockLevel: 60,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "1R-0749",
    partName: "Secondary Fuel Filter Element",
    category: "Filters",
    description: "Fuel filter secondary element (2 required for JR8/DWJ)",
    unitPrice: 28.99,
    stockLevel: 120,
    compatibleModels: ["D8R"]
  },

  // AIR FILTERS
  {
    partNumber: "6I-2505",
    partName: "Primary Air Filter Element",
    category: "Filters",
    description: "Air filter primary element for all D8R prefixes",
    unitPrice: 125.99,
    stockLevel: 50,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "6I-2506",
    partName: "Secondary Air Filter Element",
    category: "Filters",
    description: "Air filter secondary/safety element for all D8R prefixes",
    unitPrice: 89.99,
    stockLevel: 45,
    compatibleModels: ["D8R"]
  },

  // TRANSMISSION FILTERS
  {
    partNumber: "132-8875",
    partName: "Transmission Filter Element",
    category: "Filters",
    description: "Transmission filter for 9EM, T5X prefixes",
    unitPrice: 78.50,
    stockLevel: 35,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "337-5270",
    partName: "Transmission Filter Element",
    category: "Filters",
    description: "Transmission filter for RJM, MEJ, JR8, DWJ prefixes",
    unitPrice: 82.50,
    stockLevel: 40,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "2S-8439",
    partName: "Transmission Filter Seal",
    category: "Seals",
    description: "Seal for transmission filter (9EM, T5X)",
    unitPrice: 8.99,
    stockLevel: 60,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "095-1678",
    partName: "Transmission Filter Seal",
    category: "Seals",
    description: "Seal for transmission filter (RJM, MEJ, JR8, DWJ)",
    unitPrice: 8.99,
    stockLevel: 65,
    compatibleModels: ["D8R"]
  },

  // HYDRAULIC FILTERS
  {
    partNumber: "465-6506",
    partName: "Steering Filter Element",
    category: "Filters",
    description: "Hydraulic steering charge filter for RJM, MEJ prefixes",
    unitPrice: 65.99,
    stockLevel: 30,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "225-4118",
    partName: "Steering Filter Element",
    category: "Filters",
    description: "Hydraulic steering charge filter for JR8, DWJ prefixes",
    unitPrice: 68.99,
    stockLevel: 28,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "1R-0735",
    partName: "Hydraulic Filter Element Case",
    category: "Filters",
    description: "Hydraulic filter case for 9EM, T5X prefixes",
    unitPrice: 95.50,
    stockLevel: 20,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "1R-0777",
    partName: "Hydraulic Filter Element Case",
    category: "Filters",
    description: "Hydraulic filter case for RJM, MEJ prefixes",
    unitPrice: 98.50,
    stockLevel: 22,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "5H-6733",
    partName: "Hydraulic Filter Seal O-Ring",
    category: "Seals",
    description: "Seal O-ring for hydraulic filter",
    unitPrice: 6.99,
    stockLevel: 75,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "7D-1195",
    partName: "Hydraulic Filter Seal O-Ring",
    category: "Seals",
    description: "Seal O-ring for hydraulic filter case",
    unitPrice: 6.99,
    stockLevel: 80,
    compatibleModels: ["D8R"]
  },

  // CABIN AIR FILTERS
  {
    partNumber: "6T-5068",
    partName: "Cabin Air Recirculating Element",
    category: "Filters",
    description: "Cabin recirculating air filter for 9EM, T5X prefixes",
    unitPrice: 45.99,
    stockLevel: 40,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "112-7448",
    partName: "Cabin Air Recirculating Element",
    category: "Filters",
    description: "Cabin recirculating air filter for RJM, MEJ, JR8, DWJ prefixes",
    unitPrice: 48.99,
    stockLevel: 45,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "6T-0988",
    partName: "Cabin Fresh Air Element",
    category: "Filters",
    description: "Cabin fresh air filter for 9EM, T5X prefixes",
    unitPrice: 42.99,
    stockLevel: 38,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "396-7087",
    partName: "Cabin Fresh Air Element",
    category: "Filters",
    description: "Cabin fresh air filter for RJM, MEJ, JR8, DWJ prefixes",
    unitPrice: 44.99,
    stockLevel: 42,
    compatibleModels: ["D8R"]
  },

  // BREATHERS
  {
    partNumber: "9G-5127",
    partName: "Transmission Breather",
    category: "Breathers",
    description: "Transmission breather element for all D8R prefixes",
    unitPrice: 22.99,
    stockLevel: 55,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "4N-4668",
    partName: "Crankcase Engine Breather Element",
    category: "Breathers",
    description: "Crankcase breather element for all D8R prefixes",
    unitPrice: 35.99,
    stockLevel: 48,
    compatibleModels: ["D8R"]
  },

  // AC RECEIVER DRYER
  {
    partNumber: "3E-3535",
    partName: "AC Receiver Dryer",
    category: "HVAC",
    description: "Air conditioning receiver dryer for 9EM, T5X prefixes",
    unitPrice: 285.99,
    stockLevel: 12,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "106-5534",
    partName: "AC Receiver Dryer",
    category: "HVAC",
    description: "Air conditioning receiver dryer for RJM, MEJ, JR8, DWJ prefixes",
    unitPrice: 295.99,
    stockLevel: 15,
    compatibleModels: ["D8R"]
  },

  // RIPPER LINKAGE PINS
  {
    partNumber: "6J-9482",
    partName: "Ripper Pin Assembly",
    category: "Linkage Pins",
    description: "Ripper fixed parallelogram pin assembly (2 required)",
    unitPrice: 165.99,
    stockLevel: 25,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "4T-1389",
    partName: "Ripper Pin Assembly",
    category: "Linkage Pins",
    description: "Ripper linkage pin assembly (2 required)",
    unitPrice: 145.99,
    stockLevel: 30,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "162-0390",
    partName: "Ripper Pin",
    category: "Linkage Pins",
    description: "Ripper linkage pin (2 required)",
    unitPrice: 125.50,
    stockLevel: 28,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "1U-0990",
    partName: "Ripper Pin",
    category: "Linkage Pins",
    description: "Ripper linkage pin (2 or 4 required depending on location)",
    unitPrice: 115.50,
    stockLevel: 35,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "132-7994",
    partName: "Ripper Pin Assembly",
    category: "Linkage Pins",
    description: "Ripper pin assembly (2 required)",
    unitPrice: 155.99,
    stockLevel: 22,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "4T-0203",
    partName: "Ripper Pin Assembly",
    category: "Linkage Pins",
    description: "Ripper pin assembly (2 or 4 required)",
    unitPrice: 148.99,
    stockLevel: 26,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "9W-7991",
    partName: "Ripper Pin",
    category: "Linkage Pins",
    description: "Ripper linkage pin (2 required)",
    unitPrice: 135.50,
    stockLevel: 18,
    compatibleModels: ["D8R"]
  },

  // RIPPER BEARINGS AND BUSHINGS
  {
    partNumber: "4T-9751",
    partName: "Ripper Bushing",
    category: "Bearings & Bushings",
    description: "Ripper linkage bushing (4 required)",
    unitPrice: 45.99,
    stockLevel: 50,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "7T-3746",
    partName: "Ripper Bushing",
    category: "Bearings & Bushings",
    description: "Ripper linkage bushing (4 or 8 required depending on location)",
    unitPrice: 42.99,
    stockLevel: 60,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "3G-5999",
    partName: "Ripper Bushing",
    category: "Bearings & Bushings",
    description: "Ripper linkage bushing (2 required per location)",
    unitPrice: 38.99,
    stockLevel: 55,
    compatibleModels: ["D8R"]
  },

  // BLADE LINKAGE PINS
  {
    partNumber: "524-4892",
    partName: "Blade Trunnion",
    category: "Linkage Pins",
    description: "Dozer blade L-shaped trunnion (2 required)",
    unitPrice: 285.99,
    stockLevel: 20,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "4T-7534",
    partName: "Blade Pin",
    category: "Linkage Pins",
    description: "Dozer blade linkage pin (4 required)",
    unitPrice: 95.50,
    stockLevel: 35,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "3G-7016",
    partName: "Blade Pin",
    category: "Linkage Pins",
    description: "Dozer blade pin (RH or pairs, 2-3 required)",
    unitPrice: 125.99,
    stockLevel: 28,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "239-9940",
    partName: "Blade Pin (LH)",
    category: "Linkage Pins",
    description: "Dozer blade left-hand pin",
    unitPrice: 125.99,
    stockLevel: 28,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "1U-2472",
    partName: "Blade Pin",
    category: "Linkage Pins",
    description: "Dozer blade linkage pin (2 required)",
    unitPrice: 115.50,
    stockLevel: 32,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "238-8637",
    partName: "Blade Cylinder Assembly",
    category: "Hydraulic Cylinders",
    description: "Dozer blade hydraulic cylinder assembly",
    unitPrice: 3250.00,
    stockLevel: 8,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "6E-1103",
    partName: "Blade Cylinder Assembly",
    category: "Hydraulic Cylinders",
    description: "Dozer blade hydraulic cylinder assembly (alternative)",
    unitPrice: 3150.00,
    stockLevel: 6,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "9J-0123",
    partName: "Blade Trunnion",
    category: "Linkage Pins",
    description: "Dozer blade trunnion (2 required)",
    unitPrice: 195.99,
    stockLevel: 18,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "110-2966",
    partName: "Blade Trunnion",
    category: "Linkage Pins",
    description: "Dozer blade trunnion",
    unitPrice: 215.99,
    stockLevel: 16,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "110-3292",
    partName: "Blade Trunnion",
    category: "Linkage Pins",
    description: "Dozer blade trunnion",
    unitPrice: 225.99,
    stockLevel: 14,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "110-4206",
    partName: "Blade Trunnion",
    category: "Linkage Pins",
    description: "Dozer blade trunnion (9EM prefix)",
    unitPrice: 205.99,
    stockLevel: 12,
    compatibleModels: ["D8R"]
  },

  // BLADE BEARINGS AND BUSHINGS
  {
    partNumber: "193-3063",
    partName: "Cap Bearing",
    category: "Bearings & Bushings",
    description: "Blade cap bearing (2 required)",
    unitPrice: 125.99,
    stockLevel: 24,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "8E-6752",
    partName: "Blade Bushing",
    category: "Bearings & Bushings",
    description: "Blade linkage bushing (8 required)",
    unitPrice: 35.99,
    stockLevel: 70,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "1U-2182",
    partName: "Blade Bushing (RH)",
    category: "Bearings & Bushings",
    description: "Blade right-hand bushing (2 or 4 required)",
    unitPrice: 42.99,
    stockLevel: 45,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "7J-3297",
    partName: "Blade Bearing",
    category: "Bearings & Bushings",
    description: "Blade bearing (2 required)",
    unitPrice: 85.99,
    stockLevel: 32,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "3G-9598",
    partName: "Blade Bushing",
    category: "Bearings & Bushings",
    description: "Blade linkage bushing (4 required)",
    unitPrice: 38.99,
    stockLevel: 55,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "6E-1108",
    partName: "Blade Bushing",
    category: "Bearings & Bushings",
    description: "Blade bushing (4 required)",
    unitPrice: 45.99,
    stockLevel: 48,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "104-1844",
    partName: "Blade Bushing",
    category: "Bearings & Bushings",
    description: "Blade linkage bushing (4 required)",
    unitPrice: 48.99,
    stockLevel: 42,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "160-6310",
    partName: "Cap Bearing",
    category: "Bearings & Bushings",
    description: "Blade cap bearing (2 required)",
    unitPrice: 135.99,
    stockLevel: 22,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "160-6307",
    partName: "Cap Bearing",
    category: "Bearings & Bushings",
    description: "Blade cap bearing (2 required per location)",
    unitPrice: 135.99,
    stockLevel: 26,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "1J-6740",
    partName: "Bearing",
    category: "Bearings & Bushings",
    description: "Blade bearing (2 required)",
    unitPrice: 95.99,
    stockLevel: 30,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "3G-0910",
    partName: "Cap Bearing",
    category: "Bearings & Bushings",
    description: "Blade cap bearing (9EM prefix)",
    unitPrice: 125.99,
    stockLevel: 18,
    compatibleModels: ["D8R"]
  },
  {
    partNumber: "6I-8676",
    partName: "Bearing",
    category: "Bearings & Bushings",
    description: "Blade bearing (2 required per location)",
    unitPrice: 105.99,
    stockLevel: 28,
    compatibleModels: ["D8R"]
  }
];

async function seedD8RParts() {
  console.log("Starting D8R parts seeding...");

  // Get all CAT D8R equipment from database
  const d8rEquipment = await db.query.equipment.findMany({
    where: eq(equipment.model, "D8R")
  });

  if (d8rEquipment.length === 0) {
    console.log("No D8R equipment found in database. Please seed equipment first.");
    return;
  }

  console.log(`Found ${d8rEquipment.length} D8R equipment units`);

  let insertedCount = 0;

  for (const part of d8rParts) {
    // Check if part already exists
    const existingPart = await db.query.spareParts.findFirst({
      where: eq(spareParts.partNumber, part.partNumber)
    });

    if (!existingPart) {
      await db.insert(spareParts).values({
        partNumber: part.partNumber,
        partName: part.partName,
        category: part.category,
        description: part.description,
        manufacturer: "Caterpillar",
        unitPrice: part.unitPrice?.toString(),
        stockLevel: part.stockLevel,
        reorderLevel: Math.floor((part.stockLevel || 10) * 0.3), // 30% of stock level
        location: "Main Warehouse - CAT Parts Section"
      });
      insertedCount++;
    }
  }

  console.log(`✓ Inserted ${insertedCount} CAT D8R parts`);
  console.log(`✓ Total parts in catalog: ${d8rParts.length}`);
  console.log("D8R parts seeding completed successfully!");
}

seedD8RParts()
  .catch((error) => {
    console.error("Error seeding D8R parts:", error);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
