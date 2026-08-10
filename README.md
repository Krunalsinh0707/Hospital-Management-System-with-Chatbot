# Health Analyzer v2.0 — Production AI Healthcare Platform

An advanced, production-grade **AI-Powered Healthcare Analytics & Clinical Decision Support System** designed for individuals and healthcare professionals. Integrates scaled machine learning models, multi-layer CBC pattern interpretation, RAG healthcare chatbot, real-time admin monitoring, and ReportLab PDF report exports.

---

## 🚀 Key Features

- **Production Machine Learning Engine**: Retrained Random Forest & Gradient Boosting models for **Diabetes (95.5% Acc, 0.96 AUC)**, **Heart Disease (99.0% Acc, 0.997 AUC)**, **Hypertension (95.5% Acc, 0.988 AUC)**, and **CBC Pattern Recognition (97.9% Acc)**.
- **Intelligent CBC AI Engine v2.0**: Multi-layer hematology analysis with gender/age-adjusted reference ranges, 5-tier severity classification, 0–100 CBC Health Score, dual patient/doctor explanations, and clinical urgency stratification.
- **RAG Healthcare Chatbot**: Context-aware AI assistant grounded in patient lab reports, featuring an immediate emergency trigger safety layer and Gemini 1.5 Flash API integration with offline clinical fallback.
- **ReportLab PDF Export Engine**: Generate and stream formatted clinical PDF reports (`diabetes_report_12.pdf`) with neural ML findings, confidence percentages, and medical disclaimers.
- **Data-Driven Admin Command Center**: 100% data-driven dashboard monitoring live patient telemetry, retrained model metadata, active risk alerts, and audit trail logs.
- **Security & Stability Hardening**: JWT Bearer token authentication on all prediction & file upload routes, environment variable configuration, dynamic SQL column whitelisting, and query pagination (`limit`/`offset`).

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI 2.0 (Python 3.11)
- **Architecture**: Modular APIRouters (`auth`, `prediction`, `reports`, `cbc`, `admin`, `chatbot`)
- **Database**: MySQL 8.0 with SQLAlchemy ORM + raw MySQL fallback
- **Machine Learning**: Scikit-Learn (RandomForest, GradientBoosting), StandardScaler, Pandas, NumPy, Joblib
- **LLM & RAG**: Google Generative AI SDK (`gemini-1.5-flash`)
- **PDF Generation & OCR**: ReportLab, pdfplumber, pytesseract, Pillow
- **Authentication**: JWT (python-jose) with Bcrypt password hashing

### Frontend
- **Framework**: React 19 + Vite 8
- **Routing**: React Router DOM v7
- **Styling**: TailwindCSS v4 with custom glassmorphism design system
- **Visualization**: Recharts & Chart.js / react-chartjs-2
- **Animations & Icons**: Framer Motion v12, Lucide React

---

## 📁 Project Architecture

```
Health-Analyzer/
├── backend/
│   ├── src/
│   │   ├── api.py                  ← Main FastAPI entry point & router orchestrator
│   │   ├── auth.py                 ← JWT authentication & security
│   │   ├── cbc_analysis.py         ← CBC AI Engine v2.0
│   │   ├── chatbot_service.py      ← RAG Chatbot & emergency safety layer
│   │   ├── database.py             ← MySQL DB connections & session generator
│   │   ├── ml_service.py           ← Scaled ML inference service
│   │   ├── models.py               ← SQLAlchemy ORM models (User, Reports, ModelRegistry, AuditLog)
│   │   ├── pdf_generator.py        ← ReportLab clinical PDF exporter
│   │   ├── pdf_service.py          ← OCR & PDF text extraction
│   │   ├── sms_service.py          ← SMS OTP gateway abstraction
│   │   ├── ml_pipeline/
│   │   │   └── train_models.py     ← Retraining pipeline for all 4 models
│   │   └── routers/
│   │       ├── admin_router.py     ← Admin analytics, model metadata & audit logs
│   │       ├── auth_router.py      ← User auth & profile management
│   │       ├── cbc_router.py       ← CBC manual & PDF analysis routes
│   │       ├── chatbot_router.py   ← RAG chatbot message endpoint
│   │       ├── prediction_router.py← Disease ML predictions & PDF intake
│   │       └── reports_router.py   ← Report storage & PDF download routes
│   ├── models/                     ← Serialized models (.pkl), scalers (.pkl) & metadata (.json)
│   ├── Dockerfile                  ← Production backend container
│   ├── .env.example                ← Environment template
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 ← Router & global layout wrapper
│   │   ├── components/
│   │   │   └── Chatbot.jsx         ← Floating RAG Chatbot drawer component
│   │   ├── hooks/
│   │   │   └── useDashboard.js     ← Vitals derivation & Health Score calculation
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       ← User dashboard with health score & live alerts
│   │   │   ├── History.jsx         ← History table with authenticated PDF download
│   │   │   ├── AdminPage.jsx       ← Real-data admin command center
│   │   │   ├── CBC.jsx             ← CBC manual & upload analyzer
│   │   │   ├── Diabetes.jsx        ← Diabetes AI prediction form
│   │   │   ├── Heart.jsx           ← Heart disease prediction form
│   │   │   └── Hypertension.jsx    ← Hypertension prediction form
│   ├── Dockerfile                  ← Production frontend Nginx container
│   └── nginx.conf                  ← Nginx reverse proxy configuration
├── docker-compose.yml              ← Multi-container orchestration (MySQL + Backend + Frontend)
└── README.md
```

---

## ⚙️ Quick Start Guide

### Option 1 — Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/Krunalsinh0707/Health-Analyzer.git
   cd Health-Analyzer
   ```

2. Run with Docker Compose:
   ```bash
   docker-compose up --build
   ```
   - **Frontend**: http://localhost (Port 80)
   - **Backend API**: http://localhost:8000 (Port 8000)
   - **Swagger Docs**: http://localhost:8000/docs

---

### Option 2 — Local Development

#### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Retrain ML models & generate scalers
python -m src.ml_pipeline.train_models

# Run FastAPI development server
uvicorn src.api:app --reload --port 8000
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 in your browser.

---

## 🔑 Default Credentials

- **Admin Account**: `admin@gmail.com` / `Admin@123`
- **Register User**: Any new user registered receives standard `role = 'user'` access.

---

## 📄 License & Attribution

Developed for advanced healthcare decision support. Informational decision support system — not a substitute for professional medical diagnosis.
