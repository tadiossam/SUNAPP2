import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seedCEOUser() {
  console.log("🔐 Seeding CEO user...");

  try {
    // Check if CEO user already exists
    const [existingCEO] = await db
      .select()
      .from(users)
      .where(eq(users.username, "ceo"))
      .limit(1);

    if (existingCEO) {
      console.log("✅ CEO user already exists");
      return;
    }

    // Create CEO user with hashed password
    const hashedPassword = await bcrypt.hash("ceo123", 10);
    
    await db.insert(users).values({
      username: "ceo",
      password: hashedPassword,
      fullName: "CEO - Sunshine Construction",
      role: "CEO",
    });

    console.log("✅ CEO user created successfully");
    console.log("Username: ceo");
    console.log("Password: ceo123");
    console.log("⚠️  Please change the password after first login!");
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
