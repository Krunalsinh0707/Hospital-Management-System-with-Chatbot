import requests

url = "http://localhost:8000/token"
payload = {
    "username": "9274368989",
    "password": "password"
}
headers = {
    "Content-Type": "application/x-www-form-urlencoded"
}

passwords_to_try = [
    'password', 'password123', 'aditi123', 'aditi@123', '123456789', 'password!', '1234567890', '9274368989'
]

for p in passwords_to_try:
    payload["password"] = p
    response = requests.post(url, data=payload, headers=headers)
    print(f"Password: {p} - Status: {response.status_code}")
