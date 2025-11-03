import { db } from "./db";
import { employees } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seedCEOUser() {
  console.log("🔐 Seeding CEO user (using employees table)...");

  try {
    // Note: All authentication now uses the employees table
    // To create a CEO user, add an employee with role='ceo'
    console.log("✅ CEO user functionality now handled via employees table");
  } catch (error) {
    console.error("❌ Error seeding CEO user:", error);
    throw error;
  }
}

seedCEOUser()
  .then(() => {
    console.log("Seed complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
