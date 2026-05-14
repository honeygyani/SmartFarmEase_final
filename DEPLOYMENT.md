# SmartFarmEase Deployment Plan

This repo is prepared for a Render demo deployment without the 13.8 GB price forecasting model folder.

## What We Will Deploy

- React frontend as a Render Static Site.
- Main FastAPI backend as a Render Web Service.
- Small ML APIs as separate Render Web Services:
  - Disease detection
  - Crop recommendation
  - Fertilizer prediction
  - Sowing window

## What We Will Not Deploy

- `models/Price Forecasting/` is intentionally ignored because it is 13.8 GB and has 30,000+ files. Price forecast UI will simply not show forecast rows when the price service is disabled.

## Required Access

1. A GitHub repository for this project.
2. Render connected to that GitHub repository.
3. Neon database URL added as `DATABASE_URL` in the Render backend service.

Do not commit `.env` files or database passwords. Set secrets only in Render Dashboard.

## Render Environment Values

After the services are created, copy each deployed service URL into the matching env var:

- Frontend `REACT_APP_API_URL`: `https://smartfarmease-backend.onrender.com/api/v1`
- Backend `DATABASE_URL`: Neon pooled Postgres URL
- Backend `AI_DISEASE_URL`: `https://smartfarmease-disease.onrender.com`
- Backend `AI_CROP_REC_URL`: `https://smartfarmease-crop.onrender.com`
- Backend `AI_FERTILIZER_URL`: `https://smartfarmease-fertilizer.onrender.com`
- Backend `AI_SOWING_URL`: `https://smartfarmease-sowing-window.onrender.com`
- Backend `AI_PRICE_URL`: `https://price-forecasting-disabled.invalid`

## Deployment Steps

1. Initialize Git if needed:
   ```powershell
   git init
   git add .
   git commit -m "Prepare Render deployment"
   ```

2. Create a GitHub repo and push:
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

3. Open Render Blueprint:
   ```text
   https://dashboard.render.com/blueprint/new
   ```

4. Select the GitHub repo. Render will read `render.yaml`.

5. Fill all `sync: false` values in the dashboard.

6. After the backend deploys, confirm:
   ```text
   https://smartfarmease-backend.onrender.com/health
   ```

## Notes

- Render free services spin down after inactivity, so the first request during the panel demo can take about a minute.
- For the actual presentation, open every Render service URL once before the panel starts to warm them up.
- If disease or sowing services fail on free memory, upgrade only that service to a paid starter instance for the demo day.
