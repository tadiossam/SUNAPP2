# Batch Files Organization
## Gelan Terminal Maintenance System

All batch files are organized into logical categories for easy access.

---

## Server Management

**Location:** `batch-files/server-management/`

Essential files for starting and stopping the application:

- **SETUP-FIRST-TIME.bat** - First-time setup (run once)
- **START-WINDOWS.bat** - Start the application server
- **STOP-WINDOWS.bat** - Stop the application server

**Quick Start:**
1. First time: Run `SETUP-FIRST-TIME.bat`
2. Daily use: Run `START-WINDOWS.bat`
3. To stop: Run `STOP-WINDOWS.bat`

---

## Database Tools

**Location:** `batch-files/database-tools/`

Manage database schema and data:

- **GENERATE-MIGRATION.bat** - Generate SQL migration files (RECOMMENDED)
- **APPLY-MIGRATIONS.bat** - Apply SQL migrations to database
- **UPDATE-DATABASE-SCHEMA.bat** - Quick schema sync (Advanced only)
- **SETUP-LOCAL-DATABASE.bat** - Initial database setup
- **SEED-LOCAL-DATABASE.bat** - Populate with sample data

**Database Update Workflow:**
1. Make changes to `shared/schema.ts`
2. Run `GENERATE-MIGRATION.bat`
3. Review SQL files in `migrations/` folder
4. Run `APPLY-MIGRATIONS.bat`

See `DATABASE-MIGRATION-GUIDE.md` for detailed instructions.

---

## Network Tools

**Location:** `batch-files/network-tools/`

Network configuration and diagnostics:

- **ALLOW-FIREWALL.bat** - Configure Windows Firewall for port 3000
- **CHECK-IP.bat** - Display your local IP address

**Network Setup:**
1. Run `ALLOW-FIREWALL.bat` (requires admin rights)
2. Run `CHECK-IP.bat` to see your network address
3. Access from other devices: `http://YOUR_IP:3000`

---

## Development & Debug

**Location:** `batch-files/development-debug/`

Tools for developers and troubleshooting:

- **dev-windows.bat** - Development mode server
- **debug-windows.bat** - Run with debugging enabled
- **debug-super.bat** - Advanced debugging mode
- **diagnose-vite.bat** - Diagnose Vite issues
- **test-vite.bat** - Test Vite configuration
- **run-with-debug.bat** - Run with debug logging

**When to use:**
- Use when troubleshooting issues
- For advanced development tasks
- When debugging application problems

---

## Utilities

**Location:** `batch-files/utilities/`

Maintenance and setup utilities:

- **CHECK-INSTALLATION.bat** - Verify Node.js and dependencies
- **CLEANUP-OLD-FILES.bat** - Clean temporary files
- **CREATE-USER.bat** - Create new user accounts
- **WINDOWS-COMPLETE-FIX.bat** - Fix common Windows issues
- **setup-windows.bat** - Windows environment setup
- **FINAL-WINDOWS-RUN.bat** - Production startup

---

## Legacy Files

**Location:** `batch-files/legacy/`

Old batch files kept for reference:

- run-app.bat
- run-windows.bat
- run-windows-fixed.bat
- start-windows-simple.bat

**Note:** These are replaced by files in `server-management/`. Only use if you have specific compatibility needs.

---

## How to Run

All batch files can now be run directly from their folders. Just double-click them!

**Example:**
- Double-click `batch-files/server-management/START-WINDOWS.bat` ✅
- No need to copy to root folder

The batch files automatically navigate to the project root before executing.

## Quick Reference

### Daily Operations
```
Start Server:    batch-files/server-management/START-WINDOWS.bat
Stop Server:     batch-files/server-management/STOP-WINDOWS.bat
```

### Database Updates
```
Generate Migration:  batch-files/database-tools/GENERATE-MIGRATION.bat
Apply Migration:     batch-files/database-tools/APPLY-MIGRATIONS.bat
```

### First-Time Setup
```
1. batch-files/server-management/SETUP-FIRST-TIME.bat
2. batch-files/network-tools/ALLOW-FIREWALL.bat
3. batch-files/database-tools/SETUP-LOCAL-DATABASE.bat (if needed)
```

---

## Folder Structure

```
batch-files/
├── server-management/     ← Start/stop server
├── database-tools/        ← Database operations
├── network-tools/         ← Network configuration
├── development-debug/     ← Developer tools
├── utilities/             ← Maintenance scripts
└── legacy/                ← Old files (reference only)
```

---

*Last Updated: October 27, 2025*
