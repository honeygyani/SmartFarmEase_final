# ================================================================
#  Rebuild venv_CD (Disease Detection)
#
#  1. Close the Disease Detection terminal window first
#  2. Run:  .\setup_venv_CD.ps1
# ================================================================

$PYTHON = "C:\Users\vnykn\AppData\Local\Programs\Python\Python310\python.exe"
$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $ROOT_DIR) { $ROOT_DIR = Get-Location }
$venvPath = Join-Path $ROOT_DIR "venv_CD"

Write-Host "Rebuilding venv_CD (Disease Detection)..." -ForegroundColor Yellow

# Kill any Python processes that might be locking the folder
Write-Host "  Killing lingering Python processes..."
taskkill /f /im python.exe 2>$null
Start-Sleep -Seconds 3

# Delete old venv
if (Test-Path $venvPath) {
    Write-Host "  Deleting old venv_CD..."
    cmd /c "rmdir /s /q `"$venvPath`""
    Start-Sleep -Seconds 2
    if (Test-Path $venvPath) {
        [System.IO.Directory]::Delete($venvPath, $true)
        Start-Sleep -Seconds 2
    }
}

if (Test-Path $venvPath) {
    Write-Host "  ERROR: Could not delete venv_CD. Please reboot and try again." -ForegroundColor Red
    exit 1
}

# Create new venv
Write-Host "  Creating venv..."
& $PYTHON -m venv $venvPath

# Install dependencies
$pip = Join-Path $venvPath "Scripts\pip.exe"
& $pip install --upgrade pip --quiet

Write-Host "  Installing requirements (TensorFlow 2.15.1)..."
& $pip install -r (Join-Path $ROOT_DIR "requirements_CD.txt")

Write-Host "  Installing server extras..."
& $pip install fastapi "uvicorn[standard]" scikit-image python-multipart

Write-Host ""
Write-Host "[venv_CD] Done!" -ForegroundColor Green
Write-Host "  Restart the app with: .\starter.ps1"
