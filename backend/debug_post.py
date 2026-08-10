import urllib.request
import urllib.error
import json

url = 'http://127.0.0.1:8000/forgot-password'
data = json.dumps({'email': 'morikrunalsinh7@gmail.com'}).encode('utf-8')
headers = {'Content-Type': 'application/json'}

req = urllib.request.Request(url, data=data, headers=headers)
try:
    with urllib.request.urlopen(req) as res:
        print("Success Output:", res.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error Code:", e.code)
    print("HTTP Error Body:", e.read().decode())
