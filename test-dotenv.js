// TEST SCRIPT: Check if dotenv works
console.log("=".repeat(60));
console.log("DOTENV TEST SCRIPT");
console.log("=".repeat(60));
console.log();

console.log("Step 1: Checking if .env file exists...");
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log("✅ .env file found at:", envPath);
  console.log();
  console.log("Contents:");
  console.log(fs.readFileSync(envPath, 'utf8'));
} else {
  console.log("❌ .env file NOT found!");
  console.log("Looking in:", envPath);
  process.exit(1);
}

console.log();
console.log("Step 2: Loading dotenv...");
try {
  require('dotenv').config();
  console.log("✅ dotenv loaded successfully");
} catch (err) {
  console.log("❌ dotenv failed to load:", err.message);
  process.exit(1);
}

console.log();
console.log("Step 3: Checking if DATABASE_URL is set...");
if (process.env.DATABASE_URL) {
  console.log("✅ DATABASE_URL is set!");
  console.log("Value:", process.env.DATABASE_URL.substring(0, 50) + "...");
} else {
  console.log("❌ DATABASE_URL is NOT set!");
  console.log("All environment variables:", Object.keys(process.env).filter(k => k.includes('DATABASE')));
}

console.log();
console.log("Step 4: Checking other env vars...");
console.log("PORT:", process.env.PORT || "NOT SET");
console.log("NODE_ENV:", process.env.NODE_ENV || "NOT SET");
console.log("SESSION_SECRET:", process.env.SESSION_SECRET ? "SET" : "NOT SET");

console.log();
console.log("=".repeat(60));
console.log("TEST COMPLETE");
console.log("=".repeat(60));
