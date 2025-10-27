# D365 Auto-Sync Setup

This folder contains scripts to set up automatic synchronization between Dynamics 365 Business Central and Gelan Terminal Maintenance application.

## Files

### SETUP-AUTO-SYNC.bat
**Purpose**: Automatically creates a Windows Task Scheduler task to run D365 sync at your specified interval

**How to Use**:
1. **Right-click** → **Run as administrator**
2. Enter your desired sync interval in hours (e.g., `2` for every 2 hours)
3. The script will create a scheduled task named "D365DataSync"

**Prerequisites**:
- You must have already downloaded `D365-Sync.ps1` from Gelan Terminal Admin Settings
- Place `D365-Sync.ps1` in `C:\D365Sync\` folder on your D365 server
- Test the script manually first before scheduling it

## Complete Setup Workflow

### Step 1: Configure D365 Settings (One-time)
1. Open Gelan Terminal app → Admin Settings → Dynamics 365 tab
2. Fill in:
   - D365 URL (e.g., `http://192.168.0.16:7048/SUNCONBC1`)
   - Company name
   - Username and password
   - **Item Prefix** (e.g., `SP-` to only sync items starting with "SP-")
   - **Equipment Prefix** (e.g., `FA-` to only sync fixed assets starting with "FA-")
   - **Sync Interval** (in hours)
3. Click **Save Settings**

### Step 2: Download PowerShell Script
1. Click **Generate PowerShell Script** button
2. Save `D365-Sync.ps1` file
3. Copy it to your D365 server at `192.168.0.16`

### Step 3: Test Manual Sync
1. On D365 server, create folder: `C:\D365Sync\`
2. Place `D365-Sync.ps1` in that folder
3. Right-click `D365-Sync.ps1` → **Run with PowerShell**
4. Verify it works (you should see items being synced)
5. Check Gelan Terminal → Admin Settings → PowerShell Sync History

### Step 4: Set Up Auto-Sync (Optional)
1. Copy `SETUP-AUTO-SYNC.bat` to your D365 server
2. **Right-click** → **Run as administrator**
3. Enter sync interval (e.g., `2` for every 2 hours)
4. Done! The script will now run automatically

## How It Works

1. **PowerShell Script** fetches ALL items and equipment from D365
2. **Filtering** happens automatically based on your prefix settings
3. **Smart Updates**:
   - New items matching prefix → Added to database
   - Existing items → Quantities updated
   - Items not matching prefix → Ignored
4. **Sync History** tracked in Gelan Terminal for monitoring

## Troubleshooting

### "Access Denied" Error
- Make sure you're running SETUP-AUTO-SYNC.bat as administrator
- Right-click → "Run as administrator"

### Script Doesn't Find Items
- Verify your Item Prefix in admin settings matches D365 item numbers
- Example: If items are `SP-001`, `SP-002`, use prefix `SP-`
- Leave prefix blank to sync ALL items (not recommended)

### Task Doesn't Run Automatically
- Open Task Scheduler (Windows → Search "Task Scheduler")
- Find "D365DataSync" task
- Right-click → Properties → Triggers tab
- Verify the interval is correct
- Right-click → Run to test manually

### Connection Errors
- Verify D365 server is accessible from where script runs
- Test by opening browser: `http://192.168.0.16:7048/SUNCONBC1`
- Make sure credentials in D365-Sync.ps1 are correct

## Advanced: Manual Task Scheduler Setup

If the batch file doesn't work, you can create the task manually:

1. Open **Task Scheduler**
2. Click **Create Basic Task**
3. Name: `D365DataSync`
4. Trigger: **Daily** → **Repeat every X hours**
5. Action: **Start a program**
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File C:\D365Sync\D365-Sync.ps1`
6. Run as: **SYSTEM** or your service account

## Security Notes

- The PowerShell script contains your D365 credentials
- Keep it in a secure location on the D365 server
- Only authorized personnel should have access
- Use API key authentication (automatically configured)
- All communication is within your local network (192.168.x.x)
