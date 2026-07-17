# AI Loan Eligibility Prediction System

An institutional-grade, production-ready AI-powered web application that evaluates borrower retail loan applications using machine learning risk-classification models. The application features JWT authentication, interactive borrower dashboards, dynamic charts, a local financial AI chatbot, custom printable PDF credit reports, and a comprehensive administrative portal with database status overrides and CSV exports.

---

## 🏗️ Project Architecture

```
nagaraju project/
├── backend/
│   ├── app/
│   │   ├── api/          # Rest API routes (auth, loans, admin)
│   │   ├── core/         # Config, Database setup (SQLite/SQLAlchemy), JWT Security
│   │   ├── models/       # Database schemas (User, LoanApplication)
│   │   ├── schemas/      # Input validation & output schemas (Pydantic)
│   │   └── utils/        # AI predictions, Explainable AI reasons, Local Chatbot
│   ├── dataset/          # Stored Kaggle training dataset CSV
│   ├── models/           # Stored serialized ML model bundle (.joblib & .json)
│   ├── scripts/          # ML Pipeline training & evaluation scripts
│   ├── requirements.txt  # Python package specifications
│   └── main.py           # FastAPI entrypoint
├── frontend/
│   ├── public/           # Static asset assets
│   ├── src/
│   │   ├── components/   # Dashboard wrapper, UI modules
│   │   ├── context/      # AuthState, DarkTheme state management
│   │   ├── pages/        # Landing Page, Login, Register, Dashboard, Form, Result, Admin
│   │   ├── services/     # Axios REST client integration
│   │   └── App.jsx       # Client routes and path directives
│   ├── package.json      # Node.js dependencies
│   ├── postcss.config.js # PostCSS configuration
│   └── tailwind.config.js# Tailwind CSS color tokens and design system
└── README.md             # Project documentation
```

---

## 🛠️ Technology Stack

*   **Frontend:** React, Tailwind CSS, Framer Motion, Recharts, Lucide Icons, Axios.
*   **Backend:** FastAPI (Python), SQLite (Development, easily switches to PostgreSQL), SQLAlchemy ORM.
*   **Machine Learning:** Scikit-Learn (Logistic Regression, Decision Trees, Random Forests, Gradient Boosting, SVM), XGBoost, Joblib, Pandas, NumPy.
*   **Security:** JWT Access Tokens, bcrypt password hashing.

---

## 🚀 Setup & Installation

### Prerequisite
Ensure that you have **Python 3.10+** and **Node.js 18+** installed.

### 1. Train the ML Classifier (Machine Learning Pipeline)
Navigate to the `backend` directory, create a virtual environment, activate it, install requirements, and run the ML pipeline training script:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # On Windows Powershell
# source .venv/bin/activate  # On Linux/macOS

# Upgrade pip and install libraries
python -m pip install --upgrade pip
pip install -r requirements.txt

# Run ML pipeline (downloads Kaggle dataset, compares 6 models, registers the best model)
python scripts/train.py
```

### 2. Start the Backend API Server
Once the model is successfully trained, start the FastAPI uvicorn server:

```bash
# Still in backend/ with activated venv
python main.py
```
The REST API documentation will be available at:
*   Swagger Interactive Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
*   Alternative ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 3. Start the Frontend Dev Server
In a new terminal window, navigate to the `frontend` directory, install packages, and launch Vite:

```bash
cd frontend
npm install
npm run dev
```
The React web application will start at: [http://localhost:5173](http://localhost:5173)

---

## 📄 REST API Index

### 🔐 Authentication
*   `POST /api/auth/register` - Create a new borrower profile (The first registered user is automatically created as an Admin).
*   `POST /api/auth/login/json` - Login using JSON body (returns JWT access token).
*   `POST /api/auth/login-form-data` - Login using OAuth2 form-data (for Swagger UI testing).
*   `GET /api/auth/me` - Fetch profile details of active logged-in user.
*   `PUT /api/auth/profile` - Update borrower full name, email, or change password.

### 📊 Loans & Predictions
*   `POST /api/loans/predict` - Accepts loan parameters, pre-processes features, runs model inference, generates Explainable AI metrics, and logs application.
*   `GET /api/loans/applications` - List all past loan evaluations of current user.
*   `GET /api/loans/applications/{id}` - Retrieve details of a specific loan application decision report.
*   `DELETE /api/loans/applications/{id}` - Delete user application.
*   `GET /api/loans/dashboard` - Retrieve user statistics (KPIs, recent applications log, chart coordinates).
*   `POST /api/loans/chat` - Query Vertex local AI chatbot advisor regarding credit scores, interest rates, or eligibility boosts.

### 🛡️ Administrative Console
*   `GET /api/admin/dashboard` - System-wide stats, applicant demographics, and ML training diagnostics.
*   `GET /api/admin/applications` - Searchable, paginated, and filtered record logs of all system applications.
*   `PUT /api/admin/applications/{id}/status` - Administrative override of prediction status decision.
*   `DELETE /api/admin/applications/{id}` - Delete any application.
*   `GET /api/admin/users` - List all system registered user profiles.
*   `GET /api/admin/applications/export` - Export entire application database table directly to a download CSV file.
