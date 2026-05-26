import argparse
import sys
import os
from sqlalchemy import text
from alembic.config import Config
from alembic import command
from src.database import get_sqlalchemy_engine, get_db_connection
from src.models import User
from sqlalchemy.orm import Session
from passlib.context import CryptContext

def upgrade_db():
    print("Running database migrations...")
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    print("Database upgraded successfully.")

def create_admin(email, password, full_name="Admin"):
    engine = get_sqlalchemy_engine()
    with Session(engine) as session:
        # Check if user exists
        existing_user = session.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User with email {email} already exists.")
            return

        pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")
        hashed_pw = pwd_context.hash(password)

        new_user = User(
            email=email,
            password_hash=hashed_pw,
            full_name=full_name,
            role="admin"
        )
        session.add(new_user)
        session.commit()
        print(f"Admin user {email} created successfully.")

def main():
    parser = argparse.ArgumentParser(description="Health Analyzer Management Script")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # upgrade command
    subparsers.add_parser("upgrade_db", help="Upgrade database using Alembic")

    # create-admin command
    parser_admin = subparsers.add_parser("create-admin", help="Create a new admin user")
    parser_admin.add_argument("--email", required=True, help="Admin email")
    parser_admin.add_argument("--password", required=True, help="Admin password")
    parser_admin.add_argument("--name", default="Admin", help="Admin full name")

    # seed-db command
    subparsers.add_parser("seed_db", help="Seed database with default admin")

    args = parser.parse_args()

    if args.command == "upgrade_db":
        upgrade_db()
    elif args.command == "create-admin":
        create_admin(args.email, args.password, args.name)
    elif args.command == "seed_db":
        create_admin("admin@gmail.com", "Admin@123", "Super Admin")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
