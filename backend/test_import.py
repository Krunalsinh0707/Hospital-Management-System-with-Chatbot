import sys
import os

print(f"CWD: {os.getcwd()}")
for p in sys.path:
    print(f"PATH: {p}")

try:
    import src.models
    print("Successfully imported src.models")
except ImportError as e:
    print(f"Failed to import src.models: {e}")
