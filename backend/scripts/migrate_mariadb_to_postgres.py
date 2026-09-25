import sys
import os
import json
import datetime
import pymysql
import psycopg
from psycopg.rows import dict_row

# Ensure backend root is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration
MARIADB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "health_analyzer",
    "charset": "utf8mb4"
}

POSTGRES_CONFIG = {
    "host": "127.0.0.1",
    "port": 5432,
    "user": "health_analyzer_user",
    "password": "admin",
    "dbname": "health_analyzer"
}

# Tables to migrate in topological dependency order
MIGRATION_TABLES = [
    "users",
    "verification_codes",
    "password_reset_otp",
    "departments",
    "doctors",
    "model_registry",
    "appointments",
    "patient_doctor_messages",
    "notifications",
    "medical_reports",
    "report_extractions",
    "ai_analyses",
    "doctor_reviews",
    "medical_records",
    "emergency_requests",
    "audit_logs",
    "chat_conversations",
    "chat_messages",
    "patient_reports",
    "cbc_reports",
    "heart_reports",
    "hypertension_reports",
    "alembic_version"
]

# Mapping for tables that had mixed casing in legacy MariaDB
TABLE_NAME_MAP = {
    "Patient_Reports": "patient_reports",
    "Cbc_Reports": "cbc_reports"
}

def json_converter(val):
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return json.dumps(val)
    if isinstance(val, str):
        try:
            # Validate JSON string
            parsed = json.loads(val)
            return json.dumps(parsed)
        except Exception:
            return val
    return str(val)

def run_migration():
    print("==========================================================================")
    print("HEALTH ANALYZER — MARIADB TO POSTGRESQL MIGRATION ENGINE")
    print("==========================================================================")
    
    # 1. Connect to databases
    try:
        mariadb_conn = pymysql.connect(**MARIADB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        print("[OK] Connected to source MariaDB database.")
    except Exception as e:
        print(f"[ERROR] Failed to connect to MariaDB: {e}")
        return False

    try:
        pg_conn = psycopg.connect(**POSTGRES_CONFIG)
        print("[OK] Connected to target PostgreSQL database.")
    except Exception as e:
        print(f"[ERROR] Failed to connect to PostgreSQL: {e}")
        mariadb_conn.close()
        return False

    maria_cur = mariadb_conn.cursor()
    pg_cur = pg_conn.cursor()

    # Get actual list of tables in MariaDB
    maria_cur.execute("SHOW TABLES")
    maria_tables_raw = [list(row.values())[0] for row in maria_cur.fetchall()]
    maria_tables_dict = {t.lower(): t for t in maria_tables_raw}

    report_data = []
    total_migrated_rows = 0

    try:
        # Clear default seeded departments to allow exact ID migration
        pg_cur.execute("TRUNCATE TABLE departments CASCADE;")
        pg_conn.commit()

        for target_table in MIGRATION_TABLES:
            source_table = maria_tables_dict.get(target_table.lower())
            if not source_table:
                print(f"⚠️ Table '{target_table}' not found in MariaDB. Skipping...")
                report_data.append({
                    "table": target_table,
                    "source_count": 0,
                    "target_count": 0,
                    "status": "SKIPPED (NOT IN SOURCE)"
                })
                continue

            # Count MariaDB rows
            maria_cur.execute(f"SELECT COUNT(*) as count FROM `{source_table}`")
            source_count = maria_cur.fetchone()["count"]

            if source_count == 0:
                report_data.append({
                    "table": target_table,
                    "source_count": 0,
                    "target_count": 0,
                    "status": "PASS (EMPTY)"
                })
                continue

            # Fetch source rows
            maria_cur.execute(f"SELECT * FROM `{source_table}`")
            rows = maria_cur.fetchall()

            if not rows:
                continue

            columns = list(rows[0].keys())
            col_names_str = ", ".join([f'"{c}"' for c in columns])
            placeholders_str = ", ".join(["%s"] * len(columns))

            insert_query = f'INSERT INTO "{target_table}" ({col_names_str}) VALUES ({placeholders_str})'

            # Clean & Format values for PostgreSQL
            formatted_rows = []
            bool_cols = ["verified", "is_read", "requires_doctor_review"]

            for r in rows:
                row_vals = []
                for col in columns:
                    val = r[col]
                    # Handle boolean conversions
                    if col in bool_cols:
                        if val is not None and not isinstance(val, bool):
                            val = bool(val)
                    # Handle json fields
                    elif col.endswith("_json") or col in ["details", "availability", "important_factors", "abnormal_json", "conditions_json", "specialists_json"]:
                        if isinstance(val, (dict, list)):
                            val = json.dumps(val)
                        elif isinstance(val, str) and val.strip():
                            try:
                                json.loads(val) # validate
                            except Exception:
                                pass
                    row_vals.append(val)
                formatted_rows.append(tuple(row_vals))

            if target_table == "alembic_version":
                pg_cur.execute('CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL, CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num));')

            # Truncate target table before migration to avoid key conflicts
            pg_cur.execute(f'TRUNCATE TABLE "{target_table}" CASCADE;')
            
            # Execute batch insert
            pg_cur.executemany(insert_query, formatted_rows)
            pg_conn.commit()

            # Synchronize sequence/identity if table has id primary key
            if "id" in columns:
                try:
                    seq_query = f"SELECT setval(pg_get_serial_sequence('{target_table}', 'id'), COALESCE((SELECT MAX(id) FROM \"{target_table}\"), 1), true);"
                    pg_cur.execute(seq_query)
                    pg_conn.commit()
                except Exception as seq_err:
                    print(f"Sequence reset warning for {target_table}: {seq_err}")
                    pg_conn.rollback()

            # Verify target count
            pg_cur.execute(f'SELECT COUNT(*) FROM "{target_table}"')
            target_count = pg_cur.fetchone()[0]

            status = "PASS" if source_count == target_count else "FAIL"
            report_data.append({
                "table": target_table,
                "source_count": source_count,
                "target_count": target_count,
                "status": status
            })

            total_migrated_rows += target_count
            print(f"Migrated '{target_table}': {source_count} MariaDB rows -> {target_count} PostgreSQL rows [{status}]")

        print("\n==========================================================================")
        print("MIGRATION VERIFICATION SUMMARY REPORT")
        print("==========================================================================")
        print(f"{'TABLE NAME':<30} | {'MARIADB':<10} | {'POSTGRES':<10} | {'STATUS':<15}")
        print("-" * 72)
        all_passed = True
        for r in report_data:
            print(f"{r['table']:<30} | {r['source_count']:<10} | {r['target_count']:<10} | {r['status']:<15}")
            if "FAIL" in r['status']:
                all_passed = False

        print("-" * 72)
        print(f"TOTAL ROWS MIGRATED: {total_migrated_rows}")
        print(f"OVERALL STATUS: {'SUCCESS' if all_passed else 'FAILED'}")
        print("==========================================================================")
        return all_passed

    except Exception as e:
        pg_conn.rollback()
        print(f"[ERROR] Migration failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        maria_cur.close()
        mariadb_conn.close()
        pg_cur.close()
        pg_conn.close()

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
