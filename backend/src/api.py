from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


from src.config.version_config import VERSION_CONFIG

# Internal Module Imports
from src.database import get_db_connection, init_db, SessionLocal, engine
from src.auth import get_password_hash
from src.models import User as DBUser, Base, PasswordResetOTP

# Router Imports
from src.routers import (
    auth_router,
    prediction_router,
    reports_router,
    cbc_router,
    admin_router,
    chatbot_router,
    password_reset
)

def create_default_admin():
    db = SessionLocal()
    try:
        admin = db.query(DBUser).filter(DBUser.email == "admin@gmail.com").first()
        if not admin:
            hashed_password = get_password_hash("Admin@123")
            new_admin = DBUser(
                email="admin@gmail.com",
                mobile_no="0000000000",
                blood_group="O+",
                password_hash=hashed_password,
                full_name="System Admin",
                role="admin"
            )
            db.add(new_admin)
            db.commit()
            print("✅ Default admin user created successfully.")
        else:
            print("ℹ️ Default admin user already exists. Skipping creation.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating default admin user: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_default_admin()
    yield

# ---------------- INITIALIZE DATABASE & TABLES ----------------
init_db()
Base.metadata.create_all(bind=engine)

# ---------------- APP CONFIG ----------------
app = FastAPI(
    title=VERSION_CONFIG["project_name"],
    description=VERSION_CONFIG["description"],
    version=VERSION_CONFIG["version"],
    lifespan=lifespan
)

# ---------------- CORS ----------------
def _get_allowed_origins() -> List[str]:
    default_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]
    extra_origins = [
        origin.strip()
        for origin in os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
        if origin.strip()
    ]
    return list(dict.fromkeys(default_origins + extra_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- INCLUDE API ROUTERS ----------------
app.include_router(auth_router.router)
app.include_router(prediction_router.router)
app.include_router(reports_router.router)
app.include_router(cbc_router.router)
app.include_router(admin_router.router)
app.include_router(chatbot_router.router)
app.include_router(password_reset.router)

# ---------------- BASIC ROOT ROUTE ----------------
@app.get("/")
def root():
    return {
        "message": f"{VERSION_CONFIG['project_name']} running successfully",
        "version": VERSION_CONFIG["version"],
        "build": VERSION_CONFIG["build_number"],
        "status": "online"
    }

