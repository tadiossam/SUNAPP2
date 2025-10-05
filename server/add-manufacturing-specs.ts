import { db } from "./db";
import { spareParts } from "@shared/schema";
import { eq } from "drizzle-orm";

async function addManufacturingSpecs() {
  console.log("Adding manufacturing specifications to CAT D8R parts...");

  const partsWithSpecs = [
    {
      partNumber: "1R-1808",
      specs: {
        dimensions: {
          length: 285,
          width: 108,
          height: 108,
          unit: "mm"
        },
        material: "Steel housing with cellulose filter media",
        tolerance: "±0.5mm",
        weight: 1.2,
        weightUnit: "kg",
        cadFormats: ["STL", "STEP", "GLTF"],
        surfaceFinish: "Standard industrial finish",
        hardness: "N/A (filter element)"
      }
    },
    {
      partNumber: "326-1642",
      specs: {
        dimensions: {
          length: 450,
          width: 250,
          height: 320,
          unit: "mm"
        },
        material: "High-density polyethylene (HDPE) with cellulose media",
        tolerance: "±1.0mm",
        weight: 3.5,
        weightUnit: "kg",
        cadFormats: ["STL", "STEP", "GLTF", "GLB"],
        surfaceFinish: "Molded finish",
        hardness: "Shore D 60-65"
      }
    },
    {
      partNumber: "1R-0749",
      specs: {
        dimensions: {
          length: 182,
          diameter: 93,
          unit: "mm"
        },
        material: "Synthetic filter media with steel end caps",
        tolerance: "±0.3mm",
        weight: 0.8,
        weightUnit: "kg",
        cadFormats: ["STL", "STEP"],
        surfaceFinish: "Powder-coated steel",
        hardness: "N/A (filter element)"
      }
    },
    {
      partNumber: "6I-2505",
      specs: {
        dimensions: {
          length: 520,
          width: 320,
          height: 420,
          unit: "mm"
        },
        material: "Pleated cellulose with polyurethane seal",
        tolerance: "±1.5mm",
        weight: 4.2,
        weightUnit: "kg",
        cadFormats: ["STL", "STEP", "GLTF"],
        surfaceFinish: "Standard filter finish",
        hardness: "N/A (filter element)"
      }
    },
    {
      partNumber: "132-8875",
      specs: {
        dimensions: {
          length: 195,
          width: 120,
          height: 95,
          unit: "mm"
        },
        material: "Stainless steel mesh with synthetic media",
        tolerance: "±0.5mm",
        weight: 1.5,
        weightUnit: "kg",
        cadFormats: ["STL", "STEP", "GLTF", "GLB"],
        surfaceFinish: "Brushed stainless steel",
        hardness: "Rockwell C 20-25 (housing)"
      }
    },
    {
      partNumber: "337-5270",
      specs: {
        dimensions: {
          length: 245,
          width: 145,
          height: 120,
          unit: "mm"
        },
        material: "Composite filter housing with cellulose element",
        tolerance: "±0.8mm",
        weight: 2.1,
        weightUnit: "kg",
        cadFormats: ["STL", "GLTF"],
        surfaceFinish: "Molded composite",
        hardness: "Shore D 55-60"
      }
    },
    {
      partNumber: "205-6611",
      specs: {
        dimensions: {
          length: 350,
          width: 180,
          height: 220,
          unit: "mm"
        },
        material: "HDPE container with ethylene glycol mixture",
        tolerance: "±2.0mm",
        weight: 5.5,
        weightUnit: "kg",
        cadFormats: ["STL", "STEP"],
        surfaceFinish: "Blow-molded HDPE",
        hardness: "Shore D 60-70"
      }
    },
    {
      partNumber: "452-5996",
      specs: {
        dimensions: {
          length: 180,
          diameter: 50,
          unit: "mm"
        },
        material: "Lithium complex soap with molybdenum disulfide",
        tolerance: "±0.2mm (cartridge)",
        weight: 0.39,
        weightUnit: "kg",
        cadFormats: ["STL", "GLTF"],
        surfaceFinish: "Standard cartridge finish",
        hardness: "NLGI Grade 1"
      }
    },
  ];

  for (const item of partsWithSpecs) {
    try {
      const [part] = await db
        .select()
        .from(spareParts)
        .where(eq(spareParts.partNumber, item.partNumber))
        .limit(1);

      if (part) {
        await db
          .update(spareParts)
          .set({
            manufacturingSpecs: JSON.stringify(item.specs)
          })
          .where(eq(spareParts.id, part.id));

        console.log(`✓ Added manufacturing specs to ${item.partNumber} - ${part.partName}`);
      } else {
        console.log(`⚠ Part not found: ${item.partNumber}`);
      }
    } catch (error) {
      console.error(`✗ Error updating ${item.partNumber}:`, error);
    }
  }

  console.log("\n✅ Manufacturing specifications update complete!");
  process.exit(0);
}

addManufacturingSpecs().catch(console.error);
