import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

export async function seedProductionUsers() {
  console.log("🔐 Seeding production users...");

  try {
    // Seed CEO user
    const [existingCEO] = await db
      .select()
      .from(users)
      .where(eq(users.username, "ceo"))
      .limit(1);

    if (!existingCEO) {
      const hashedPassword = await bcrypt.hash("ceo123", 10);
      await db.insert(users).values({
        username: "ceo",
        password: hashedPassword,
        fullName: "CEO - Sunshine Construction",
        role: "CEO",
      });
      console.log("✅ CEO user created (username: ceo, password: ceo123)");
    } else {
      console.log("✅ CEO user already exists");
    }

    // Seed Admin user
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1);

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        fullName: "System Administrator",
        role: "Admin",
      });
      console.log("✅ Admin user created (username: admin, password: admin123)");
    } else {
      console.log("✅ Admin user already exists");
    }

    console.log("✅ Production seeding complete");
  } catch (error) {
    console.error("❌ Error seeding production users:", error);
  }
}
