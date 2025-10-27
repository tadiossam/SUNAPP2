@echo off
REM Windows-compatible development server launcher
set NODE_ENV=development
npx tsx server/index.ts
