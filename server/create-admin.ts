import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function createAdmin() {
  const username = "admin";
  const password = "admin123"; // Change this after first login!
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Check if admin already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists");
      return;
    }

    // Create admin user
    await db.insert(users).values({
      id: crypto.randomUUID(),
      username,
      password: hashedPassword,
      role: "admin",
      fullName: "System Administrator",
      email: "admin@partfinder.local",
    });

    console.log("✅ Admin user created successfully!");
    console.log("   Username: admin");
    console.log("   Password: admin123");
    console.log("   ⚠️  IMPORTANT: Change the password after first login!");
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }

  process.exit(0);
}

createAdmin();
