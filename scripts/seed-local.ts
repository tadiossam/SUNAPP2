import { db } from '../server/db';
import { users } from '../shared/schema';
import bcrypt from 'bcrypt';

async function seedLocalDatabase() {
  console.log('🌱 Seeding local database...');
  
  try {
    // Create CEO user
    console.log('Creating CEO user...');
    const hashedPassword = await bcrypt.hash('ceo123', 10);
    
    await db.insert(users).values({
      username: 'ceo',
      password: hashedPassword,
      fullName: 'CEO User',
      role: 'ceo',
      language: 'en'
    }).onConflictDoNothing();
    
    console.log('✅ CEO user created');
    console.log('   Username: ceo');
    console.log('   Password: ceo123');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedLocalDatabase();
