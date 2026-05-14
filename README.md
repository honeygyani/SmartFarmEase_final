# 🌾 SmartFarmEase

**An AI-powered agricultural platform** that helps Indian farmers grow smarter using machine-learning diagnostics, and connects them directly with buyers through an integrated marketplace with lobby-based collective bargaining.

---

## Table of Contents

- [What Does This App Do?](#what-does-this-app-do)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Setup Guide (First Time)](#setup-guide-first-time)
- [Running the Application](#running-the-application)
- [How the App Works (User Walkthrough)](#how-the-app-works-user-walkthrough)
- [Feature Deep-Dive](#feature-deep-dive)
- [API Reference](#api-reference)
- [Test Credentials](#test-credentials)
- [Troubleshooting](#troubleshooting)
- [Tech Stack](#tech-stack)

---

## What Does This App Do?

SmartFarmEase is a full-stack web application built for the Indian agricultural ecosystem. It serves two types of users:

| Role | What they can do |
|------|-----------------|
| **Farmer** | Get AI-powered crop recommendations, detect plant diseases from leaf photos, receive fertilizer suggestions, check optimal sowing windows, forecast commodity prices, manage crop inventory, join lobbies to collectively sell produce |
| **Customer** | Browse farmer inventories, create sourcing requests for specific commodities, negotiate prices through proposals to farmer lobbies, track orders from creation to delivery |

The platform runs **5 independent AI microservices** behind a single FastAPI backend, with a React frontend providing a premium SaaS UI (supporting both dark and light modes) and a multi-language translation widget.

---

## Architecture Overview

```
┌─────────────────────┐       ┌────────────────────┐       ┌────────────────────────────────────┐
│     React SPA       │       │   FastAPI Backend   │       │       AI Microservices              │
│    (port 3000)      │──────▶│    (port 8000)      │──────▶│                                    │
│                     │       │                     │       │  🐛 Disease Detection   (port 8001) │
│  • MUI 7 + Emotion  │       │  • Prisma ORM       │       │  🌾 Crop Recommendation (port 8002) │
│  • React Router 7   │       │  • JWT Auth          │       │  🧪 Fertilizer Predict. (port 8003) │
│  • Framer Motion    │       │  • CORS Middleware   │       │  💰 Price Forecasting   (port 8004) │
│  • Axios            │       │  • httpx proxying    │       │  📅 Sowing Window       (port 8005) │
│  • Google Translate  │       │                     │       │                                    │
└─────────────────────┘       └─────────┬──────────┘       └────────────────────────────────────┘
                                        │
                               ┌────────▼──────────┐
                               │   PostgreSQL DB    │
                               │  (Neon Cloud or    │
                               │   Local Instance)  │
                               └───────────────────┘
```

**How the layers talk to each other:**

1. The **React frontend** sends all requests to the **FastAPI backend** at `localhost:8000/api/v1/...`
2. The **backend** handles auth, database operations, and proxies AI requests to the appropriate microservice
3. Each **AI microservice** loads its own ML model at startup and exposes prediction endpoints via FastAPI
4. The **database** (PostgreSQL) stores users, inventory, market requests, lobbies, proposals, votes, orders, and health logs

---

## Prerequisites

Install these **before** you begin setup:

| Tool | Version | Why You Need It | Download |
|------|---------|-----------------|----------|
| **Python** | 3.10.x (exactly) | AI models and backend require Python 3.10 | [python.org](https://www.python.org/downloads/release/python-31011/) |
| **Node.js** | 18 or newer | React frontend build tooling | [nodejs.org](https://nodejs.org/) |
| **PostgreSQL** | 14+ | Application database | Local install **or** free cloud via [Neon](https://neon.tech/) |
| **Git** | any | Clone the repository | [git-scm.com](https://git-scm.com/) |

> [!IMPORTANT]
> **Python 3.10 specifically** — TensorFlow 2.15.1 (used by Disease Detection) does not support Python 3.12+. Use exactly Python 3.10.x.

> [!NOTE]
> **Windows only:** PowerShell script execution must be enabled.
> Run this in an **admin** PowerShell if scripts won't execute:
> ```powershell
> Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

---

## Project Structure

```
MajorProject/
│
├── frontend/                        # React Single-Page Application
│   ├── public/
│   └── src/
│       ├── pages/                   # Page components
│       │   ├── Home.js              #   Landing page (public)
│       │   ├── Login.js             #   JWT login form
│       │   ├── Register.js          #   Registration form
│       │   ├── FarmerHome.js        #   Farmer command center (post-login home)
│       │   ├── FarmerDashboard.js   #   Farmer marketplace + inventory management
│       │   ├── CustomerHome.js      #   Customer command center (post-login home)
│       │   ├── CustomerDashboard.js #   Customer marketplace + lobbies + proposals
│       │   ├── CropRecommendation.js #  AI: crop recommendation + explainability
│       │   ├── DiseaseDetection.js  #   AI: leaf disease + severity detection
│       │   ├── FertilizerPrediction.js # AI: fertilizer suggestion
│       │   ├── SowingWindow.js      #   AI: optimal sowing date prediction
│       │   └── MyOrders.js          #   Order lifecycle tracking
│       ├── components/
│       │   ├── Navbar.js            #   Top navigation bar (role-aware)
│       │   ├── ProtectedRoute.js    #   Role-based route guard
│       │   ├── GoogleTranslate.js   #   Floating multi-language translate widget
│       │   └── MotionWrappers.js    #   Framer Motion animation helpers
│       ├── contexts/
│       │   ├── AuthContext.js       #   JWT token management & user state
│       │   └── ColorModeContext.js  #   Dark/light theme toggle
│       ├── services/
│       │   └── api.js               #   Axios instance (base URL, auth interceptor)
│       └── theme.js                 #   MUI theme definition (dark/light)
│
├── backend/                         # FastAPI + Prisma ORM Backend
│   ├── app/
│   │   ├── main.py                  #   App entry point, router registration, CORS
│   │   ├── core/                    #   Config (env vars), security (JWT), dependencies
│   │   ├── db/                      #   Prisma client session
│   │   └── domains/                 #   Feature modules:
│   │       ├── auth/                #     Login, register, token refresh
│   │       ├── ai_gateway/          #     Proxy layer to AI microservices
│   │       ├── inventory/           #     CRUD for farmer crop inventory
│   │       ├── marketplace/         #     Market requests, direct purchases
│   │       ├── lobby/               #     Lobbies, contributions, proposals, votes
│   │       ├── sowing_window/       #     Sowing window proxy
│   │       └── event_logs/          #     System event logging
│   ├── schema.prisma                #   Database schema (10 models)
│   ├── seed.py                      #   Seed script (test users + sample data)
│   ├── .env.example                 #   Environment variable template
│   └── requirements.txt             #   Backend Python dependencies
│
├── server_files/                    # AI Microservice Servers (one per model)
│   ├── server_CD.py                 #   Disease Detection (TensorFlow CNN) — port 8001
│   ├── server_CR.py                 #   Crop Recommendation (Random Forest + SHAP + DiCE) — port 8002
│   ├── server_FS.py                 #   Fertilizer Prediction (ensemble) — port 8003
│   ├── server_PF.py                 #   Price Forecasting (time-series) — port 8004
│   ├── server_SW.py                 #   Sowing Window (ensemble) — port 8005
│   └── severity.py                  #   Severity scoring helper for Disease Detection
│
├── models/                          # Trained ML model files (.h5, .pkl, .pt)
│   ├── Crop Recommendation/         #   Random Forest pipeline + label encoder
│   ├── Disease Detection/           #   Keras CNN + categories.json
│   ├── Fertilizer Prediction/       #   Ensemble model
│   └── Price Forecasting/           #   Per-commodity time-series models
│
├── requirements_CD.txt              # Python deps for Disease Detection venv
├── requirements_CR.txt              # Python deps for Crop Recommendation venv
├── requirements_FS.txt              # Python deps for Fertilizer Prediction venv
├── requirements_PF.txt              # Python deps for Price Forecasting venv
├── requirements_SW.txt              # Python deps for Sowing Window venv
│
├── setup_venvs.ps1                  # 🔧 Creates all 6 virtual environments + installs deps
├── setup_prisma.ps1                 # 🔧 Generates Prisma client + pushes schema + seeds DB
├── starter.ps1                      # 🚀 Launches all 7 services in separate terminals
└── README.md                        # ← You are here
```

---

## Setup Guide (First Time)

Follow these steps **in order** on a fresh clone. The entire setup takes ~10–15 minutes.

### Step 1 — Clone the Repository

```bash
git clone <your-repo-url>
cd MajorProject
```

### Step 2 — Set Up the Database

You have two options:

**Option A — Neon (free cloud PostgreSQL, recommended for quick setup):**
1. Create a free account at [neon.tech](https://neon.tech/)
2. Create a new project and database
3. Copy the connection string (it looks like `postgresql://user:pass@host/dbname?sslmode=require`)

**Option B — Local PostgreSQL:**
1. Install PostgreSQL 14+
2. Create a database: `CREATE DATABASE smartfarmease;`

### Step 3 — Configure Environment Variables

```powershell
# Copy the template
Copy-Item backend\.env.example backend\.env
```

Edit `backend\.env` with your database credentials:

```env
# General
PROJECT_NAME="SmartFarmEase Backend"
ENVIRONMENT=development
SECRET_KEY=pick-a-strong-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database — replace with YOUR connection string
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/smartfarmease

# If using Neon, your URL will look like:
# DATABASE_URL=postgresql://user:pass@ep-xyz-pooler.region.aws.neon.tech/neondb?sslmode=require

# AI Service URLs (leave as-is for local development)
AI_DISEASE_URL=http://localhost:8001
AI_CROP_REC_URL=http://localhost:8002
AI_FERTILIZER_URL=http://localhost:8003
AI_PRICE_URL=http://localhost:8004
AI_SOWING_URL=http://localhost:8005
```

### Step 4 — Set Your Python 3.10 Path

Open `setup_venvs.ps1` and edit line 15 to point to **your** Python 3.10 installation:

```powershell
# Change this to YOUR Python 3.10 path:
$PYTHON = "C:\Users\<your-username>\AppData\Local\Programs\Python\Python310\python.exe"
```

> [!TIP]
> Not sure where Python is installed? Run `where python` or `py -3.10 -c "import sys; print(sys.executable)"` in your terminal.

### Step 5 — Create All Virtual Environments + Install Dependencies

```powershell
.\setup_venvs.ps1
```

This script will:
- Create **6 isolated virtual environments** (`venv_CD`, `venv_CR`, `venv_FS`, `venv_PF`, `venv_SW`, `venv_backend`)
- Install all Python dependencies for each service from its own `requirements_*.txt`
- Generate the Prisma client from `schema.prisma`
- Push the database schema to your PostgreSQL instance (creates all tables)

> [!NOTE]
> This step takes a few minutes because it installs TensorFlow, PyTorch, and other large ML libraries. Be patient.

### Step 6 — Seed the Database with Test Data

```powershell
cd backend
..\venv_backend\Scripts\python.exe seed.py
cd ..
```

This creates **3 test users** (admin, farmer, customer) — see [Test Credentials](#test-credentials).

> [!TIP]
> You can also run `.\setup_prisma.ps1` instead — it generates the Prisma client, pushes the schema, **and** seeds the database all in one command.

### Step 7 — Install Frontend Dependencies

```powershell
cd frontend
npm install
cd ..
```

### Step 8 — You're Done! 🎉

Jump to [Running the Application](#running-the-application) to start everything up.

---

## Running the Application

### 🚀 One-Command Launch (Recommended)

From the project root:

```powershell
.\starter.ps1
```

This opens **7 separate PowerShell windows**, one for each service:

| Window | Service | Port | Startup Time |
|--------|---------|------|-------------|
| 1 | Disease Detection (CNN) | 8001 | ~5–10s |
| 2 | Crop Recommendation (RF + SHAP) | 8002 | ~3–5s |
| 3 | Fertilizer Prediction | 8003 | ~2–3s |
| 4 | Price Forecasting | 8004 | ~2–3s |
| 5 | Sowing Window | 8005 | ~2–3s |
| 6 | Backend API | 8000 | ~2s |
| 7 | Frontend (React) | 3000 | ~5–8s |

Wait **~20 seconds** for everything to spin up, then open:

### 👉 **http://localhost:3000**

### Manual Launch (Advanced)

If you prefer to run each service individually, open **7 separate terminals** from the project root:

```powershell
# Terminal 1 — Disease Detection
Set-Location server_files; ..\venv_CD\Scripts\python.exe -m uvicorn server_CD:app --port 8001

# Terminal 2 — Crop Recommendation
Set-Location server_files; ..\venv_CR\Scripts\python.exe -m uvicorn server_CR:app --port 8002

# Terminal 3 — Fertilizer Prediction
Set-Location server_files; ..\venv_FS\Scripts\python.exe -m uvicorn server_FS:app --port 8003

# Terminal 4 — Price Forecasting
Set-Location server_files; ..\venv_PF\Scripts\python.exe -m uvicorn server_PF:app --port 8004

# Terminal 5 — Sowing Window
Set-Location server_files; ..\venv_SW\Scripts\python.exe -m uvicorn server_SW:app --port 8005

# Terminal 6 — Backend API
Set-Location backend; ..\venv_backend\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload

# Terminal 7 — Frontend
Set-Location frontend; npm start
```

### Stopping the App

- **If using `starter.ps1`:** Close all the spawned PowerShell windows
- **If running manually:** Press `Ctrl+C` in each terminal

---

## How the App Works (User Walkthrough)

### For a Farmer

```
1. Register → choose "Farmer" role
2. Login → lands on Farmer Home (command center)
       │
       ├──→ 🌾 Crop Recommendation
       │         Enter soil data (N, P, K, pH, temp, humidity, rainfall)
       │         → Get top 5 crop suggestions with probability scores
       │         → See SHAP-based explanations of WHY each crop was recommended
       │         → View price forecasts (Market Outlook) for each recommended crop
       │         → "Test Values" button cycles through 3 different agricultural scenarios
       │         → Explore "what-if" counterfactuals (change inputs to get a different crop)
       │
       ├──→ 🐛 Disease Detection
       │         Upload a photo of a crop leaf
       │         → CNN identifies the disease (38 classes)
       │         → Severity score calculated via color analysis
       │         → Treatment suggestions provided
       │
       ├──→ 🧪 Fertilizer Recommendation
       │         Input soil type, crop type, and N/P/K levels
       │         → Model predicts the best fertilizer
       │         → "Test Values" button cycles through 3 different soil scenarios
       │
       ├──→ 📅 Sowing Window
       │         Select crop and region
       │         → Ensemble model predicts optimal sowing dates
       │         → "Test Values" button cycles through 3 different regional scenarios
       │
       ├──→ 📦 Inventory Management (via Farmer Dashboard)
       │         Add/edit/delete crop listings (commodity, quantity, price, unit)
       │         → Inventory visible to customers on the marketplace
       │
       └──→ 🤝 Lobbies (via Farmer Dashboard)
               View open lobbies for your commodity
               → Contribute your stock to a lobby
               → Vote on customer price proposals (accept/reject)
               → If majority accepts → order is created
```

### For a Customer

```
1. Register → choose "Customer" role
2. Login → lands on Customer Home (command center)
       │
       ├──→ 🛒 Browse Marketplace (via Customer Dashboard)
       │         See all farmer inventory listings
       │         → Purchase directly at listed price
       │
       ├──→ 📋 Create Sourcing Requests
       │         Specify commodity, target quantity, target price
       │         → A lobby is automatically created
       │         → Farmers can contribute their stock
       │
       ├──→ 💬 Send Proposals to Lobbies
       │         Once a lobby has enough farmer contributions
       │         → Submit a price proposal with notes
       │         → Farmers vote to accept/reject
       │         → If accepted → order is created automatically
       │
       └──→ 📦 My Orders
               Track order lifecycle:
               Created → Paid → Packed → Dispatched → Shipped → Delivered
```

---

## Feature Deep-Dive

### 🔐 Authentication & Authorization
- JWT-based login with access tokens (30 min) and refresh tokens (7 days)
- Three roles: **farmer**, **customer**, **admin** (admin can access everything)
- Protected routes enforce role checks on both frontend and backend
- Passwords hashed with bcrypt

### 🌾 Crop Recommendation (AI)
- **Model:** Random Forest pipeline trained on 2,200+ samples across 22 crops
- **Explainability:** SHAP (SHapley Additive exPlanations) shows which input features most influenced each prediction
- **Counterfactuals:** DiCE generates "what-if" scenarios — shows what input changes would lead to a different crop
- **Price Integration:** Automatically fetches 6-month price forecasts for each recommended crop from the Price Forecasting service
- **Inputs:** Nitrogen (N), Phosphorus (P), Potassium (K), temperature, humidity, pH, rainfall

### 🐛 Disease Detection (AI)
- **Model:** TensorFlow/Keras CNN (224×224 input, 38 disease classes)
- **Severity:** Custom OpenCV-based color analysis estimates disease severity percentage
- **Two endpoints:** `/predict/disease` (disease only) and `/predict/disease_severity` (disease + severity)
- **Input:** Upload a crop leaf photo (JPEG/PNG)

### 🧪 Fertilizer Recommendation (AI)
- **Model:** Ensemble classifier
- **Inputs:** Soil type, crop type, nitrogen, phosphorus, potassium levels
- **Output:** Recommended fertilizer name

### 📅 Sowing Window Predictor (AI)
- **Model:** Ensemble of XGBoost, LightGBM, CatBoost, and a PyTorch CNN-LSTM
- **Inputs:** Crop name, state, district
- **Output:** Optimal sowing start and end dates based on historical weather patterns

### 💰 Price Forecasting (AI)
- **Model:** Per-commodity time-series models (Prophet, Random Forest, XGBoost)
- **Input:** Commodity name, state, district, months ahead
- **Output:** Monthly price series forecast
- **Data Window:** Forecasts are generated starting from the model's training end date (e.g., September 2025 onwards).

### 🏪 Marketplace & Inventory
- Farmers create inventory listings with commodity name, quantity, price per unit, and unit
- Customers browse all available listings and can purchase directly
- Inventory has status tracking: `available` → `committed` → `sold`

### 👥 Lobby System (Collective Bargaining)
- Customer creates a sourcing request (e.g., "200 kg Wheat at ₹22/kg")
- A lobby is automatically created for that request
- Multiple farmers contribute their stock to the lobby
- Customer sends a price proposal to the lobby
- Farmers vote (majority rules) to accept or reject
- Accepted proposals become orders automatically

### 📦 Order Lifecycle
Full status tracking: `created` → `paid` → `packed` → `dispatched` → `shipped` → `delivered`
- Customers can rate and leave feedback on delivered orders

### 🌐 Multi-Language Support
- Google Translate widget available on every page (floating button, bottom-right)
- Supports: **English, Hindi, Bengali, Marathi, Malayalam, Tamil, Telugu**, and more
- Language selection persists across sessions

### 🌓 Dark / Light Mode
- Toggle between dark and light themes from the navbar
- All components are fully theme-aware using MUI theme tokens

---

## API Reference

All backend endpoints are auto-documented via **Swagger UI**. After starting the app, visit:

| Service | Swagger URL |
|---------|-------------|
| **Backend API** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| Disease Detection | [http://localhost:8001/docs](http://localhost:8001/docs) |
| Crop Recommendation | [http://localhost:8002/docs](http://localhost:8002/docs) |
| Fertilizer Prediction | [http://localhost:8003/docs](http://localhost:8003/docs) |
| Price Forecasting | [http://localhost:8004/docs](http://localhost:8004/docs) |
| Sowing Window | [http://localhost:8005/docs](http://localhost:8005/docs) |

### Key Backend Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Login, returns JWT tokens |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `GET` | `/api/v1/auth/me` | Get current user profile |
| `POST` | `/api/v1/ai/crop-recommendation` | Proxy to Crop Recommendation AI |
| `POST` | `/api/v1/ai/disease-detection` | Proxy to Disease Detection AI |
| `POST` | `/api/v1/ai/fertilizer` | Proxy to Fertilizer Prediction AI |
| `POST` | `/api/v1/ai/price-forecast` | Proxy to Price Forecasting AI |
| `GET/POST` | `/api/v1/inventory/...` | CRUD operations on farmer inventory |
| `GET/POST` | `/api/v1/marketplace/...` | Market requests and direct purchases |
| `GET/POST` | `/api/v1/lobby/...` | Lobby management, contributions, proposals, votes |
| `GET/POST` | `/api/v1/sowing-window/...` | Sowing window predictions |

---

## Test Credentials

After running the seed script, these accounts are available:

| Role | Email | Password | What You Can Access |
|------|-------|----------|-------------------|
| **Admin** | `admin@smartfarmease.com` | `admin1234` | Everything (farmer + customer views) |
| **Farmer** | `farmer@smartfarmease.com` | `farmer1234` | AI tools, inventory, lobbies |
| **Customer** | `customer@smartfarmease.com` | `customer1234` | Marketplace, requests, proposals, orders |

---

## Troubleshooting

### ❌ `setup_venvs.ps1` fails with "Python not found"
- Open `setup_venvs.ps1` and verify the `$PYTHON` path on line 15 points to your Python 3.10 executable
- Run `where python` or `py --list-paths` to find your Python installations

### ❌ Scripts won't run — "execution policy" error
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ Prisma errors during setup
- Make sure `DATABASE_URL` in `backend\.env` is correct and the database is reachable
- For Neon: ensure `?sslmode=require` is in the connection string
- Try running Prisma manually:
  ```powershell
  cd backend
  ..\venv_backend\Scripts\python.exe -m prisma generate
  ..\venv_backend\Scripts\python.exe -m prisma db push
  ```

### ❌ TensorFlow won't install / crashes
- TensorFlow 2.15.1 requires **Python 3.10.x** — Python 3.12+ is NOT supported
- On Windows, make sure you have the [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist) installed

### ❌ Port already in use
- Another process is using one of the ports (8000–8005 or 3000)
- Find and kill it:
  ```powershell
  netstat -ano | findstr :8001
  taskkill /PID <pid> /F
  ```

### ❌ AI service returns 500 errors
- Check that the model files exist in the `models/` directory
- Ensure the corresponding AI microservice terminal shows "Model loaded!" on startup
- Each AI service must be running before the backend can proxy requests to it

### ❌ Frontend shows "Network Error"
- Make sure the backend is running on port 8000
- Check `frontend/src/services/api.js` — the base URL should be `http://localhost:8000/api/v1`

### ❌ Database connection refused
- Verify PostgreSQL is running (locally or on Neon)
- Check `backend\.env` — the `DATABASE_URL` must match your actual database connection string
- For local PostgreSQL: ensure the database `smartfarmease` exists

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, MUI 7, Emotion, Framer Motion | UI framework, design system, animations |
| **Routing** | React Router 7 | Client-side navigation |
| **HTTP Client** | Axios | API calls with JWT interceptors |
| **Translation** | Google Translate widget | Multi-language support |
| **Backend** | FastAPI, Uvicorn | Async Python web framework |
| **ORM** | Prisma Client Python | Type-safe database queries |
| **Auth** | python-jose (JWT), passlib (bcrypt) | Token-based authentication |
| **Database** | PostgreSQL (Neon-compatible) | Relational data storage |
| **Disease Detection** | TensorFlow 2.15, Keras, OpenCV | CNN image classification + severity |
| **Crop Recommendation** | scikit-learn, SHAP, DiCE | Random Forest + explainability |
| **Fertilizer Prediction** | scikit-learn, treeinterpreter | Ensemble classification |
| **Price Forecasting** | pandas, joblib | Time-series commodity price models |
| **Sowing Window** | XGBoost, LightGBM, CatBoost, PyTorch | Ensemble + CNN-LSTM |
| **Infra** | PowerShell scripts, Python venvs | Automated setup and launch |

---

## Database Schema

The app uses **10 database models** managed by Prisma:

| Model | Purpose |
|-------|---------|
| `User` | Authentication, roles (farmer/customer/admin) |
| `Inventory` | Farmer crop listings (commodity, qty, price) |
| `MarketRequest` | Customer sourcing requests |
| `Lobby` | Collective selling groups linked to market requests |
| `Contribution` | Individual farmer contributions to a lobby |
| `Proposal` | Customer price proposals to a lobby |
| `ProposalVote` | Farmer votes on proposals (accept/reject) |
| `Order` | Purchase orders with lifecycle status tracking |
| `LobbyMessage` | In-lobby communication |
| `HealthTrendLog` | AI service usage audit logs |
| `SystemEvent` | General system event tracking |

---

*Built with ❤️ for Indian farmers.*
