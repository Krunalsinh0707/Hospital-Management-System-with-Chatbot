def identify_conditions(analysis_results, diabetes_prediction):
    conditions = []

    for param, status, _ in analysis_results:
        if param == "Glucose" and status == "High":
            conditions.append("Possible Diabetes")
        if param == "Blood Pressure" and status == "High":
            conditions.append("Possible Hypertension")
        if param == "BMI" and status == "High":
            conditions.append("Obesity Risk")

    if diabetes_prediction == 1 and "Possible Diabetes" not in conditions:
        conditions.append("Possible Diabetes")

    return list(set(conditions))
