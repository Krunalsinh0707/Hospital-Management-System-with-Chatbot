def analyze_parameters(patient):
    analysis = []

    # Glucose
    if patient['Glucose'] < 70:
        analysis.append(("Glucose", "Low", "Low blood sugar detected"))
    elif patient['Glucose'] <= 140:
        analysis.append(("Glucose", "Normal", "Blood sugar level is normal"))
    else:
        analysis.append(("Glucose", "High", "High blood sugar indicates diabetes risk"))

    # Blood Pressure
    if patient['BloodPressure'] < 90:
        analysis.append(("Blood Pressure", "Low", "Low blood pressure detected"))
    elif patient['BloodPressure'] <= 120:
        analysis.append(("Blood Pressure", "Normal", "Blood pressure is normal"))
    else:
        analysis.append(("Blood Pressure", "High", "High blood pressure may indicate hypertension"))

    # BMI
    if patient['BMI'] < 18.5:
        analysis.append(("BMI", "Low", "Underweight condition"))
    elif patient['BMI'] <= 24.9:
        analysis.append(("BMI", "Normal", "Healthy body weight"))
    else:
        analysis.append(("BMI", "High", "Overweight or obesity detected"))

    return analysis
