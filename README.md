# Health Analyzer v2.0 — Production AI Healthcare Platform

An advanced, production-grade **AI-Powered Healthcare Analytics & Clinical Decision Support System** designed for individuals and healthcare professionals. Integrates scaled machine learning models, multi-layer CBC pattern interpretation, RAG healthcare chatbot, real-time admin monitoring, appointments & department triage, ReportLab PDF report exports, and a **PostgreSQL 18** database architecture.

---

## 🚀 Key Features

- **Enterprise Database Architecture**: Powered by **PostgreSQL 18** with SQLAlchemy 2.x ORM, `psycopg3` driver, identity sequence synchronization, and Alembic version tracking (`738d5dcc499c`).
- **Production Machine Learning Engine**: Retrained Random Forest & Gradient Boosting models for **Diabetes (95.5% Acc, 0.96 AUC)**, **Heart Disease (99.0% Acc, 0.997 AUC)**, **Hypertension (95.5% Acc, 0.988 AUC)**, and **CBC Pattern Recognition (97.9% Acc)**.
- **Intelligent CBC AI Engine v2.0**: Multi-layer hematology analysis with gender/age-adjusted reference ranges, 5-tier severity classification, 0–100 CBC Health Score, dual patient/doctor explanations, and clinical urgency stratification.
- **RAG Healthcare Chatbot**: Context-aware AI assistant grounded in patient lab reports, featuring an immediate emergency trigger safety layer and Gemini 1.5 Flash API integration with offline clinical fallback.
- **Clinical Triage & Appointment Scheduling**: Multi-department workflow connecting patients with specialist doctors across Cardiology, Oncology, Orthopedics, Neurology, Pulmonology, Endocrinology, and more.
- **ReportLab PDF Export Engine**: Generate and stream formatted clinical PDF reports (`diabetes_report_12.pdf`) with neural ML findings, confidence percentages, and medical disclaimers.
- **Data-Driven Admin Command Center**: 100% data-driven dashboard monitoring live patient telemetry, retrained model metadata, active risk alerts, and audit trail logs.
- **Security & Health Endpoints**: JWT Bearer token authentication, Bcrypt password hashing, parameter validation, and live database health monitoring (`GET /health`).

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: **PostgreSQL 18** with SQLAlchemy 2.x ORM & `psycopg` (v3) driver
- **Migrations**: Alembic (`alembic upgrade head`)
- **Architecture**: Modular APIRouters (`auth`, `prediction`, `reports`, `cbc`, `admin`, `chatbot`, `appointments`, `departments`, `doctors`, `emergency`, `medical_reports`)
- **Machine Learning**: Scikit-Learn (RandomForest, GradientBoosting), StandardScaler, Pandas, NumPy, Joblib
- **LLM & RAG**: Google Generative AI SDK (`gemini-1.5-flash`)
- **PDF Generation & OCR**: ReportLab, pdfplumber, pytesseract, Pillow
- **Authentication**: JWT (python-jose) with Bcrypt password hashing

### Frontend
- **Framework**: React 19 + Vite 8
- **Routing**: React Router DOM v7
- **Styling**: Vanilla CSS / TailwindCSS with custom glassmorphism design system
- **Visualization**: Recharts & Chart.js / react-chartjs-2
- **Animations & Icons**: Framer Motion v12, Lucide React

---

## 📁 Project Architecture

```
Health-Analyzer/
├── backend/
│   ├── src/
│   │   ├── api.py                  ← Main FastAPI entry point, CORS & /health endpoint
│   │   ├── auth.py                 ← JWT authentication & security
│   │   ├── cbc_analysis.py         ← CBC AI Engine v2.0
│   │   ├── database.py             ← PostgreSQL DB connection pool & Session generator
│   │   ├── ml_service.py           ← Scaled ML inference service
│   │   ├── models.py               ← SQLAlchemy ORM models (User, Doctor, Department, Appointment, Reports)
│   │   ├── pdf_generator.py        ← ReportLab clinical PDF exporter
│   │   ├── pdf_service.py          ← OCR & PDF text extraction
│   │   └── routers/
│   │       ├── admin_router.py     ← Admin analytics, model metadata & audit logs
│   │       ├── appointments_router.py ← Patient & Doctor appointment workflows
│   │       ├── auth_router.py      ← User auth & profile management
│   │       ├── cbc_router.py       ← CBC manual & PDF analysis routes
│   │       ├── chatbot_router.py   ← RAG chatbot message endpoint
│   │       ├── departments_router.py ← Department listing & doctors by department
│   │       ├── doctors_router.py   ← Doctor management & availability
│   │       ├── emergency_router.py ← Emergency requests & triage queue
│   │       ├── medical_reports_router.py ← Hospital & patient medical reports
│   │       ├── prediction_router.py← Disease ML predictions & PDF intake
│   │       └── reports_router.py   ← Report storage & PDF download routes
│   ├── scripts/
│   │   └── migrate_mariadb_to_postgres.py ← Data & schema migration engine
│   ├── alembic/                    ← Alembic database version control
│   ├── models/                     ← Serialized ML models (.pkl) & metadata (.json)
│   ├── seed_test_doctors.py        ← Test doctor seeding script
│   ├── test_appointment_flow.py    ← Relational appointment verification test
│   ├── Dockerfile                  ← Production backend container
│   ├── .env.example                ← Environment configuration template
│   └── requirements.txt            ← Dependency requirements (includes psycopg[binary])
├── docs/
│   └── POSTGRESQL_MIGRATION_REPORT.md ← Full database migration audit & validation report
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 ← Router & global layout wrapper
│   │   ├── components/             ← UI drawer, modal & navigation components
│   │   ├── pages/                  ← User & Doctor dashboard, Appointments, CBC, History pages
│   ├── Dockerfile                  ← Production Nginx container
│   └── nginx.conf                  ← Nginx reverse proxy configuration
├── docker-compose.yml              ← Multi-container orchestration
└── README.md
```

---

## ⚙️ Quick Start Guide

### 1. PostgreSQL Database Configuration

Make sure PostgreSQL 18 is running locally on port `5432`:

- **Database Name**: `health_analyzer`
- **User**: `health_analyzer_user`
- **Password**: `admin`

Configure `backend/.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=health_analyzer_user
DB_PASS=admin
DB_NAME=health_analyzer
DATABASE_URL=postgresql+psycopg://health_analyzer_user:admin@127.0.0.1:5432/health_analyzer
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Alembic migrations
alembic upgrade head

# Seed test doctors (optional)
python seed_test_doctors.py

# Run FastAPI development server
uvicorn src.api:app --reload --port 8000
```

- **Backend API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **Health Check Endpoint**: http://localhost:8000/health

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 🧪 Testing & Verification

Run automated database relationship & workflow test suite:

```bash
cd backend
python test_appointment_flow.py
```

Inspect database health status:

```bash
curl http://localhost:8000/health
```

Expected Response:
```json
{
  "status": "healthy",
  "database": "PostgreSQL",
  "connected": true
}
```

---

## 🔑 Default Credentials

- **Admin Account**: `admin@gmail.com` / `Admin@123`
- **Test Doctor Account**: `aarav.shah.test@healthanalyzer.com` / `Abc@123`
- **Register User**: Standard user registration assigns `role = 'patient'`.

---

## 📊 Migration Documentation

For complete technical verification details, row counts, sequence synchronization, and rollback procedures, refer to the [PostgreSQL Migration Report](docs/POSTGRESQL_MIGRATION_REPORT.md).

---

## 📄 License & Attribution

Developed for advanced healthcare decision support. Informational decision support system — not a substitute for professional medical diagnosis.
