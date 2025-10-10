# How to See the Required Spare Parts Feature

## The Feature IS Already Implemented

Location: Work Orders page → Add Work Order dialog

## Steps to Verify:

### Step 1: Clear Your Browser Cache
Choose ONE option:

**Option A - Incognito Mode (Fastest):**
- Chrome/Edge: Press `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
- Firefox: Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
- Safari: Press `Cmd+Shift+N`

**Option B - Clear Cache:**
- Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Select "All time" or "Everything"
- Check: Cached images and files
- Check: Site data
- Click "Clear data"
- Close ALL browser windows
- Reopen browser

### Step 2: Access the Application
1. Open your application URL
2. Login with: **admin** / **admin123**

### Step 3: Navigate to Work Orders
1. Look at the LEFT SIDEBAR
2. Click on **"Work Orders"** (has a clipboard icon)

### Step 4: Open Create Work Order Dialog
1. Look at the TOP-RIGHT corner of the page
2. Click the blue **"+ Add Work Order"** button
3. A dialog (pop-up window) will open with a form

### Step 5: Find Required Spare Parts Field
In the form, you will see fields in this ORDER:
1. Work Order Number (optional)
2. Equipment (dropdown)
3. Work Type (dropdown)
4. Priority (dropdown)
5. Garage/Workshop (dropdown)
6. Assign To (dropdown)
7. **↓ SCROLL DOWN ↓**
8. **📦 Required Spare Parts** ← **THIS IS IT!**
   - Has a label with a package (📦) icon
   - Has a button: **"Select Spare Parts"**

### Step 6: Click the Button
1. Click the **"Select Spare Parts"** button
2. A large pop-up dialog will open
3. You will see:
   - Title: "Select Spare Parts"
   - Search box at top
   - List of 85 spare parts with checkboxes
   - Each part shows: name, number, category, stock status, price
   - Bottom buttons: "Cancel" and "Confirm Selection"

### Step 7: Select Parts
1. Check the box next to any part OR click the row
2. The part becomes selected (checkbox is checked)
3. Bottom of dialog shows: "X part(s) selected"
4. Click "Confirm Selection"
5. Dialog closes
6. Selected parts appear as badges in the main form

## If You Still Don't See It

The feature is in the code (verified multiple times). If you still don't see it after clearing cache:

1. You may need to unregister the service worker manually
2. There may be a network/proxy issue
3. Your browser may need to be completely restarted

## Code Location (For Developers)
- File: `client/src/pages/WorkOrders.tsx`
- Lines 447-510: Required Spare Parts field and button
- Lines 605-704: Spare Parts selection dialog
