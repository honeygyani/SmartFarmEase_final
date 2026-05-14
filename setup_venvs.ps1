# ================================================================
#  SmartFarmEase — Rebuild All Virtual Environments
#
#  PREREQUISITES:
#    1. Install Python 3.10 from https://www.python.org/downloads/release/python-31011/
#    2. Note the install path (e.g. C:\Python310\python.exe)
#    3. Edit the $PYTHON variable below to point to your Python 3.10
#    4. Run:  .\setup_venvs.ps1
#
#  This script deletes all existing venvs and recreates them
#  with the correct Python version and dependencies.
# ================================================================

# ── EDIT THIS to your Python 3.10 executable path ──
$PYTHON = "C:\Users\vnykn\AppData\Local\Programs\Python\Python310\python.exe"

# ── Verify Python exists ──
if (-not (Test-Path $PYTHON)) {
    Write-Host "ERROR: Python not found at $PYTHON" -ForegroundColor Red
    Write-Host "Please install Python 3.10 and update the `$PYTHON variable in this script." -ForegroundColor Yellow
    Write-Host "Download: https://www.python.org/downloads/release/python-31011/" -ForegroundColor Cyan
    exit 1
}

$pyVersion = & $PYTHON --version 2>&1
Write-Host "Using: $pyVersion at $PYTHON" -ForegroundColor Cyan
Write-Host ""

$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $ROOT_DIR) { $ROOT_DIR = Get-Location }

# ── Helper function ──
function Rebuild-Venv {
    param(
        [string]$Name,
        [string]$RequirementsFile,
        [string[]]$ExtraPackages = @()
    )

    $venvPath = Join-Path $ROOT_DIR $Name
    Write-Host "────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "[$Name] Rebuilding..." -ForegroundColor Yellow

    # Delete old venv
    if (Test-Path $venvPath) {
        Write-Host "  Removing old $Name..." -ForegroundColor DarkGray
        Remove-Item -Recurse -Force $venvPath
    }

    # Create new venv
    Write-Host "  Creating venv..."
    & $PYTHON -m venv $venvPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  FAILED to create venv $Name" -ForegroundColor Red
        return
    }

    $pip = Join-Path $venvPath "Scripts\pip.exe"

    # Upgrade pip
    & $pip install --upgrade pip --quiet 2>&1 | Out-Null

    # Install requirements
    $reqPath = Join-Path $ROOT_DIR $RequirementsFile
    if (Test-Path $reqPath) {
        Write-Host "  Installing from $RequirementsFile..."
        & $pip install -r $reqPath
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  WARNING: Some packages may have failed" -ForegroundColor Yellow
        }
    }

    # Install extra packages (like fastapi, uvicorn for servers)
    foreach ($pkg in $ExtraPackages) {
        Write-Host "  Installing extra: $pkg"
        & $pip install $pkg --quiet
    }

    Write-Host "  [$Name] Done!" -ForegroundColor Green
    Write-Host ""
}

# Common extras that all AI servers need
$serverExtras = @("fastapi", "uvicorn[standard]")

# ================================================================
# Build each venv
# ================================================================

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Rebuilding all 6 virtual environments   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Disease Detection
Rebuild-Venv -Name "venv_CD" -RequirementsFile "requirements_CD.txt" `
    -ExtraPackages ($serverExtras + @("scikit-image"))

# 2. Crop Recommendation
Rebuild-Venv -Name "venv_CR" -RequirementsFile "requirements_CR.txt" `
    -ExtraPackages ($serverExtras + @("requests"))

# 3. Fertilizer Prediction
Rebuild-Venv -Name "venv_FS" -RequirementsFile "requirements_FS.txt" `
    -ExtraPackages ($serverExtras + @("treeinterpreter"))

# 4. Price Forecasting
Rebuild-Venv -Name "venv_PF" -RequirementsFile "requirements_PF.txt" `
    -ExtraPackages $serverExtras

# 5. Sowing Window
Rebuild-Venv -Name "venv_SW" -RequirementsFile "requirements_SW.txt" `
    -ExtraPackages $serverExtras

# 6. Backend
Rebuild-Venv -Name "venv_backend" -RequirementsFile "backend\requirements.txt"

# ── Prisma setup for backend ──
Write-Host "────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "[Prisma] Generating client & pushing schema..." -ForegroundColor Yellow
$backendPython = Join-Path $ROOT_DIR "venv_backend\Scripts\python.exe"
Push-Location (Join-Path $ROOT_DIR "backend")
& $backendPython -m prisma generate
& $backendPython -m prisma db push
Pop-Location
Write-Host "[Prisma] Done!" -ForegroundColor Green

# ── Summary ──
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  All venvs rebuilt successfully!          " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "    1. Seed the database:  cd backend; ..\venv_backend\Scripts\python.exe seed.py"
Write-Host "    2. Start everything:   .\starter.ps1"
Write-Host ""
