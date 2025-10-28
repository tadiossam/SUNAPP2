import { db } from "./db";
import { employees, appCustomizations } from "@shared/schema";
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

    // Seed default app customizations
    const existingCustomizations = await db
      .select()
      .from(appCustomizations)
      .limit(1);

    if (existingCustomizations.length === 0) {
      await db.insert(appCustomizations).values({
        appName: "Gelan Terminal Maintenance",
        logoUrl: null,
        primaryColor: "#0ea5e9",
        themeMode: "light",
      });
      
      console.log("✅ Created default app customizations");
    } else {
      console.log("✅ App customizations already exist");
    }

    console.log("✅ Production seeding complete");
  } catch (error) {
    console.error("❌ Error seeding production users:", error);
  }
}
