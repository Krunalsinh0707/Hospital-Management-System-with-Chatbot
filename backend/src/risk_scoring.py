def calculate_risk(analysis_results, diabetes_prediction):
    score = 0

    # Rule-based risk from abnormal parameters
    for param, status, _ in analysis_results:
        if status == "High":
            score += 2
        elif status == "Low":
            score += 1

    # ML-based diabetes risk
    if diabetes_prediction == 1:
        score += 3

    # Final risk level
    if score <= 2:
        return "Low Risk"
    elif score <= 5:
        return "Medium Risk"
    else:
        return "High Risk"
