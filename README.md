# Health Analyzer

An advanced **AI-powered Healthcare Analytics & Decision Support System** designed to assist medical professionals and individuals in assessing health risks. The application leverages Machine Learning to predict disease probabilities (Diabetes, Heart Disease, Hypertension) and provides detailed reports and specialist recommendations based on patient data.

## 🚀 Features

- **Disease Prediction**: AI models to predict the likelihood of Diabetes, Hypertension, and Heart Disease.
- **Batch ML Testing**: Capabilities to process and evaluate large datasets of ML predictions simultaneously.
- **CBC Analysis**: Upload and analyze CBC (Complete Blood Count) reports from PDF files.
- **Risk Assessment**: Calculates overall health risk scores based on multiple parameters.
- **Specialist Recommendations**: Suggests medical specialists based on identified conditions.
- **Report Management**: Save, view, and manage patient reports with a comprehensive history view containing detailed clinical data.
- **Admin Dashboard**: Specialized view for administrators to oversee all user reports, statistics, and access in-depth patient records.
- **Secure Authentication**: Robust user registration featuring secure OTP-based mobile login and JWT session management.
- **PDF Parsing**: Automatically extracts data from uploaded PDF medical reports.
- **Power BI Dashboard**: Comprehensive analytics dashboard for health metrics.
- **Azure Architecture Ready**: Designed with infrastructure and deployment architecture guidelines for Azure.

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MySQL
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: JWT (JSON Web Tokens) with Passlib
- **Machine Learning**: Scikit-learn, Pandas, NumPy
- **PDF Processing**: pdfplumber

### Frontend
- **Framework**: React (Vite)
- **Routing**: React Router DOM
- **Visualization**: Recharts
- **Styling**: CSS Modules / Standard CSS

## 📋 Prerequisites

Ensure you have the following installed on your system:
- **Python** (3.8 or higher)
- **Node.js** (v14 or higher) & **npm**
- **MySQL Server**
- **Power BI Desktop** (optional, for viewing the `.pbix` dashboard)

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Krunalsinh1604/Health-Analyzer.git
cd Health-Analyzer
```

### 2. Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Database:**
    - Ensure MySQL server is running.
    - Create a database named `health_analyzer` (or the application will attempt to create it).
    - Update database credentials if necessary by setting environment variables or modifying `src/database.py` (Default: user=`root`, password=``, host=`localhost`, port=`3306`).

5.  **Initialize Database & Application:**
    The application initializes the database tables automatically on startup. However, it is recommended to run migrations to ensure the schema is up-to-date:

    ```bash
    python manage.py upgrade_db
    ```

6.  **Seed Default Admin:**
    Initialize the default admin account:
    ```bash
    python manage.py seed_db
    ```

    > **Note:** Admin accounts are restricted. The system is designed for a single administrator.
    
    **Default Admin Credentials:**
    - Email: `admin@gmail.com`
    - Password: `Admin@123`
    *(Change this password immediately after first login)*

### 3. Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## 🛠 Database Management (Alembic)

This project uses **Alembic** for database migrations. This allows us to:
- Track changes to the database schema (version control).
- Apply changes safely without losing data.
- Ensure all environments (local, production) have the same database structure.

**Common Commands (from the `backend` directory):**
- `python manage.py upgrade_db`: Apply pending migrations (update DB to latest version).
- `alembic revision --autogenerate -m "message"`: Create a new migration based on model changes.

## ▶️ Usage

### Running the Backend
From the `backend` directory (ensure venv is active):
```bash
uvicorn src.api:app --reload
```
The API will be available at `http://localhost:8000`.
- **Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Running the Frontend
From the `frontend` directory:
```bash
npm run start
```
The application will be accessible at `http://localhost:5173`.

## 📂 Project Structure

```
Health-Analyzer/
├── azure/               # Azure architecture guidelines
├── backend/             # Python Backend Source Code
│   ├── alembic/         # Database migrations
│   ├── src/             # Core Application Code
│   │   ├── api.py       # FastAPI Application Entry Point
│   │   ├── auth.py      # Authentication Logic
│   │   ├── database.py  # Database Configuration & Connection
│   │   ├── models.py    # Database Models
│   │   ├── ml_service.py# Machine Learning Prediction Logic
│   │   └── pdf_service.py# PDF Extraction Logic
│   ├── manage.py        # CLI for management tasks (admin creation)
│   └── requirements.txt # Python dependencies
├── frontend/            # React frontend application
├── powerbi/             # Power BI Dashboard and Datasets
└── README.md            # Project Documentation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
