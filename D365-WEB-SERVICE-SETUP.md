# How to Publish Item Page as Web Service in Business Central

## Problem
All D365 sync endpoints are returning **404 errors** because the Item page/table is not published as a web service in your Business Central installation.

## Solution: Publish the Item Page as a Web Service

### Step 1: Open Web Services Page in Business Central

1. Log in to Business Central at: `http://196.188.72.250:8080/SUNCONBC1/`
2. Use the search function (🔍 or Alt+Q) and search for **"Web Services"**
3. Click on **"Web Services"** to open the page

### Step 2: Create a New Web Service

1. Click **"+ New"** to create a new web service
2. Fill in the following fields:

   | Field | Value |
   |-------|-------|
   | **Object Type** | Page |
   | **Object ID** | 31 (Item List page) or 30 (Item Card page) |
   | **Service Name** | Item or Items |
   | **Published** | ✅ Check this box |

3. Click **OK** to save

### Step 3: Verify the Web Service

After publishing, you should see the web service in the list with:
- **OData URL**: Should show something like `/SUNCONBC1/ODataV4/Company('...')/Item`
- **Status**: Published ✅

### Step 4: Test the Connection

1. Go back to your application
2. Navigate to the **Items** page
3. Click the **"Test D365"** button
4. You should now see one of the endpoints succeed!

## Alternative: Publish as API

If the above doesn't work, try publishing as an API:

1. Open **"Web Services"** in Business Central
2. Create a new web service with:
   - **Object Type**: Query or API Page
   - **Object ID**: Look for Item-related APIs (often in 30000+ range for custom objects)
   - **Service Name**: ItemAPI
   - **Published**: ✅ Checked

## Common Issues

### Issue 1: "Item" vs "Items" naming
- Try both singular "Item" and plural "Items" as the service name
- The system will test both variations

### Issue 2: Company Name with Special Characters
- Your company name is: `Sunshine Construction PLC(Test)`
- Note: Missing closing parenthesis might cause issues
- Consider creating a simpler company name for web services

### Issue 3: Authentication
- Make sure the D365 user credentials have permission to access web services
- Check that the user is not locked to only use the web client

## Test Again

After publishing the web service:

1. **Click "Test D365"** button in your app
2. One of these endpoints should now work:
   - `/SUNCONBC1/ODataV4/Company('Sunshine%20Construction%20PLC(Test)')/Item`
   - `/SUNCONBC1/OData/Company('Sunshine%20Construction%20PLC(Test)')/Item`

3. If successful, you can then use **"Sync from D365"** to pull items!

## Need Help?

If you're still getting 404 errors after publishing:
1. Share a screenshot of your published web services list
2. Try accessing the OData URL directly in a browser (it will prompt for credentials)
3. Check Business Central permissions for the user account
