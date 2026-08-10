import os
import mysql.connector
from mysql.connector import Error
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def _column_exists(cursor, table_name, column_name):
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s
        """,
        (DB_NAME, table_name, column_name),
    )
    return cursor.fetchone()[0] > 0

# =========================
# Database Configuration
# =========================

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "health_analyzer")
DB_PORT = int(os.getenv("DB_PORT", 3306))

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# =========================
# SQLAlchemy Engine
# =========================

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ SQLAlchemy Session Generator
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ✅ ADD THIS (for Alembic compatibility)
def get_sqlalchemy_engine():
    return engine

# =========================
# MySQL Connector (Raw)
# =========================

def get_db_connection():
    """Returns a raw MySQL connection"""
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            port=DB_PORT
        )
        return conn
    except Error as e:
        print(f"❌ MySQL connection error: {e}")
        return None

# =========================
# Database Initialization
# =========================

def init_db():
    """
    Initializes database and tables.
    ⚠️ NO password hashing
    ⚠️ NO admin creation
    """
    print("Initializing database...")

    try:
        # Step 1: Create database if not exists
        root_conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )

        cursor = root_conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        root_conn.close()
        print(f"Database '{DB_NAME}' checked/created.")

        # Step 2: Connect to database
        conn = get_db_connection()
        if not conn:
            return

        cursor = conn.cursor()

        # USERS TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                mobile_no VARCHAR(20) UNIQUE NOT NULL,
                blood_group VARCHAR(5) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        print("Table 'users' checked/created.")

        if not _column_exists(cursor, "users", "mobile_no"):
            cursor.execute("ALTER TABLE users ADD COLUMN mobile_no VARCHAR(20) UNIQUE NULL")
        
        if not _column_exists(cursor, "users", "blood_group"):
            cursor.execute("ALTER TABLE users ADD COLUMN blood_group VARCHAR(5) DEFAULT 'O+'")
            cursor.execute("ALTER TABLE users MODIFY COLUMN blood_group VARCHAR(5) NOT NULL")

        cursor.execute(
            """
            UPDATE users
            SET
                mobile_no = COALESCE(NULLIF(mobile_no, ''), CONCAT('LEGACY_', id))
            """
        )

        # PATIENT REPORTS TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patient_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                glucose DECIMAL(8,2) NULL,
                blood_pressure DECIMAL(8,2) NULL,
                skin_thickness DECIMAL(8,2) NULL,
                insulin DECIMAL(8,2) NULL,
                bmi DECIMAL(8,2) NULL,
                diabetes_pedigree_function DECIMAL(8,4) NULL,
                age INT NULL,

                diabetes_prediction VARCHAR(64) NULL,
                hypertension_prediction VARCHAR(64) NULL,
                heart_disease_prediction VARCHAR(64) NULL,
                risk_level VARCHAR(64) NULL,
                probability FLOAT NULL,

                abnormal_count INT NULL,
                abnormal_json JSON NULL,
                conditions_json JSON NULL,
                specialists_json JSON NULL,
                source VARCHAR(32) NULL,

                FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE SET NULL
            )
        """)
        if not _column_exists(cursor, "patient_reports", "probability"):
            cursor.execute("ALTER TABLE patient_reports ADD COLUMN probability FLOAT NULL")
        print("Table 'patient_reports' checked/created.")

        # CBC REPORTS TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cbc_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                cbc_json JSON NULL,
                interpretation_json JSON NULL,
                probability FLOAT NULL,
                source VARCHAR(32) NULL,

                FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE SET NULL
            )
        """)
        if not _column_exists(cursor, "cbc_reports", "probability"):
            cursor.execute("ALTER TABLE cbc_reports ADD COLUMN probability FLOAT NULL")
        print("Table 'cbc_reports' checked/created.")

        # HEART REPORTS TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS heart_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                age INT,
                sex INT,
                cp INT,
                trestbps INT,
                chol INT,
                fbs INT,
                restecg INT,
                thalach INT,
                exang INT,
                oldpeak FLOAT,
                slope INT,
                ca INT,
                thal INT,

                prediction VARCHAR(64),
                probability FLOAT,

                FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE SET NULL
            )
        """)
        print("Table 'heart_reports' checked/created.")

        # HYPERTENSION REPORTS TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hypertension_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                age INT,
                sex INT,
                bmi FLOAT,
                heart_rate INT,
                activity_level INT,
                smoker INT,
                family_history INT,

                prediction VARCHAR(64),
                probability FLOAT NULL,
                
                FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE SET NULL
            )
        """)
        if not _column_exists(cursor, "hypertension_reports", "probability"):
            cursor.execute("ALTER TABLE hypertension_reports ADD COLUMN probability FLOAT NULL")
        print("Table 'hypertension_reports' checked/created.")

        # MODEL REGISTRY TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS model_registry (
                id INT AUTO_INCREMENT PRIMARY KEY,
                model_name VARCHAR(64) UNIQUE NOT NULL,
                version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
                algorithm VARCHAR(64) NOT NULL,
                accuracy FLOAT NULL,
                `precision` FLOAT NULL,
                recall FLOAT NULL,
                f1_score FLOAT NULL,
                auc_roc FLOAT NULL,
                status ENUM('Active', 'Training', 'Deprecated', 'Idle') DEFAULT 'Active',
                inference_count INT DEFAULT 0,
                last_trained TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Table 'model_registry' checked/created.")

        # AUDIT LOGS TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                action VARCHAR(255) NOT NULL,
                details JSON NULL,
                ip_address VARCHAR(45) NULL,
                status VARCHAR(32) DEFAULT 'Success',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE SET NULL
            )
        """)
        print("Table 'audit_logs' checked/created.")

        # CHAT CONVERSATIONS TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_conversations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) DEFAULT 'New Health Conversation',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE CASCADE
            )
        """)
        print("Table 'chat_conversations' checked/created.")

        # CHAT MESSAGES TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                conversation_id INT NOT NULL,
                sender ENUM('user', 'assistant') NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (conversation_id)
                    REFERENCES chat_conversations(id)
                    ON DELETE CASCADE
            )
        """)
        # CREATE PERFORMANCE INDEXES FOR QUICK FILTERING
        indexes_to_create = [
            ("idx_patient_reports_user_created", "patient_reports", "(user_id, created_at)"),
            ("idx_heart_reports_user_created", "heart_reports", "(user_id, created_at)"),
            ("idx_hypertension_reports_user_created", "hypertension_reports", "(user_id, created_at)"),
            ("idx_cbc_reports_user_created", "cbc_reports", "(user_id, created_at)"),
            ("idx_chat_messages_conv_created", "chat_messages", "(conversation_id, created_at)")
        ]

        for idx_name, table_name, columns in indexes_to_create:
            try:
                cursor.execute(f"CREATE INDEX {idx_name} ON {table_name} {columns}")
            except Error:
                pass  # Index already exists or skipped safely

        conn.commit()
        conn.close()

        print("[OK] Database initialization complete.")

    except Error as e:
        print(f"[ERROR] Database initialization error: {e}")

# =========================
# Run manually if needed
# =========================

if __name__ == "__main__":
    init_db()
