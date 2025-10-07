import { db } from "./db";
import { spareParts } from "@shared/schema";
import { sql } from "drizzle-orm";

// Map categories to their corresponding image files
const categoryImageMap: Record<string, string[]> = {
  "Filters": [
    "/stock_images/heavy_duty_engine_oi_da7f69de.jpg",
    "/stock_images/heavy_duty_engine_oi_e3ec3301.jpg",
    "/stock_images/heavy_duty_engine_oi_a2e51d06.jpg",
    "/stock_images/fuel_filter_element__49bfbed3.jpg",
    "/stock_images/fuel_filter_element__965e9569.jpg",
    "/stock_images/fuel_filter_element__e16fda75.jpg",
    "/stock_images/hydraulic_oil_filter_a8692689.jpg",
    "/stock_images/hydraulic_oil_filter_118fa510.jpg",
  ],
  "Bearings & Bushings": [
    "/stock_images/industrial_bearing_b_809e1773.jpg",
    "/stock_images/industrial_bearing_b_295f2708.jpg",
    "/stock_images/industrial_bearing_b_c87e3cd1.jpg",
  ],
  "Linkage Pins": [
    "/stock_images/metal_pin_linkage_co_4cacc9b4.jpg",
    "/stock_images/metal_pin_linkage_co_8410ccf2.jpg",
    "/stock_images/metal_pin_linkage_co_80a3aacc.jpg",
  ],
  "Lubricants": [
    "/stock_images/engine_oil_lubricant_1bf42327.jpg",
    "/stock_images/engine_oil_lubricant_e814d34a.jpg",
    "/stock_images/engine_oil_lubricant_814fb21a.jpg",
  ],
  "Coolants": [
    "/stock_images/coolant_antifreeze_b_28adb045.jpg",
    "/stock_images/coolant_antifreeze_b_49ffe60c.jpg",
  ],
  "Hydraulic Cylinders": [
    "/stock_images/hydraulic_cylinder_p_c681b1e6.jpg",
    "/stock_images/hydraulic_cylinder_p_508b84f6.jpg",
  ],
  "Seals": [
    "/stock_images/rubber_seal_o-ring_i_db292251.jpg",
    "/stock_images/rubber_seal_o-ring_i_cf57a9a4.jpg",
  ],
  "Transmission": [
    "/stock_images/transmission_part_ge_00ae9dd2.jpg",
    "/stock_images/transmission_part_ge_5941bb09.jpg",
  ],
  "Electrical": [
    "/stock_images/electrical_relay_swi_390054d5.jpg",
    "/stock_images/electrical_relay_swi_97c6079e.jpg",
  ],
  "HVAC": [
    "/stock_images/air_conditioner_hvac_130a1eb4.jpg",
  ],
  "Breathers": [
    "/stock_images/breather_cap_vent_co_31841763.jpg",
  ],
  "Track & Undercarriage": [
    "/stock_images/track_undercarriage__0872b941.jpg",
    "/stock_images/track_undercarriage__06db78d3.jpg",
  ],
  "Cooling System": [
    "/stock_images/radiator_cooling_sys_7103497f.jpg",
  ],
  "Engine": [
    "/stock_images/heavy_duty_engine_oi_da7f69de.jpg",
    "/stock_images/fuel_filter_element__49bfbed3.jpg",
  ],
  "Hydraulic": [
    "/stock_images/hydraulic_oil_filter_a8692689.jpg",
    "/stock_images/hydraulic_cylinder_p_c681b1e6.jpg",
  ],
};

async function updatePartImages() {
  try {
    console.log("Starting to update part images...");

    // Get all parts grouped by category
    const allParts = await db.select().from(spareParts).execute();
    
    console.log(`Found ${allParts.length} parts to update`);

    let updateCount = 0;
    
    for (const part of allParts) {
      const images = categoryImageMap[part.category];
      
      if (images && images.length > 0) {
        // Randomly select 1-2 images for this part
        const numImages = Math.floor(Math.random() * 2) + 1; // 1 or 2 images
        const selectedImages: string[] = [];
        
        for (let i = 0; i < numImages; i++) {
          const randomIndex = Math.floor(Math.random() * images.length);
          if (!selectedImages.includes(images[randomIndex])) {
            selectedImages.push(images[randomIndex]);
          }
        }
        
        // Update the part with selected images
        await db
          .update(spareParts)
          .set({ imageUrls: selectedImages })
          .where(sql`${spareParts.id} = ${part.id}`)
          .execute();
        
        updateCount++;
        console.log(`Updated ${part.partNumber} (${part.category}) with ${selectedImages.length} image(s)`);
      } else {
        console.log(`No images available for category: ${part.category}`);
      }
    }

    console.log(`\nSuccessfully updated ${updateCount} parts with images!`);
    process.exit(0);
  } catch (error) {
    console.error("Error updating part images:", error);
    process.exit(1);
  }
}

updatePartImages();
