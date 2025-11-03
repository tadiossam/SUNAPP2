param(
    [string]$baseUrl,
    [string]$Username,
    [string]$Password,
    [string]$CompanyName,
    [string]$Type,
    [string]$FilterValue,
    [int]$Skip = 0,
    [int]$Top = 20,
    [string]$Mode = "data"
)

# ------------------------------
# Credentials Setup
# ------------------------------
$secpasswd = ConvertTo-SecureString $Password -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ($Username, $secpasswd)

# Helper function to output JSON
function Write-Json($obj) {
    $obj | ConvertTo-Json -Depth 10
}

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ------------------------------
# TEST CONNECTION
# ------------------------------
if ($Mode -eq "test") {
    if (-not $baseUrl) {
        Write-Json @{ status = "error"; message = "baseUrl required" }
        exit 1
    }

    try {
        $testUrl = "$baseUrl/ODataV4/Company"
        $response = Invoke-WebRequest -Uri $testUrl -Credential $cred -Method Head -UseBasicParsing -ErrorAction Stop

        Write-Json @{
            status  = "ok"
            message = "Connection successful"
            url     = $testUrl
        }
    } catch {
        Write-Json @{
            status  = "error"
            message = $_.Exception.Message
        }
    }
    exit 0
}

# ------------------------------
# FETCH COMPANIES
# ------------------------------
if (-not $CompanyName -or $CompanyName -eq "") {
    try {
        $companyUrl = "$baseUrl/ODataV4/Company"
        $companies = Invoke-RestMethod -Uri $companyUrl -Credential $cred -ErrorAction Stop

        if ($companies.value.Count -gt 0) {
            Write-Json @{
                status    = "ok"
                mode      = "companies"
                companies = $companies.value
            }
        } else {
            Write-Json @{
                status  = "empty"
                message = "No companies found."
            }
        }
    } catch {
        Write-Json @{
            status  = "error"
            message = $_.Exception.Message
        }
    }
    exit 0
}

# ------------------------------
# FETCH DATA (Items / FixedAssets)
# ------------------------------
try {
    $companyEncoded = [System.Uri]::EscapeDataString($CompanyName)
    $odataUrl = "$baseUrl/ODataV4/Company('$companyEncoded')/$Type"

    # ✅ Correct $select fields (changed Inventory → Inventory_Value)
    if ($Type -eq "items") {
        # Replace "Inventory" with the correct field from your OData metadata
        $fields = "No,Description,InventoryField,Purch_Unit_of_Measure,Unit_Cost,Last_Date_Modified"
    } elseif ($Type -eq "FixedAssets") {
        $fields = "No,Description"
    } else {
        $fields = "No,Description"
    }

    # Start query params
    $params = @()
    $params += "`$select=$fields"
    $params += "`$top=$Top"
    $params += "`$skip=$Skip"

    if ($FilterValue -and $FilterValue -ne "") {
        $encodedValue = [System.Uri]::EscapeDataString($FilterValue)
        $params += "`$filter=startswith(No,'$encodedValue')"
    }

    # Combine all params safely
    $odataUrl = $odataUrl + "?" + ($params -join "&")

    # ✅ Fetch data
    $data = Invoke-RestMethod -Uri $odataUrl -Credential $cred -ErrorAction Stop

    # ✅ Validate and output
    if ($data.value) {
    foreach ($record in $data.value) {
        $record.PSObject.Properties.Remove('@odata.etag')
    }

    Write-Json @{
        status   = "ok"
        mode     = "data"
        type     = $Type
        count    = $data.value.Count
        records  = $data.value
        nextLink = $data.'@odata.nextLink'
        urlUsed  = $odataUrl
    }
} else {
    Write-Json @{
        status  = "empty"
        message = "No $Type records found."
        urlUsed = $odataUrl
    }
}
} catch {
    Write-Json @{
        status  = "error"
        message = $_.Exception.Message
        urlUsed = $odataUrl
    }
}
exit 0
