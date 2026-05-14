# ================================================================
#  SmartFarmEase - Full Application Launcher
#  Run from the MajorProject root directory:
#    .\starter.ps1
# ================================================================

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   SmartFarmEase - Application Launcher   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $ROOT_DIR) { $ROOT_DIR = Get-Location }

# ----------------------------------------------------------------
# 1/3  AI Microservices  (ports 8001-8005)
# ----------------------------------------------------------------
Write-Host "[1/3] Starting AI Microservices..." -ForegroundColor Yellow

# Disease Detection (port 8001)
Write-Host "  -> Disease Detection         :8001"
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT_DIR\server_files'; & '$ROOT_DIR\venv_CD\Scripts\python.exe' -m uvicorn server_CD:app --port 8001 --host 127.0.0.1"

# Crop Recommendation (port 8002)
Write-Host "  -> Crop Recommendation       :8002"
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT_DIR\server_files'; & '$ROOT_DIR\venv_CR\Scripts\python.exe' -m uvicorn server_CR:app --port 8002 --host 127.0.0.1"

# Fertilizer Prediction (port 8003)
Write-Host "  -> Fertilizer Prediction     :8003"
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT_DIR\server_files'; & '$ROOT_DIR\venv_FS\Scripts\python.exe' -m uvicorn server_FS:app --port 8003 --host 127.0.0.1"

# Price Forecasting (port 8004)
Write-Host "  -> Price Forecasting         :8004"
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT_DIR\server_files'; & '$ROOT_DIR\venv_PF\Scripts\python.exe' -m uvicorn server_PF:app --port 8004 --host 127.0.0.1"

# Sowing Window (port 8005)
Write-Host "  -> Sowing Window             :8005"
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT_DIR\server_files'; & '$ROOT_DIR\venv_SW\Scripts\python.exe' -m uvicorn server_SW:app --port 8005 --host 127.0.0.1"

Write-Host ""
Write-Host "  Waiting 8s for models to load..." -ForegroundColor DarkGray
Start-Sleep -Seconds 8

# ----------------------------------------------------------------
# 2/3  Backend API  (port 8000)
# ----------------------------------------------------------------
Write-Host "[2/3] Starting Backend API on port 8000..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT_DIR\backend'; & '$ROOT_DIR\venv_backend\Scripts\python.exe' -m uvicorn app.main:app --port 8000 --host 127.0.0.1 --reload"

Write-Host "  Waiting 5s for backend to start..." -ForegroundColor DarkGray
Start-Sleep -Seconds 5

# ----------------------------------------------------------------
# 3/3  Frontend React Dev Server  (port 3000)
# ----------------------------------------------------------------
Write-Host "[3/3] Starting Frontend on port 3000..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT_DIR\frontend'; npm start"

# ----------------------------------------------------------------
# Summary
# ----------------------------------------------------------------
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "   All services launched!                 " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  AI Microservices:" -ForegroundColor White
Write-Host "    Disease Detection      http://127.0.0.1:8001/docs"
Write-Host "    Crop Recommendation    http://127.0.0.1:8002/docs"
Write-Host "    Fertilizer Prediction  http://127.0.0.1:8003/docs"
Write-Host "    Price Forecasting      http://127.0.0.1:8004/docs"
Write-Host "    Sowing Window          http://127.0.0.1:8005/docs"
Write-Host ""
Write-Host "  Backend API:             http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  Frontend App:            http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  Close all spawned PowerShell windows to stop." -ForegroundColor DarkGray
Write-Host ""
