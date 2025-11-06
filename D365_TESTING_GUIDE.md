# D365 Syncto365 Integration Testing Guide

## Overview
The D365 integration now includes the Syncto365-style table view with pagination and selection functionality. This guide will help you test the feature on your local network and capture logs for debugging.

## Testing Steps

### 1. Navigate to Admin Settings
1. Log in to the application (http://localhost:5000)
2. Go to **Admin Settings** page
3. Click on the **Dynamics 365** tab

### 2. Configure D365 Connection
1. Fill in your D365 Business Central credentials:
   - **BC URL**: Your D365 BC instance URL
   - **Username**: Your D365 username
   - **Password**: Your D365 password
   - **Company**: Leave empty for now

2. Click **Test Connection** to verify credentials

3. Click **Fetch Companies** to load company list

4. Select a company from the dropdown

### 3. Test Items Fetch
1. Click the **Fetch Items (PowerShell)** button
2. **EXPECTED BEHAVIOR**:
   - A modal dialog should open
   - Title should show "Items (Page 1)"
   - Table should display columns: checkbox, No, Description, Inventory, Unit of Measure, Unit Cost, Last Modified
   - Records from D365 should be displayed
   - Footer should show "0 selected" badge
   - "Previous" and "Next" pagination buttons should be visible
   - "Insert Selected" button should be disabled

### 4. Test Selection
1. **Select All**:
   - Click the checkbox in the table header
   - All records should become checked
   - Badge should show "20 selected" (or however many records are displayed)

2. **Unselect All**:
   - Click the header checkbox again
   - All checkboxes should become unchecked
   - Badge should show "0 selected"

3. **Select Individual**:
   - Click the checkbox next to one record
   - Only that record should be checked
   - Badge should show "1 selected"
   - "Insert Selected" button should become enabled (amber color)

### 5. Test Pagination
1. Click **Next** button:
   - Dialog title should update to "Items (Page 2)"
   - New set of records should load
   - "Previous" button should become enabled
   - Selection should reset to "0 selected"

2. Click **Previous** button:
   - Dialog title should update to "Items (Page 1)"
   - Original records should be displayed
   - "Previous" button should become disabled

### 6. Test Fixed Assets
1. Close the Items modal
2. Click **Fetch Fixed Assets (PowerShell)** button
3. **EXPECTED BEHAVIOR**:
   - Modal should open with title "Fixed Assets (Page 1)"
   - Table should display only 3 columns: checkbox, No, Description
   - Same pagination and selection functionality as Items

## Capturing Browser Console Logs

### Method 1: Chrome DevTools
1. Press `F12` to open DevTools
2. Click the **Console** tab
3. Perform the test steps above
4. Look for logs prefixed with:
   - `[D365 FETCH]` - Data fetching operations
   - `[D365 MODAL]` - Modal dialog operations
   - `[D365 PAGINATION]` - Page navigation
   - `[D365 SELECTION]` - Record selection
   - `[D365 COMPANIES]` - Company loading

5. **Save logs**:
   - Right-click in the console
   - Select "Save as..."
   - Save as `d365_console_logs.txt`

### Method 2: Copy All Logs
1. Right-click in the console
2. Select "Select All" or press `Ctrl+A`
3. Copy (`Ctrl+C`)
4. Paste into a text file and save as `d365_console_logs.txt`

## What Logs to Look For

### Successful Flow
```
[D365 FETCH] Starting PowerShell fetch with params: {...}
[D365 FETCH] Success response: {status: 'ok', mode: 'data', ...}
[D365 MODAL] Opening data table modal with: {...}
[D365 MODAL] Modal state updated, should be opening now
[D365 MODAL] Dialog state changing: {previousState: false, newState: true, ...}
```

### Pagination Logs
```
[D365 PAGINATION] Next page clicked: {currentSkip: 0, newSkip: 20, ...}
[D365 FETCH] Starting PowerShell fetch with params: {skip: 20, ...}
```

### Selection Logs
```
[D365 SELECTION] Select all toggled: {checked: true, recordCount: 20, ...}
[D365 SELECTION] Individual record toggled: {recordNo: 'ITEM001', action: 'select', ...}
```

## Troubleshooting

### Modal Doesn't Open
- Check if `[D365 MODAL] Opening data table modal` appears in console
- Check if `[D365 MODAL] Dialog state changing` shows `newState: true`
- Verify that `data.records` is not empty in the fetch response

### No Records Displayed
- Check `[D365 FETCH] Success response` for `recordCount: 0`
- Verify D365 connection and company selection
- Check PowerShell script execution on server side

### Pagination Not Working
- Check if `[D365 PAGINATION]` logs appear when clicking buttons
- Verify `newSkip` values are correct (0, 20, 40, etc.)
- Check if second fetch request is made with correct skip parameter

### Selection Not Working
- Check if `[D365 SELECTION]` logs appear when clicking checkboxes
- Verify `recordNos` array in logs
- Check if `selectedCount` badge updates

## Sending Logs to Developer

After testing, please send the following:
1. **Browser console logs** (`d365_console_logs.txt`)
2. **Screenshots** of:
   - The modal dialog showing Items table
   - The modal dialog showing Fixed Assets table
   - Any error messages or unexpected behavior
3. **Description** of any issues encountered:
   - What you were doing when the issue occurred
   - What you expected to happen
   - What actually happened

## Expected Complete Log Sequence

Here's what a successful test should look like:

```
[D365 FETCH] Starting PowerShell fetch with params: {type: 'items', skip: 0, top: 20}
[D365 FETCH] Success response: {status: 'ok', mode: 'data', recordCount: 20}
[D365 MODAL] Opening data table modal with: {dataType: 'items', recordsReceived: 20}
[D365 MODAL] Modal state updated, should be opening now
[D365 MODAL] Dialog state changing: {newState: true, currentRecordCount: 20}
[D365 SELECTION] Select all toggled: {checked: true, recordCount: 20}
[D365 SELECTION] Select all toggled: {checked: false, recordCount: 20}
[D365 SELECTION] Individual record toggled: {recordNo: 'ITEM001', action: 'select'}
[D365 PAGINATION] Next page clicked: {currentSkip: 0, newSkip: 20}
[D365 FETCH] Starting PowerShell fetch with params: {type: 'items', skip: 20, top: 20}
[D365 FETCH] Success response: {status: 'ok', mode: 'data', recordCount: 20}
[D365 MODAL] Opening data table modal with: {dataType: 'items', recordsReceived: 20}
[D365 PAGINATION] Previous page clicked: {currentSkip: 20, newSkip: 0}
```

## Questions?

If you encounter any issues or have questions, please:
1. Save the console logs
2. Take screenshots of the UI
3. Note the exact steps you performed
4. Send all of this information along with a description of the issue
