# SmartFarmEase Application Launcher
# This script starts the entire ecosystem (AI Microservices, Backend, and Frontend) sequentially.

Write-Host "--- SmartFarmEase Local Launcher ---" -ForegroundColor Cyan

$ROOT_DIR = Get-Location

# 1. Start AI Microservices (Each in its own venv)
Write-Host "[1/3] Starting AI Microservices (8001-8004)..." -ForegroundColor Yellow

# Disease Detection (venv_CD)
Write-Host "Starting Disease Detection on port 8001..."
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\server_files'; & '$ROOT_DIR\venv_CD\Scripts\python.exe' -m uvicorn server_CD:app --port 8001 --host 127.0.0.1" -WindowStyle Normal

# Crop Recommendation (venv_CR)
Write-Host "Starting Crop Recommendation on port 8002..."
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\server_files'; & '$ROOT_DIR\venv_CR\Scripts\python.exe' -m uvicorn server_CR:app --port 8002 --host 127.0.0.1" -WindowStyle Normal

# Fertilizer Prediction (venv_FS)
Write-Host "Starting Fertilizer Prediction on port 8003..."
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\server_files'; & '$ROOT_DIR\venv_FS\Scripts\python.exe' -m uvicorn server_FS:app --port 8003 --host 127.0.0.1" -WindowStyle Normal

# Price Forecasting (venv_PF)
Write-Host "Starting Price Forecasting on port 8004..."
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\server_files'; & '$ROOT_DIR\venv_PF\Scripts\python.exe' -m uvicorn server_PF:app --port 8004 --host 127.0.0.1" -WindowStyle Normal

Start-Sleep -Seconds 5

# 2. Start Backend (venv_backend)

Start-Sleep -Seconds 5


