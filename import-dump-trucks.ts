import { db } from "./server/db";
import { equipment } from "./shared/schema";
import { readFileSync } from "fs";

async function importDumpTrucks() {
  const fileContent = readFileSync(
    "attached_assets/Pasted-NO-EQUIPMENT-TYPE-MAKE-MODEL-HEAD-NUMBER-PLATE-NO-ASSET-NO-NEW-ASSET-NO-CHANSIS-NO-ENGINE-CAP-1759885071636_1759885071636.txt",
    "utf-8"
  );

  const lines = fileContent.split("\n").slice(2); // Skip header rows
  const trucksToInsert = [];
  
  let excludedCount = 0;

  for (const line of lines) {
    if (!line.trim() || line.includes("MIXER TRUCK")) continue;

    // Use regex to split by multiple whitespace (tabs/spaces)
    const parts = line.split(/\s{2,}/);
    if (parts.length < 10) continue;

    const equipmentType = parts[1]?.trim();
    const make = parts[2]?.trim();
    const model = parts[3]?.trim();
    const plateNo = parts[5]?.trim();
    const assetNo = parts[6]?.trim();
    const newAssetNo = parts[7]?.trim();
    const currentLocation = parts[12]?.trim() || "";
    const remark = parts[14]?.trim() || "";

    // Skip non-dump trucks
    if (!equipmentType || equipmentType !== "DUMP TRUCK") continue;

    // Exclude VEH 01-20 (sold out) and VEH 01-36 (cannibalized)
    if (assetNo === "VEH 01-20" || assetNo === "VEH 01-36") {
      console.log(`Excluding ${assetNo}: ${remark || "excluded"}`);
      excludedCount++;
      continue;
    }

    if (!make || !model || !assetNo) {
      console.log(`Skipping incomplete row: ${assetNo}`);
      continue;
    }

    trucksToInsert.push({
      equipment_type: "DUMP TRUCK",
      make: make,
      model: model,
      plate_no: plateNo || null,
      asset_no: assetNo,
      new_asset_no: newAssetNo || null,
      machine_serial: null,
      remarks: remark ? `${currentLocation} - ${remark}` : currentLocation,
    });
  }

  console.log(`\nPreparing to insert ${trucksToInsert.length} dump trucks...`);
  console.log(`Excluded ${excludedCount} trucks (VEH 01-20, VEH 01-36)`);

  // Insert in batches
  const batchSize = 50;
  let inserted = 0;
  
  for (let i = 0; i < trucksToInsert.length; i += batchSize) {
    const batch = trucksToInsert.slice(i, i + batchSize);
    
    try {
      await db.insert(equipment).values(batch).onConflictDoNothing();
      inserted += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${inserted}/${trucksToInsert.length}`);
    } catch (error) {
      console.error(`Error inserting batch starting at index ${i}:`, error);
    }
  }

  console.log(`\n✅ Successfully inserted ${inserted} dump trucks!`);
  console.log(`❌ Excluded: VEH 01-20 (sold out), VEH 01-36 (cannibalized)`);
}

importDumpTrucks()
  .then(() => {
    console.log("\nImport completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
  });
