const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing bcrypt for Windows...\n');

const files = [
  'server/auth.ts',
  'server/routes.ts',
  'server/seed-production.ts',
  'server/sync-to-production.ts'
];

let updated = 0;

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⊘ Skipping ${file} (not found)`);
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (!content.includes('bcrypt')) {
      console.log(`⊘ ${file} doesn't use bcrypt`);
      return;
    }

    if (content.includes('bcryptjs')) {
      console.log(`✓ ${file} already uses bcryptjs`);
      return;
    }

    const original = content;
    content = content.replace(/from ['"]bcrypt['"]/g, 'from "bcryptjs"');
    content = content.replace(/require\(['"]bcrypt['"]\)/g, 'require("bcryptjs")');

    if (content !== original) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated ${file}`);
      updated++;
    }
  } catch (error) {
    console.error(`❌ Error updating ${file}:`, error.message);
  }
});

console.log(`\n✅ Updated ${updated} file(s)\n`);
