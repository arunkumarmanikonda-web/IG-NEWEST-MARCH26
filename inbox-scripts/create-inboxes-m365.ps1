# ============================================================================
# India Gully — Microsoft 365 / Exchange Online Inbox Provisioning
# PowerShell script — run in Exchange Online PowerShell session
# ============================================================================
# PRE-REQUISITES:
#   Install-Module -Name ExchangeOnlineManagement
#   Connect-ExchangeOnline -UserPrincipalName admin@indiagully.com
#
# Usage: .\create-inboxes-m365.ps1
# ============================================================================

$Domain = "indiagully.com"
$License = "indiagully:ENTERPRISEPACK"  # Replace with your M365 license SKU

function New-IGUser {
    param($UPN, $DisplayName, $FirstName, $LastName, $Password, $EmpID = "", $Dept = "")
    try {
        New-MsolUser -UserPrincipalName $UPN -DisplayName $DisplayName `
            -FirstName $FirstName -LastName $LastName `
            -Password $Password -ForceChangePassword $true `
            -UsageLocation "IN" -LicenseAssignment $License | Out-Null
        if ($EmpID) { Set-MsolUser -UserPrincipalName $UPN -Title $EmpID }
        if ($Dept)  { Set-MsolUser -UserPrincipalName $UPN -Department $Dept }
        Write-Host "  ✅ $UPN" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $UPN — $($_.Exception.Message)" -ForegroundColor Red
    }
}

function New-IGGroup {
    param($Email, $DisplayName, $Members)
    try {
        New-DistributionGroup -Name $DisplayName -PrimarySmtpAddress $Email `
            -Type Distribution | Out-Null
        foreach ($m in $Members) {
            Add-DistributionGroupMember -Identity $Email -Member $m | Out-Null
        }
        Write-Host "  ✅ $Email → $($Members -join ', ')" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $Email — $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  India Gully — M365 Inbox Provisioning" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan

# ── Group 1: System Critical ──────────────────────────────────────────────
Write-Host "`n▶ Group 1: System Critical" -ForegroundColor Yellow

New-IGUser "info@$Domain"        "India Gully Info"        "India Gully" "Info"       "Info@IG2026!"
New-IGUser "admin@$Domain"       "India Gully Admin"       "India Gully" "Admin"      "Admin@IG2026!"
New-IGUser "dpo@$Domain"         "Data Protection Officer" "Data"        "Protection" "Dpo@IG2026!"
New-IGUser "noreply@$Domain"     "India Gully No Reply"    "India Gully" "No Reply"   "Noreply@IG2026!"
New-IGUser "superadmin@$Domain"  "Super Admin"             "Super"       "Admin"      "SuperAdmin@IG2026!"

# Make admin + superadmin Global Admins
Add-MsolRoleMember -RoleName "Company Administrator" -RoleMemberEmailAddress "admin@$Domain"
Add-MsolRoleMember -RoleName "Company Administrator" -RoleMemberEmailAddress "superadmin@$Domain"

# ── Group 2: Leadership ───────────────────────────────────────────────────
Write-Host "`n▶ Group 2: Leadership / Board" -ForegroundColor Yellow

New-IGUser "akm@$Domain"             "Arun Kumar Manikonda" "Arun Kumar" "Manikonda" "Arun@IG2026"
New-IGUser "pavan@$Domain"           "Pavan Manikonda"      "Pavan"      "Manikonda" "Pavan@IG2026"
New-IGUser "amit.jhingan@$Domain"    "Amit Jhingan"         "Amit"       "Jhingan"   "Amit@IG2026"

# ── Group 3: Employees ────────────────────────────────────────────────────
Write-Host "`n▶ Group 3: Employees" -ForegroundColor Yellow

New-IGUser "riya.sharma@$Domain"   "Riya Sharma"   "Riya"   "Sharma" "Riya@IG2026"   "IG-EMP-0001" "Analytics"
New-IGUser "arjun.mehta@$Domain"   "Arjun Mehta"   "Arjun"  "Mehta"  "Arjun@IG2026"  "IG-EMP-0002" "Advisory"
New-IGUser "priya.nair@$Domain"    "Priya Nair"    "Priya"  "Nair"   "Priya@IG2026"  "IG-EMP-0003" "Operations"
New-IGUser "vikram.singh@$Domain"  "Vikram Singh"  "Vikram" "Singh"  "Vikram@IG2026" "IG-EMP-0004" "Advisory"
New-IGUser "neha.joshi@$Domain"    "Neha Joshi"    "Neha"   "Joshi"  "Neha@IG2026"   "IG-EMP-0005" "Analytics"

# ── Group 4: Distribution Groups ─────────────────────────────────────────
Write-Host "`n▶ Group 4: Functional Aliases" -ForegroundColor Yellow

New-IGGroup "advisory@$Domain"    "Advisory Team"       @("vikram.singh@$Domain")
New-IGGroup "horeca@$Domain"      "HoReCa Division"     @("priya.nair@$Domain")
New-IGGroup "realestate@$Domain"  "Real Estate Division"@("amit.jhingan@$Domain")
New-IGGroup "finance@$Domain"     "Finance & Accounts"  @("admin@$Domain")
New-IGGroup "hr@$Domain"          "Human Resources"     @("priya.nair@$Domain")
New-IGGroup "legal@$Domain"       "Legal & Compliance"  @("admin@$Domain")

Write-Host "`n✅ All 19 inboxes provisioned on $Domain" -ForegroundColor Green
Write-Host "  Run: Get-MsolUser -All | Where {`$_.UserPrincipalName -like '*@indiagully.com'} | Select UPN" -ForegroundColor Yellow
