import argparse
from sqlalchemy.orm import Session
from alembic.config import Config
from alembic import command
from passlib.context import CryptContext

from src.database import get_sqlalchemy_engine
from src.models import User


def upgrade_db():
    """Run Alembic migrations."""
    print("Running database migrations...")
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    print("Database upgraded successfully.")


def create_admin(
    email,
    password,
    full_name="Admin",
    mobile_no="9999999999",
    blood_group="O+",
):
    """Create default admin user if it does not already exist."""

    engine = get_sqlalchemy_engine()

    with Session(engine) as session:

        # Check if admin already exists
        existing_user = session.query(User).filter(User.email == email).first()

        if existing_user:
            print(f"Admin '{email}' already exists.")
            return

        pwd_context = CryptContext(
            schemes=["bcrypt"],
            deprecated="auto",
        )

        hashed_password = pwd_context.hash(password)

        admin = User(
            email=email,
            mobile_no=mobile_no,
            blood_group=blood_group,
            password_hash=hashed_password,
            full_name=full_name,
            role="admin",
            email_verified=1,
            mobile_verified=1,
        )

        session.add(admin)
        session.commit()

        print(f"Admin '{email}' created successfully.")


def main():
    parser = argparse.ArgumentParser(
        description="Health Analyzer Management Script"
    )

    subparsers = parser.add_subparsers(dest="command")

    # Upgrade DB
    subparsers.add_parser(
        "upgrade_db",
        help="Run Alembic migrations",
    )

    # Seed DB
    subparsers.add_parser(
        "seed_db",
        help="Create default admin",
    )

    # Create Admin
    admin_parser = subparsers.add_parser(
        "create-admin",
        help="Create custom admin",
    )

    admin_parser.add_argument(
        "--email",
        required=True,
    )

    admin_parser.add_argument(
        "--password",
        required=True,
    )

    admin_parser.add_argument(
        "--name",
        default="Admin",
    )

    admin_parser.add_argument(
        "--mobile",
        default="9999999999",
    )

    admin_parser.add_argument(
        "--blood-group",
        default="O+",
    )

    args = parser.parse_args()

    if args.command == "upgrade_db":
        upgrade_db()

    elif args.command == "seed_db":
        create_admin(
            email="admin@gmail.com",
            password="Admin@123",
            full_name="Super Admin",
            mobile_no="9999999999",
            blood_group="O+",
        )

    elif args.command == "create-admin":
        create_admin(
            email=args.email,
            password=args.password,
            full_name=args.name,
            mobile_no=args.mobile,
            blood_group=args.blood_group,
        )

    else:
        parser.print_help()


if __name__ == "__main__":
    main()