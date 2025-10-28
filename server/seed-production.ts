import { db } from "./db";
import { employees } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

export async function seedProductionUsers() {
  console.log("🔐 Seeding production users (using employees table)...");

  try {
    const adminUsername = "RPAdmin";
    const existingAdmin = await db
      .select()
      .from(employees)
      .where(eq(employees.username, adminUsername))
      .limit(1);

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash("RPAdmin", 10);
      
      await db.insert(employees).values({
        employeeId: "ADMIN001",
        fullName: "Admin User",
        username: adminUsername,
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });
      
      console.log(`✅ Created admin user: ${adminUsername}`);
    } else {
      console.log(`✅ Admin user ${adminUsername} already exists`);
    }

    console.log("✅ Production seeding complete");
  } catch (error) {
    console.error("❌ Error seeding production users:", error);
  }
}
