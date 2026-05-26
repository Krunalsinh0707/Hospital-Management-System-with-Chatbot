import pdfplumber
import re

from src.cbc_analysis import extract_cbc_from_text

try:
    from PIL import Image
    import pytesseract
except ImportError:
    Image = None
    pytesseract = None


def _extract_number(text, patterns):
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1).replace(",", "")
            try:
                return float(value)
            except ValueError:
                return None
    return None


# ✅ RENAMED FUNCTION (THIS FIXES YOUR ERROR)
def extract_parameters_from_pdf(file_path):
    text = ""
    lower_path = file_path.lower()

    if lower_path.endswith(".pdf"):
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"

    elif lower_path.endswith((".png", ".jpg", ".jpeg")):
        if not pytesseract or not Image:
            print("❌ pytesseract/PIL not installed. Cannot process images.")
            return {}

        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
        except Exception as e:
            print(f"❌ OCR Error: {e}")
            return {}

    data = {}

    patterns = {
        "Glucose": [
            r"Glucose\s*[:\-]?\s*(\d+(?:\.\d+)?)",
            r"Blood\s*Sugar\s*[:\-]?\s*(\d+(?:\.\d+)?)"
        ],
        "BloodPressure": [
            r"Blood\s*Pressure\s*[:\-]?\s*(\d+(?:\.\d+)?)",
            r"BP\s*[:\-]?\s*(\d+(?:\.\d+)?)"
        ],
        "BMI": [
            r"BMI\s*[:\-]?\s*(\d+(?:\.\d+)?)",
            r"Body\s*Mass\s*Index\s*[:\-]?\s*(\d+(?:\.\d+)?)"
        ],
        "Insulin": [r"Insulin\s*[:\-]?\s*(\d+(?:\.\d+)?)"],
        "SkinThickness": [r"Skin\s*Thickness\s*[:\-]?\s*(\d+(?:\.\d+)?)"],
        "DiabetesPedigreeFunction": [
            r"Diabetes\s*Pedigree\s*Function\s*[:\-]?\s*(\d+(?:\.\d+)?)",
            r"DPF\s*[:\-]?\s*(\d+(?:\.\d+)?)"
        ],
        "Age": [
            r"Age\s*[:\-]?\s*(\d+)",
            r"Age\s*\(years\)\s*[:\-]?\s*(\d+)"
        ]
    }

    for key, pattern_list in patterns.items():
        value = _extract_number(text, pattern_list)
        if value is not None:
            data[key] = int(value) if key in {"Age"} else float(value)

    return data


def extract_cbc_from_file(file_path):
    text = ""
    lower_path = file_path.lower()

    if lower_path.endswith(".pdf"):
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"

    elif lower_path.endswith((".png", ".jpg", ".jpeg")):
        if not pytesseract or not Image:
            print("❌ pytesseract/PIL not installed. Cannot process images.")
            return {}

        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
        except Exception as e:
            print(f"❌ OCR Error: {e}")
            return {}

    return extract_cbc_from_text(text)
