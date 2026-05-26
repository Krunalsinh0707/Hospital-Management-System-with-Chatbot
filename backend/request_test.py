import requests

url = "http://localhost:8000/token"

response = requests.post(url, data={"username": "9274368989", "password": "password1"})
print("Mobile:", response.status_code, response.text)

response2 = requests.post(url, data={"username": "aditi@gmail.com", "password": "password1"})
print("Email:", response2.status_code, response2.text)

response3 = requests.post(url, data={"username": "9274368989", "password": "password!"})
print("Mobile !:", response3.status_code, response3.text)

response4 = requests.post(url, data={"username": "aditi@gmail.com", "password": "password!"})
print("Email !:", response4.status_code, response4.text)
