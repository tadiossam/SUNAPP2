import { db } from "./db";
import { employees } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

export async function seedProductionUsers() {
  console.log("🔐 Seeding production users (using employees table)...");

  try {
    // Note: All authentication now uses the employees table
    // To create admin users, add employees with role='admin' or role='ceo'
    console.log("✅ Production seeding complete");
  } catch (error) {
    console.error("❌ Error seeding production users:", error);
  }
}
