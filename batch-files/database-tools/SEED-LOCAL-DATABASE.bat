@echo off
cls
echo ============================================================
echo    SEED LOCAL DATABASE
echo    Add Default Users
echo ============================================================
echo.

cd /d "%~dp0..\.."

echo Creating default users in local database...
echo.

npx tsx --env-file=.env -e "
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import bcrypt from 'bcrypt';

async function seedUsers() {
  console.log('Creating CEO user...');
  
  const hashedPassword = await bcrypt.hash('ceo123', 10);
  
  await db.insert(users).values({
    username: 'ceo',
    password: hashedPassword,
    role: 'ceo'
  }).onConflictDoNothing();
  
  console.log('✓ CEO user created (username: ceo, password: ceo123)');
  process.exit(0);
}

seedUsers().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
"

echo.
echo ============================================================
echo    SEEDING COMPLETE!
echo ============================================================
echo.
echo Default login:
echo   Username: ceo
echo   Password: ceo123
echo.
pause
