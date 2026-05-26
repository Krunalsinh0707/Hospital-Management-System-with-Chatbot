import requests
import os

def test_ml_train():
    url = "http://127.0.0.1:8000/ml/train-custom"
    
    # Create a dummy CSV
    csv_content = """Feature1,Feature2,Target
10,20,1
15,25,0
12,22,1
18,28,0
20,30,1
22,32,0
25,35,1
28,38,0
30,40,1
32,42,0
"""
    with open("test_train.csv", "w") as f:
        f.write(csv_content)
        
    try:
        with open("test_train.csv", "rb") as f:
            files = {"file": ("test_train.csv", f, "text/csv")}
            response = requests.post(url, files=files)
            
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if os.path.exists("test_train.csv"):
            os.remove("test_train.csv")

if __name__ == "__main__":
    test_ml_train()
