# 🛠️ SmartFarmEase: Technical Deep-Dive

Welcome to the internal workings of **SmartFarmEase**. This document is designed for a new developer to understand the "What, How, and Why" behind every major and minor decision in this project.

---

## 1. High-Level Architecture
SmartFarmEase isn't a single "app"—it's an **orchestrated ecosystem**.

### **The "Why" behind Microservices**
You might wonder: *Why run 6 different Python servers?*
1. **Dependency Hell**: Disease Detection needs TensorFlow 2.15 (which requires Python 3.10). Price Forecasting needs Prophet (which can be picky about C++ compilers). By isolating them, we prevent one library's requirements from breaking another service.
2. **Resource Management**: CNN models (Disease) are heavy on RAM. Random Forest models (Crop) are light. Microservices let us scale them independently.
3. **Port Isolation**: 
   - `:8000`: Core Business Logic
   - `:8001` - `:8005`: AI specialized logic

---

## 2. Frontend: The "Premium" Experience
The UI is built with **React 19** and **MUI (Material UI)**.

### **🎨 Theme & Aesthetics**
- **Tokens over Hex**: We never use `#000000` or `white`. We use `theme.palette.background.paper` or `theme.palette.primary.main`. This allows the "Dark/Light Mode" toggle to work instantly across the entire app.
- **Glassmorphism**: The Navbar uses `backdropFilter: 'blur(20px)'` to give a premium, modern feel.
- **Micro-animations**: We use **Framer Motion** for subtle entrance animations on cards and buttons.

### **🔐 Auth & Protected Routes**
- **AuthContext**: A React Context that stores the JWT token and user profile globally.
- **ProtectedRoute**: A wrapper component that checks the user's role. If a customer tries to access `/crop-recommendation`, they are redirected.

---

## 3. Backend: The Lean Proxy
The FastAPI backend acts as the "Brain" and "Traffic Controller."

### **💎 Prisma ORM**
We use **Prisma** instead of SQLAlchemy because:
- **Auto-completion**: It provides a fully typed client.
- **Schema-first**: The `schema.prisma` is the single source of truth for the database structure.
- **Migrations**: `prisma db push` makes syncing the DB during development incredibly fast.

### **🛰️ AI Gateway Pattern**
The backend doesn't run ML models. It uses the `httpx` library to forward your request to the specific AI microservice on ports 8001-8005, waits for the result, and passes it back to the frontend. This keeps the main backend fast and responsive.

---

## 4. The AI Microservices (The "Tiny" Details)

### **🌾 Crop Recommendation**
- **The Model**: Random Forest (chosen for its high accuracy with tabular soil data).
- **Explainability (SHAP)**: We don't just say "Grow Rice." We use SHAP values to tell the farmer *why* (e.g., "High rainfall was the top factor").
- **Counterfactuals (DiCE)**: A "What-If" engine. It shows the farmer how much they would need to change their Nitrogen or pH levels to get a different, potentially more profitable crop.

### **🐛 Disease Detection**
- **CNN**: A Convolutional Neural Network classifies the image into 38 categories (e.g., "Tomato Early Blight").
- **Severity Logic**: After classification, we use **OpenCV** to mask the "healthy" green parts vs. the "diseased" spots. The ratio of these pixels gives us a 0-100% severity score.

### **💰 Price Forecasting**
- **Prophet**: Used for its ability to handle seasonality in agricultural prices (prices go up/down during harvest/sowing).
- **Ensemble**: We average the results of Prophet, Random Forest, and XGBoost to minimize the error margin.

### **📅 Sowing Window**
- **Why?**: Traditional calendars are failing due to climate change.
- **How**: It uses an ensemble of gradient boosting models and a **CNN-LSTM** (Long Short-Term Memory) network to analyze time-series weather patterns and find the "sweet spot" for sowing.

---

## 5. Marketplace Logic: The Farmer Lobby System

The marketplace uses a **Lobby-based Sourcing model** where farmers and customers collaborate, but individual transactions remain independent.

### **🛒 Customer-Side Workflows**
1. **Sourcing Requests**:
   - A customer creates a **Market Request** (e.g., "I need 1000kg of Rice").
   - This opens a **Lobby**. Farmers who have Rice can see this lobby and "join" it.
2. **The "Lobby Marketplace" View**:
   - Unlike a standard store, the customer doesn't see a single "Wheat" product. They see **independent cards for every farmer** who joined the lobby.
   - Each card displays the specific farmer's name, their contribution quantity (e.g., 200kg), and their specific bid price.
3. **Selective Buying**:
   - The customer can choose to buy from **Farmer A** but not **Farmer B**, even if they are in the same lobby.
   - **Logic**: Clicking "Buy / Order" on a specific farmer's card triggers a `direct-buy` for that specific contribution.

### **👩‍🌾 Farmer-Side Workflows**
1. **Publishing to Lobby**:
   - Farmers can browse open sourcing requests and contribute a portion of their inventory.
   - Alternatively, a farmer can "Publish to Marketplace" independently. This creates a "solo lobby" where they are the only contributor until others join.
2. **Independent Pricing**:
   - Every farmer sets their own `price_bid` for their contribution. This allows competitive pricing within the same sourcing request.
3. **Inventory Sync**:
   - **Logic**: When a farmer joins a lobby, their inventory is not "deleted." It is marked as `available` in the lobby. Only when a customer actually buys it does the status change to `sold` and the inventory quantity is permanently deducted.

### **📦 Order Lifecycle & Direct-Buy**
- **Direct-Buy Logic**: When a customer selects a specific farmer's contribution, the system creates an `Order` specifically for that pairing. 
- The lobby remains open for other farmers to continue selling their remaining stock to other customers (or the same customer again).
- **Statuses**: `created` → `paid` → `packed` → `dispatched` → `shipped` → `delivered`.

---

## 6. Developer Workflow Shortcuts
- **`starter.ps1`**: A complex script that opens 7 terminals and sets the correct environment variables for each.
- **`setup_venvs.ps1`**: Automates the creation of 6 virtual environments. This is crucial because `venv_CD` needs a specific version of protobuf, while `venv_CR` might need a different one.

---

## 7. Troubleshooting Tip for Newbies
If the UI shows a result but the charts are missing:
- Check the **Market Outlook** dates. If they are in 2025, it means the model was trained on data up to late 2024. This is a "training window" limitation, not a bug!

---

*Now you know the "Tiny Things" that make SmartFarmEase work!*
