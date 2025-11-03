import bcrypt from 'bcrypt';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function createUser() {
  const username = process.argv[2];
  const password = process.argv[3];
  const fullName = process.argv[4] || username;
  const role = (process.argv[5] || 'user') as 'CEO' | 'admin' | 'user';

  if (!username || !password) {
    console.error('❌ Usage: npx tsx scripts/create-user.ts <username> <password> [fullName] [role]');
    console.error('   Example: npx tsx scripts/create-user.ts sol sol123 "Solomon" admin');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      console.log(`\n⚠️  User "${username}" already exists. Updating password...`);
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update the user
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          fullName,
          role 
        })
        .where(eq(users.username, username));
      
      console.log(`✅ User "${username}" updated successfully!`);
    } else {
      console.log(`\n📝 Creating new user "${username}"...`);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create the user
      await db.insert(users).values({
        username,
        password: hashedPassword,
        fullName,
        role,
        language: 'en',
      });
      
      console.log(`✅ User "${username}" created successfully!`);
    }

    console.log(`\n📋 Login Credentials:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log(`\n🌐 Login at: http://192.168.0.34:3000\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createUser();
