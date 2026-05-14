# ================================================================
#  Rebuild venv_FS (Fertilizer Prediction)
#
#  1. Close ALL other PowerShell/terminal windows first
#  2. Run:  .\setup_venv_FS.ps1
# ================================================================

$PYTHON = "C:\Users\vnykn\AppData\Local\Programs\Python\Python310\python.exe"
$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $ROOT_DIR) { $ROOT_DIR = Get-Location }
$venvPath = Join-Path $ROOT_DIR "venv_FS"

Write-Host "Rebuilding venv_FS..." -ForegroundColor Yellow

# Kill any Python processes that might be locking the folder
Write-Host "  Killing lingering Python processes..."
taskkill /f /im python.exe 2>$null
Start-Sleep -Seconds 3

# Delete old venv using cmd (more reliable on Windows)
if (Test-Path $venvPath) {
    Write-Host "  Deleting old venv_FS..."
    cmd /c "rmdir /s /q `"$venvPath`""
    Start-Sleep -Seconds 2
    # If still exists, try .NET method
    if (Test-Path $venvPath) {
        [System.IO.Directory]::Delete($venvPath, $true)
        Start-Sleep -Seconds 2
    }
}

if (Test-Path $venvPath) {
    Write-Host "  ERROR: Could not delete venv_FS. Please reboot and try again." -ForegroundColor Red
    exit 1
}

# Create new venv
Write-Host "  Creating venv..."
& $PYTHON -m venv $venvPath

# Install dependencies
$pip = Join-Path $venvPath "Scripts\pip.exe"
& $pip install --upgrade pip --quiet

Write-Host "  Installing requirements..."
& $pip install -r (Join-Path $ROOT_DIR "requirements_FS.txt")

Write-Host "  Installing server extras..."
& $pip install fastapi "uvicorn[standard]" treeinterpreter

Write-Host ""
Write-Host "[venv_FS] Done!" -ForegroundColor Green
