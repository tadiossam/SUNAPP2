# Dynamics 365 Business Central Setup Guide

## Prerequisites
- Dynamics 365 Business Central On-Premises installation
- Administrator access to D365 BC

## Step 1: Publish Item Page as Web Service

1. Open Dynamics 365 Business Central
2. Search for **"Web Services"** in the search bar
3. Click **"New"** to create a new web service
4. Configure the following:
   - **Object Type**: Page
   - **Object ID**: 30 (for Item List) or 31 (for Item Card)
   - **Service Name**: `Item` or `Items` (choose one)
   - **Published**: ✅ Check this box
5. Click **OK** to save

## Step 2: Verify the OData URL

After publishing, you should see the OData V4 URL in the web services list. It should look like:
```
http://your-server:port/SUNCONBC1/ODataV4/Company('Your_Company_Name')/Item
```

## Step 3: Test the Connection

You can test the endpoint in your browser or using curl:
```bash
curl -u "username:password" "http://196.188.72.250:8080/SUNCONBC1/ODataV4/Company('Sunshine%20Construction%20PLC(Test)')/Item"
```

## Troubleshooting

### 404 Not Found
- Verify the web service is published
- Check the service name (singular vs plural)
- Ensure the company name is correct (including special characters like parentheses)

### 401 Unauthorized
- Verify username and password are correct
- Ensure the user has permissions to access web services

### No Data Returned
- Check if there are items in D365 that start with "SP-"
- Verify the OData filter syntax

## Current Configuration

The application tries the following endpoints automatically:
1. `/ODataV4/Company('{company}')/Item`
2. `/ODataV4/Company('{company}')/Items`
3. `/OData/Company('{company}')/Item`
4. `/OData/Company('{company}')/Items`

If none of these work, you may need to check your D365 web services configuration.
