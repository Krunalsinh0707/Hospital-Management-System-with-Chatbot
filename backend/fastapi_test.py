import sys
sys.path.append('.')
from fastapi.testclient import TestClient
from src.api import app

client = TestClient(app)

response_mobile = client.post("/token", data={"username": "9274368989", "password": "password"})
print("Mobile:", response_mobile.status_code, response_mobile.json())

response_email = client.post("/token", data={"username": "aditi@gmail.com", "password": "password"})
print("Email:", response_email.status_code, response_email.json())

# Assuming aditi's password might be aditi123
response_mobile_2 = client.post("/token", data={"username": "9274368989", "password": "password123"})
print("Mobile 2:", response_mobile_2.status_code, response_mobile_2.json())

response_email_2 = client.post("/token", data={"username": "aditi@gmail.com", "password": "password123"})
print("Email 2:", response_email_2.status_code, response_email_2.json())
