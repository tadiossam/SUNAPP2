import { db } from "./db";
import { employees } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function createAdmin() {
  console.log("📝 Creating admin user (using employees table)...");

  try {
    // Note: All authentication now uses the employees table
    // To create admin users, add employees with role='admin'
    console.log("✅ Admin user functionality now handled via employees table");
    console.log("   Add employees through the employee management system with role='admin'");
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }

  process.exit(0);
}

createAdmin();
