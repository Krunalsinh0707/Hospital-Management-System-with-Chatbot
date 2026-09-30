import os
import psycopg
from psycopg.rows import dict_row
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# =========================
# Database Configuration
# =========================

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "health_analyzer_user")
DB_PASS = os.getenv("DB_PASS", "admin")
DB_NAME = os.getenv("DB_NAME", "health_analyzer")
DB_PORT = int(os.getenv("DB_PORT", 5432))

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql+psycopg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# =========================
# SQLAlchemy Engine
# =========================

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=False
)
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
# Raw Database Connection Wrapper
# =========================

class PgCursorWrapper:
    """Wrapper around psycopg cursor to ensure full backward compatibility with raw MySQL queries"""
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, vars=None):
        return self._cursor.execute(query, vars)

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def fetchmany(self, size=None):
        return self._cursor.fetchmany(size)

    def close(self):
        return self._cursor.close()

    @property
    def rowcount(self):
        return self._cursor.rowcount

    @property
    def lastrowid(self):
        # In PostgreSQL, lastrowid isn't directly present unless RETURNING is used, but return 0/None safely
        return getattr(self._cursor, "lastrowid", None)


class PgConnectionWrapper:
    """Wrapper over psycopg connection for seamless router backward compatibility"""
    def __init__(self, conn):
        self._conn = conn

    def cursor(self, dictionary=False, **kwargs):
        cur = self._conn.cursor(row_factory=dict_row if dictionary else None)
        return PgCursorWrapper(cur)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def get_db_connection():
    """Returns a PostgreSQL connection wrapped for backward compatibility"""
    try:
        conn = psycopg.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            dbname=DB_NAME,
            port=DB_PORT
        )
        return PgConnectionWrapper(conn)
    except Exception as e:
        print(f"❌ PostgreSQL connection error: {e}")
        return None


# =========================
# Database Initialization
# =========================

def init_db():
    """
    Initializes PostgreSQL database and tables using SQLAlchemy metadata.
    """
    print("Initializing PostgreSQL database...")
    try:
        from src.models import Base, Department, ClinicalRoutingRule
        
        # Create all tables in PostgreSQL
        Base.metadata.create_all(bind=engine)
        print("SQLAlchemy tables checked/created in PostgreSQL.")

        # Seed default departments if table is empty
        db = SessionLocal()
        try:
            dept_count = db.query(Department).count()
            if dept_count == 0:
                default_departments = [
                    ("Cardiology", "CARD", "Heart, vascular, and circulatory condition diagnostic and therapeutic care."),
                    ("Oncology", "ONCO", "Cancer detection, tumor assessment, and targeted oncological therapy."),
                    ("Orthopedics", "ORTHO", "Bone, joint, spine, and musculoskeletal system disorders."),
                    ("Neurology", "NEURO", "Brain, nervous system, stroke, and neuromuscular disorder care."),
                    ("Pulmonology", "PULMO", "Lungs, respiratory tract, and breathing conditions."),
                    ("Endocrinology", "ENDO", "Hormones, metabolism, diabetes, and endocrine gland disorders."),
                    ("Gastroenterology", "GASTRO", "Digestive system, liver, and gastrointestinal conditions."),
                    ("Hematology", "HEMA", "Blood disorders, CBC analysis, and bone marrow conditions."),
                    ("Nephrology", "NEPHRO", "Kidney diseases, renal function, and fluid balance."),
                    ("Dermatology", "DERM", "Skin, hair, nails, and cutaneous pathology."),
                    ("Pediatrics", "PEDI", "Infant, child, and adolescent specialized medical care."),
                    ("Gynecology", "GYNE", "Women's reproductive health and maternal care."),
                    ("General Medicine", "GENMED", "Comprehensive primary internal medicine and overall wellness."),
                    ("Emergency", "EMERG", "Critical care, urgent triage, and emergency medical response.")
                ]
                for name, code, desc in default_departments:
                    db.add(Department(name=name, code=code, description=desc))
                db.commit()
                print("Default medical departments seeded.")

            # Seed default clinical routing rules if table is empty
            rule_count = db.query(ClinicalRoutingRule).count()
            if rule_count == 0:
                dept_map = {d.code: d.id for d in db.query(Department).all()}
                default_rules = [
                    ("chest_pain", dept_map.get("EMERG", dept_map.get("CARD")), "EMERGENCY_REVIEW"),
                    ("shortness_of_breath", dept_map.get("EMERG", dept_map.get("PULMO")), "EMERGENCY_REVIEW"),
                    ("stroke", dept_map.get("EMERG", dept_map.get("NEURO")), "EMERGENCY_REVIEW"),
                    ("heart_attack", dept_map.get("CARD", dept_map.get("EMERG")), "EMERGENCY_REVIEW"),
                    ("cardiac", dept_map.get("CARD"), "HIGH_PRIORITY"),
                    ("hypertension", dept_map.get("CARD"), "MODERATE"),
                    ("diabetes", dept_map.get("ENDO"), "MODERATE"),
                    ("respiratory", dept_map.get("PULMO"), "MODERATE"),
                    ("orthopedic", dept_map.get("ORTHO"), "LOW_PRIORITY"),
                    ("dermatology", dept_map.get("DERM"), "LOW_PRIORITY"),
                    ("pediatric", dept_map.get("PEDI"), "LOW_PRIORITY"),
                    ("general", dept_map.get("GENMED"), "NORMAL"),
                    ("emergency", dept_map.get("EMERG"), "EMERGENCY_REVIEW"),
                ]
                for cat, dept_id, priority in default_rules:
                    if dept_id:
                        db.add(ClinicalRoutingRule(
                            category_or_indicator=cat,
                            department_id=dept_id,
                            priority=priority,
                            is_enabled=True,
                            version="1.0"
                        ))
                db.commit()
                print("Default clinical routing rules seeded.")
        finally:
            db.close()

        print("[OK] Database initialization complete.")
    except Exception as e:
        print(f"[ERROR] Database initialization error: {e}")


if __name__ == "__main__":
    init_db()
