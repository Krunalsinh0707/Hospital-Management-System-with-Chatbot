def recommend_specialist(conditions):
    specialists = set()

    for condition in conditions:
        if "Diabetes" in condition:
            specialists.add("Endocrinologist")
        if "Hypertension" in condition:
            specialists.add("Cardiologist")
        if "Obesity" in condition:
            specialists.add("Dietician")

    if not specialists:
        specialists.add("General Physician")

    return list(specialists)
