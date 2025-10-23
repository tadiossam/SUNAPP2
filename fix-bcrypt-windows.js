#!/usr/bin/env node

/**
 * Fix bcrypt compatibility issues on Windows
 * Replaces bcrypt with bcryptjs in server/auth.ts
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing bcrypt compatibility for Windows...\n');

// Check if bcryptjs is installed
try {
  require.resolve('bcryptjs');
  console.log('✅ bcryptjs is installed\n');
} catch (e) {
  console.log('📦 Installing bcryptjs...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install bcryptjs', { stdio: 'inherit' });
    console.log('✅ bcryptjs installed\n');
  } catch (err) {
    console.error('❌ Failed to install bcryptjs');
    process.exit(1);
  }
}

// Files to update
const filesToUpdate = [
  'server/auth.ts',
  'server/routes.ts',
  'server/seed-production.ts',
  'server/sync-to-production.ts'
];

let filesUpdated = 0;

for (const filePath of filesToUpdate) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⊘ Skipping ${filePath} (not found)`);
    continue;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if file uses bcrypt
    if (!content.includes('bcrypt')) {
      console.log(`⊘ Skipping ${filePath} (doesn't use bcrypt)`);
      continue;
    }

    // Already using bcryptjs
    if (content.includes('bcryptjs')) {
      console.log(`✓ ${filePath} already uses bcryptjs`);
      continue;
    }

    // Replace bcrypt with bcryptjs
    const originalContent = content;
    content = content.replace(/from ['"]bcrypt['"]/g, 'from "bcryptjs"');
    content = content.replace(/require\(['"]bcrypt['"]\)/g, 'require("bcryptjs")');

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated ${filePath}`);
      filesUpdated++;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

console.log(`\n📊 Summary: Updated ${filesUpdated} file(s)\n`);

if (filesUpdated > 0) {
  console.log('✅ bcrypt compatibility fix complete!\n');
  console.log('You can now run: npm run dev\n');
} else {
  console.log('ℹ️  No files needed updating\n');
}
