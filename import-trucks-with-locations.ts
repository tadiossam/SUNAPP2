import { db } from "./server/db";
import { equipment, garages, equipmentLocations } from "./shared/schema";
import { eq, and, isNull } from "drizzle-orm";
import { readFileSync } from "fs";

async function importTrucksWithLocations() {
  const fileContent = readFileSync(
    "attached_assets/Pasted-NO-EQUIPMENT-TYPE-MAKE-MODEL-HEAD-NUMBER-PLATE-NO-ASSET-NO-NEW-ASSET-NO-CHANSIS-NO-ENGINE-CAP-1759885071636_1759885071636.txt",
    "utf-8"
  );

  const lines = fileContent.split("\n").slice(2); // Skip header rows
  const trucksData = [];
  const locationMap = new Map<string, string>(); // assetNo -> location
  
  let excludedCount = 0;

  // Parse the data
  for (const line of lines) {
    if (!line.trim() || line.includes("MIXER TRUCK")) continue;

    const parts = line.split("\t");
    if (parts.length < 10) continue;

    const no = parts[0]?.trim();
    const equipmentType = parts[1]?.trim();
    const make = parts[2]?.trim();
    const model = parts[3]?.trim();
    const plateNo = parts[5]?.trim();
    const assetNo = parts[6]?.trim();
    const newAssetNo = parts[7]?.trim();
    const chassisNo = parts[8]?.trim();
    const yearOfManufacture = parts[12]?.trim() || "";
    const currentLocation = parts[13]?.trim() || "";
    const driverOperator = parts[14]?.trim() || "";
    const remark = parts[15]?.trim() || "";

    // Skip non-dump trucks
    if (equipmentType !== "DUMP TRUCK") continue;

    // Exclude VEH 01-20 (sold out) and VEH 01-36 (cannibalized)
    if (assetNo === "VEH 01-20" || assetNo === "VEH 01-36") {
      console.log(`✗ Excluding ${assetNo}: ${remark || "excluded"}`);
      excludedCount++;
      continue;
    }

    if (!make || !assetNo) continue;

    // Map location
    locationMap.set(assetNo, currentLocation);

    trucksData.push({
      equipmentType: "DUMP TRUCK",
      make: make,
      model: model || "",
      plateNo: plateNo || null,
      assetNo: assetNo,
      newAssetNo: newAssetNo || null,
      machineSerial: chassisNo || null,
      remarks: remark || null,
    });
  }

  console.log(`\n📊 Parsed ${trucksData.length} dump trucks from spreadsheet`);
  console.log(`❌ Excluded ${excludedCount} trucks (VEH 01-20, VEH 01-36)\n`);

  // Get or create garages for locations
  const locationNames = [...new Set(locationMap.values())].filter(Boolean);
  console.log(`📍 Found ${locationNames.length} unique locations:`, locationNames.join(", "));

  const garageMap = new Map<string, string>(); // location name -> garage id
  
  for (const locationName of locationNames) {
    if (!locationName) continue;
    
    // Try to find existing garage
    const [existingGarage] = await db
      .select()
      .from(garages)
      .where(eq(garages.name, locationName))
      .limit(1);

    if (existingGarage) {
      garageMap.set(locationName, existingGarage.id);
      console.log(`✓ Found existing garage: ${locationName}`);
    } else {
      // Create new garage
      const [newGarage] = await db
        .insert(garages)
        .values({
          name: locationName,
          location: locationName,
          type: "workshop",
          capacity: 50,
          isActive: true,
        })
        .returning();
      garageMap.set(locationName, newGarage.id);
      console.log(`✓ Created new garage: ${locationName}`);
    }
  }

  // Insert equipment and track location assignments
  console.log(`\n🚛 Inserting ${trucksData.length} dump trucks...`);
  const locationRecords = [];
  let insertedCount = 0;

  for (const truck of trucksData) {
    try {
      // Check if equipment already exists
      const [existing] = await db
        .select()
        .from(equipment)
        .where(eq(equipment.assetNo, truck.assetNo))
        .limit(1);

      let equipmentId: string;

      if (existing) {
        // Update existing
        const [updated] = await db
          .update(equipment)
          .set({
            equipmentType: truck.equipmentType,
            make: truck.make,
            model: truck.model,
            plateNo: truck.plateNo,
            newAssetNo: truck.newAssetNo,
            machineSerial: truck.machineSerial,
            remarks: truck.remarks,
          })
          .where(eq(equipment.id, existing.id))
          .returning();
        equipmentId = updated.id;
        console.log(`↻ Updated: ${truck.assetNo}`);
      } else {
        // Insert new
        const [inserted] = await db
          .insert(equipment)
          .values(truck)
          .returning();
        equipmentId = inserted.id;
        insertedCount++;
        console.log(`+ Added: ${truck.assetNo}`);
      }

      // Create location record
      const location = locationMap.get(truck.assetNo);
      if (location && garageMap.has(location)) {
        const garageId = garageMap.get(location)!;
        
        // Check if location record already exists
        const [existingLocation] = await db
          .select()
          .from(equipmentLocations)
          .where(
            and(
              eq(equipmentLocations.equipmentId, equipmentId),
              isNull(equipmentLocations.departedAt)
            )
          )
          .limit(1);

        if (!existingLocation) {
          locationRecords.push({
            equipmentId: equipmentId,
            garageId: garageId,
            locationStatus: "in_garage",
            arrivedAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error(`Error processing ${truck.asset_no}:`, error);
    }
  }

  // Insert location records in batch
  if (locationRecords.length > 0) {
    await db.insert(equipmentLocations).values(locationRecords);
    console.log(`\n📍 Created ${locationRecords.length} location records`);
  }

  console.log(`\n✅ Successfully processed ${trucksData.length} dump trucks!`);
  console.log(`   - New equipment: ${insertedCount}`);
  console.log(`   - Updated equipment: ${trucksData.length - insertedCount}`);
  console.log(`   - Location records: ${locationRecords.length}`);
}

importTrucksWithLocations()
  .then(() => {
    console.log("\n🎉 Import completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  });
