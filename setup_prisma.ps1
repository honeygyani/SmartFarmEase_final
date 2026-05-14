# ================================================================
#  Prisma Setup - Generate Client & Push Schema to Database
#
#  Run after changing the DATABASE_URL in backend\.env
#  Usage:  .\setup_prisma.ps1
# ================================================================

$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $ROOT_DIR) { $ROOT_DIR = Get-Location }
$backendPython = Join-Path $ROOT_DIR "venv_backend\Scripts\python.exe"
$backendScripts = Join-Path $ROOT_DIR "venv_backend\Scripts"
$backendDir = Join-Path $ROOT_DIR "backend"

if (-not (Test-Path $backendPython)) {
    Write-Host "ERROR: venv_backend not found. Run setup_venvs.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "Prisma Setup" -ForegroundColor Cyan
Write-Host ""

# Add venv Scripts to PATH so prisma-client-py can be found
$env:PATH = "$backendScripts;$env:PATH"

Push-Location $backendDir

# Generate the Prisma client from schema.prisma
Write-Host "[1/3] Generating Prisma client..." -ForegroundColor Yellow
& $backendPython -m prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Prisma generate failed. Retrying with node workaround..." -ForegroundColor Yellow
    & $backendPython -c "from prisma.cli import main; main()" generate
}

# Push schema to database (creates/updates tables)
Write-Host "[2/3] Pushing schema to database..." -ForegroundColor Yellow
& $backendPython -m prisma db push --skip-generate

# Seed test data
Write-Host "[3/3] Seeding database..." -ForegroundColor Yellow
& $backendPython seed.py

Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Prisma setup complete!" -ForegroundColor Green
    Write-Host "  Tables created/updated on your Neon database."
    Write-Host "  Test users seeded (admin/farmer/customer)."
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "There were errors. Check the output above." -ForegroundColor Red
    Write-Host ""
}
