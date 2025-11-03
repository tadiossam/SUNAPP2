# Dynamics 365 Business Central Data Sync Script
# Generated: 2025-10-28T13:27:09.465Z
# This script fetches data from D365 and sends it to the Gelan Terminal Maintenance app

# Configuration
$D365Url = "http://192.168.0.16:7048/SUNCONBC1"
$CompanyName = "Sunshine Construction PLC(Test"
$AppUrl = "http://192.168.0.16:3000"
$ApiKey = "ba9688d3-f199-4bd5-9d86-02d5ab2cb849"

# Function to fetch data from D365
function Get-D365Data {
    param(
        [string]$Endpoint
    )
    
    $encodedCompany = [System.Web.HttpUtility]::UrlEncode($CompanyName)
    $url = "$D365Url/ODataV4/Company('$encodedCompany')/$Endpoint"
    
    Write-Host "Fetching from: $url"
    
    try {
        # Use Windows Integrated Authentication (works automatically on D365 server)
        $response = Invoke-RestMethod -Uri $url -Method Get -UseDefaultCredentials
        return $response.value
    }
    catch {
        Write-Host "Error fetching data: $_"
        return $null
    }
}

# Function to send data to app
function Send-ToApp {
    param(
        [array]$Items,
        [array]$Equipment,
        [string]$SyncType
    )
    
    $body = @{
        apiKey = $ApiKey
        items = $Items
        equipment = $Equipment
        syncType = $SyncType
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$AppUrl/api/dynamics365/receive-data" `
            -Method Post `
            -Body $body `
            -ContentType "application/json"
        
        Write-Host "✓ Sync successful!"
        Write-Host "  - Saved: $($response.savedCount)"
        Write-Host "  - Updated: $($response.updatedCount)"
        Write-Host "  - Skipped: $($response.skippedCount)"
        
        return $response
    }
    catch {
        Write-Host "✗ Error sending data to app: $_"
        return $null
    }
}

# Main execution
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  D365 Data Sync" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Fetch items
Write-Host "Fetching items from D365..." -ForegroundColor Yellow
$items = Get-D365Data -Endpoint "items"

# Filter by prefix if specified
$itemPrefix = ""
if ($itemPrefix -and $items) {
    $itemsBefore = $items.Count
    $items = $items | Where-Object { $_.No -like "$itemPrefix*" }
    Write-Host "Filtered items: $($items.Count) of $itemsBefore match prefix '$itemPrefix'" -ForegroundColor Cyan
}

if ($items) {
    Write-Host "Found $($items.Count) items" -ForegroundColor Green
} else {
    Write-Host "No items found or error occurred" -ForegroundColor Red
}

# Fetch equipment (try different endpoints)
Write-Host "Fetching equipment from D365..." -ForegroundColor Yellow
$equipment = Get-D365Data -Endpoint "FixedAssets"

if (-not $equipment) {
    $equipment = Get-D365Data -Endpoint "Fixed_Assets"
}

# Filter by prefix if specified
$equipmentPrefix = ""
if ($equipmentPrefix -and $equipment) {
    $equipBefore = $equipment.Count
    $equipment = $equipment | Where-Object { $_.No -like "$equipmentPrefix*" }
    Write-Host "Filtered equipment: $($equipment.Count) of $equipBefore match prefix '$equipmentPrefix'" -ForegroundColor Cyan
}

if ($equipment) {
    Write-Host "Found $($equipment.Count) equipment" -ForegroundColor Green
} else {
    Write-Host "No equipment found or endpoint not available" -ForegroundColor Yellow
}

# Send to app
if ($items -or $equipment) {
    Write-Host ""
    Write-Host "Sending data to Gelan Terminal app..." -ForegroundColor Yellow
    $result = Send-ToApp -Items $items -Equipment $equipment -SyncType "powershell_sync"
    
    if ($result) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Sync Complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "No data to sync" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
