import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_diabetes_model():
    print("Training Diabetes Model...")
    np.random.seed(42)
    n = 1000
    
    glucose = np.random.normal(120, 30, n).clip(60, 240)
    bmi = np.random.normal(28, 6, n).clip(15, 50)
    age = np.random.normal(45, 14, n).clip(18, 85)
    insulin = np.random.normal(80, 40, n).clip(15, 300)
    bp = np.random.normal(75, 12, n).clip(50, 130)
    skin = np.random.normal(20, 10, n).clip(5, 60)
    dpf = np.random.exponential(0.4, n).clip(0.08, 2.4)
    
    # Clinical probability score
    score = (
        0.03 * (glucose - 100) +
        0.05 * (bmi - 25) +
        0.02 * (age - 30) +
        0.4 * dpf +
        0.01 * (insulin - 70)
    )
    prob = 1 / (1 + np.exp(-score))
    y = (prob > 0.5).astype(int)
    
    X = pd.DataFrame({
        'Glucose': glucose,
        'BloodPressure': bp,
        'SkinThickness': skin,
        'Insulin': insulin,
        'BMI': bmi,
        'DiabetesPedigreeFunction': dpf,
        'Age': age
    })
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)
    
    model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall": round(recall_score(y_test, y_pred), 4),
        "f1_score": round(f1_score(y_test, y_pred), 4),
        "auc_roc": round(roc_auc_score(y_test, y_proba), 4),
        "algorithm": "RandomForestClassifier",
        "features": list(X.columns)
    }
    
    joblib.dump(model, os.path.join(MODELS_DIR, "diabetes_model.pkl"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "diabetes_scaler.pkl"))
    with open(os.path.join(MODELS_DIR, "diabetes_metadata.json"), "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"[OK] Diabetes Model Trained - Accuracy: {metrics['accuracy']}, AUC-ROC: {metrics['auc_roc']}")
    return metrics

def train_heart_model():
    print("Training Heart Disease Model...")
    np.random.seed(42)
    n = 1000
    
    age = np.random.randint(29, 78, n)
    sex = np.random.binomial(1, 0.65, n)
    cp = np.random.choice([0, 1, 2, 3], n, p=[0.45, 0.2, 0.25, 0.1])
    trestbps = np.random.normal(130, 18, n).clip(94, 200)
    chol = np.random.normal(245, 50, n).clip(126, 564)
    fbs = np.random.binomial(1, 0.15, n)
    restecg = np.random.choice([0, 1, 2], n, p=[0.5, 0.45, 0.05])
    thalach = np.random.normal(150, 22, n).clip(71, 202)
    exang = np.random.binomial(1, 0.32, n)
    oldpeak = np.random.exponential(1.0, n).clip(0, 6.2)
    slope = np.random.choice([0, 1, 2], n, p=[0.1, 0.45, 0.45])
    ca = np.random.choice([0, 1, 2, 3], n, p=[0.55, 0.22, 0.15, 0.08])
    thal = np.random.choice([1, 2, 3], n, p=[0.05, 0.55, 0.4])
    
    score = (
        0.04 * (age - 50) +
        0.5 * sex +
        0.8 * cp +
        0.02 * (trestbps - 120) +
        0.005 * (chol - 200) -
        0.03 * (thalach - 140) +
        0.9 * exang +
        0.6 * oldpeak +
        0.7 * ca +
        0.5 * (thal - 1)
    )
    prob = 1 / (1 + np.exp(-score))
    y = (prob > 0.5).astype(int)
    
    X = pd.DataFrame({
        'age': age, 'sex': sex, 'cp': cp, 'trestbps': trestbps, 'chol': chol,
        'fbs': fbs, 'restecg': restecg, 'thalach': thalach, 'exang': exang,
        'oldpeak': oldpeak, 'slope': slope, 'ca': ca, 'thal': thal
    })
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)
    
    model = RandomForestClassifier(n_estimators=120, max_depth=9, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall": round(recall_score(y_test, y_pred), 4),
        "f1_score": round(f1_score(y_test, y_pred), 4),
        "auc_roc": round(roc_auc_score(y_test, y_proba), 4),
        "algorithm": "RandomForestClassifier",
        "features": list(X.columns)
    }
    
    joblib.dump(model, os.path.join(MODELS_DIR, "heart_model.pkl"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "heart_scaler.pkl"))
    with open(os.path.join(MODELS_DIR, "heart_metadata.json"), "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"[OK] Heart Model Trained - Accuracy: {metrics['accuracy']}, AUC-ROC: {metrics['auc_roc']}")
    return metrics

def train_hypertension_model():
    print("Training Hypertension Model...")
    np.random.seed(42)
    n = 1000
    
    age = np.random.randint(20, 80, n)
    sex = np.random.binomial(1, 0.5, n)
    bmi = np.random.normal(27, 5, n).clip(16, 48)
    heart_rate = np.random.normal(72, 10, n).clip(48, 120)
    activity_level = np.random.choice([0, 1, 2], n, p=[0.4, 0.4, 0.2])
    smoker = np.random.binomial(1, 0.25, n)
    family_history = np.random.binomial(1, 0.35, n)
    
    score = (
        0.05 * (age - 40) +
        0.08 * (bmi - 24) +
        0.03 * (heart_rate - 70) -
        0.4 * activity_level +
        0.7 * smoker +
        0.8 * family_history
    )
    prob = 1 / (1 + np.exp(-score))
    y = (prob > 0.5).astype(int)
    
    X = pd.DataFrame({
        'age': age, 'sex': sex, 'bmi': bmi, 'heart_rate': heart_rate,
        'activity_level': activity_level, 'smoker': smoker, 'family_history': family_history
    })
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)
    
    model = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall": round(recall_score(y_test, y_pred), 4),
        "f1_score": round(f1_score(y_test, y_pred), 4),
        "auc_roc": round(roc_auc_score(y_test, y_proba), 4),
        "algorithm": "GradientBoostingClassifier",
        "features": list(X.columns)
    }
    
    joblib.dump(model, os.path.join(MODELS_DIR, "hypertension_model.pkl"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "hypertension_scaler.pkl"))
    with open(os.path.join(MODELS_DIR, "hypertension_metadata.json"), "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"[OK] Hypertension Model Trained - Accuracy: {metrics['accuracy']}, AUC-ROC: {metrics['auc_roc']}")
    return metrics

def train_cbc_model():
    print("Training CBC Pattern Model...")
    np.random.seed(42)
    n = 1200
    
    classes = ["Normal", "Iron Deficiency Anemia", "Megaloblastic Anemia", "Infection Pattern", "Thrombocytopenia"]
    
    records = []
    labels = []
    
    for _ in range(n):
        c = np.random.choice(classes, p=[0.4, 0.2, 0.15, 0.15, 0.1])
        labels.append(c)
        
        hb = np.random.normal(14, 1.5)
        rbc = np.random.normal(4.8, 0.5)
        wbc = np.random.normal(7000, 1500)
        plt = np.random.normal(250000, 50000)
        mcv = np.random.normal(90, 5)
        mch = np.random.normal(30, 2)
        rdw = np.random.normal(13, 1)
        neut = np.random.normal(55, 8)
        lymp = np.random.normal(30, 6)
        mono = np.random.normal(5, 1.5)
        eos = np.random.normal(3, 1)
        baso = np.random.normal(0.5, 0.2)
        
        if c == "Iron Deficiency Anemia":
            hb = np.random.normal(9.5, 1.2)
            mcv = np.random.normal(72, 4)
            mch = np.random.normal(22, 2)
            rdw = np.random.normal(17, 2)
        elif c == "Megaloblastic Anemia":
            hb = np.random.normal(9.8, 1.3)
            mcv = np.random.normal(108, 6)
            mch = np.random.normal(35, 3)
        elif c == "Infection Pattern":
            wbc = np.random.normal(16000, 3000)
            neut = np.random.normal(78, 5)
        elif c == "Thrombocytopenia":
            plt = np.random.normal(75000, 20000)
            
        records.append({
            'Hemoglobin': hb, 'RBC': rbc, 'WBC': wbc, 'Platelets': plt,
            'MCV': mcv, 'MCH': mch, 'RDW': rdw, 'Neutrophils': neut,
            'Lymphocytes': lymp, 'Monocytes': mono, 'Eosinophils': eos, 'Basophils': baso
        })
        
    X = pd.DataFrame(records)
    y = np.array(labels)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)
    
    model = RandomForestClassifier(n_estimators=120, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred, average="weighted"), 4),
        "recall": round(recall_score(y_test, y_pred, average="weighted"), 4),
        "f1_score": round(f1_score(y_test, y_pred, average="weighted"), 4),
        "algorithm": "RandomForestClassifier",
        "classes": list(model.classes_),
        "features": list(X.columns)
    }
    
    joblib.dump(model, os.path.join(MODELS_DIR, "cbc_model.pkl"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "cbc_scaler.pkl"))
    with open(os.path.join(MODELS_DIR, "cbc_metadata.json"), "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"[OK] CBC Pattern Model Trained - Accuracy: {metrics['accuracy']}")
    return metrics

if __name__ == "__main__":
    train_diabetes_model()
    train_heart_model()
    train_hypertension_model()
    train_cbc_model()
    print("\n[OK] ALL ML MODELS SUCCESSFULLY TRAINED AND SERIALIZED!")
