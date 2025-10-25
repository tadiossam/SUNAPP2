# IIS URL Rewrite Configuration for Business Central OData

## Problem
- Business Central web client runs on port 8080
- OData services run on port 7048
- Port 8080 proxy doesn't forward OData requests to port 7048

## Solution
Configure IIS URL Rewrite to proxy OData requests from port 8080 to port 7048.

---

## Step-by-Step Instructions

### Step 1: Install URL Rewrite Module

1. **Download URL Rewrite Module** (if not already installed):
   - Go to: https://www.iis.net/downloads/microsoft/url-rewrite
   - Download and install **URL Rewrite Module 2.1**
   - OR use Web Platform Installer to search for "URL Rewrite"

2. **Verify Installation**:
   - Open **IIS Manager**
   - Click on your server or website
   - Look for **URL Rewrite** icon in the Features View
   - If you see it, you're good to go!

---

### Step 2: Install Application Request Routing (ARR)

URL Rewrite needs ARR to proxy requests:

1. **Download ARR**:
   - Go to: https://www.iis.net/downloads/microsoft/application-request-routing
   - Download and install **Application Request Routing 3.0**

2. **Enable Proxy in ARR**:
   - Open **IIS Manager**
   - Click on your **Server name** (top level in the tree)
   - Double-click **Application Request Routing Cache**
   - Click **Server Proxy Settings** (right panel)
   - Check **"Enable proxy"**
   - Click **Apply**

---

### Step 3: Create URL Rewrite Rule

1. **Open IIS Manager**:
   - Press `Win + R`, type `inetmgr`, press Enter

2. **Navigate to Your Site**:
   - Expand **Sites** in the left panel
   - Click on the site running on port 8080 (likely "Default Web Site" or similar)

3. **Open URL Rewrite**:
   - Double-click **URL Rewrite** icon

4. **Add Reverse Proxy Rule**:
   - Click **Add Rule(s)...** in the right panel
   - Select **Reverse Proxy** (if available)
   - If prompted to enable proxy functionality, click **OK**
   - Enter: `localhost:7048`
   - Click **OK**

5. **Configure the Rule**:
   - The rule will be created automatically
   - Find the new rule in the list and double-click it
   - Update the **Pattern** field to: `^SUNCONBC1/(OData.*|api/.*)`
   - In **Action**, ensure it shows: `http://localhost:7048/{R:0}`
   - Click **Apply**

---

### Step 4: Manual Rule Creation (Alternative)

If the Reverse Proxy template isn't available, create the rule manually:

1. **Add Blank Inbound Rule**:
   - Click **Add Rule(s)...** → **Blank rule** under Inbound rules
   - Click **OK**

2. **Configure Pattern**:
   - **Name**: `BC OData Proxy`
   - **Requested URL**: `Matches the Pattern`
   - **Using**: `Regular Expressions`
   - **Pattern**: `^SUNCONBC1/(OData.*|api/.*)`

3. **Configure Action**:
   - **Action type**: `Rewrite`
   - **Rewrite URL**: `http://localhost:7048/{R:0}`
   - Check **Append query string**
   - **Stop processing of subsequent rules**: Checked

4. **Click Apply**

---

### Step 5: Test Configuration

1. **Restart IIS**:
   ```powershell
   iisreset
   ```

2. **Test OData Endpoint**:
   - Open browser on the server
   - Navigate to:
     ```
     http://196.188.72.250:8080/SUNCONBC1/ODataV4/Company('Sunshine%20Construction%20PLC(Test)')/items
     ```
   - You should see XML/JSON data (not 404)

3. **Test from Replit App**:
   - Go back to the Replit application
   - Click **"Test D365"** button
   - It should show ✓ Success!

---

## Troubleshooting

### Issue: URL Rewrite Icon Not Showing
- Install URL Rewrite Module 2.1 from Microsoft
- Restart IIS Manager after installation

### Issue: "Enable proxy functionality" Not Working
- Install Application Request Routing (ARR)
- Enable proxy in Server Proxy Settings

### Issue: Still Getting 404
- Check the pattern in URL Rewrite rule: `^SUNCONBC1/(OData.*|api/.*)`
- Verify ARR proxy is enabled
- Check IIS logs: `C:\inetpub\logs\LogFiles\`

### Issue: 500 Internal Server Error
- Check that port 7048 is accessible locally: `telnet localhost 7048`
- Ensure Business Central service is running
- Check Windows Event Viewer for IIS errors

---

## PowerShell Commands Reference

```powershell
# Check if BC OData is enabled
Get-NAVServerConfiguration SUNCONBC1 | Select-Object -Property ServicesOperationsEnabled, ODataServicesEnabled

# Restart IIS
iisreset

# Test local OData connectivity
Test-NetConnection -ComputerName localhost -Port 7048

# Check Business Central service status
Get-Service *BC* | Format-Table Name, Status, DisplayName
```

---

## Expected Result

After successful configuration:
- Port 8080 will accept OData requests
- IIS will forward them to port 7048 automatically
- Your Replit app can sync items with Business Central
- Security maintained (only port 8080 needs to be open)

---

## Need Help?

If you encounter issues:
1. Check Windows Event Viewer → Windows Logs → Application
2. Check IIS logs in `C:\inetpub\logs\LogFiles\`
3. Verify Business Central service is running
4. Ensure port 7048 is accessible locally from the server
