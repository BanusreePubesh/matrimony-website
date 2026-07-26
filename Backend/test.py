import cv2
import pytesseract
from PIL import Image
import re


RASI_MAP = {
    "மேஷம்": "Mesham",
    "ரிஷபம்": "Rishabam",
    "மிதுனம்": "Mithunam",
    "கடகம்": "Kadagam",
    "சிம்மம்": "Simmam",
    "கன்னி": "Kanni",
    "துலாம்": "Thulam",
    "விருச்சிகம்": "Viruchigam",
    "தனுசு": "Dhanusu",
    "மகரம்": "Magaram",
    "கும்பம்": "Kumbam",
    "மீனம்": "Meenam"
}


NAKSHATRA_MAP = {
    "அசுவினி": "Ashwini",
    "பரணி": "Bharani",
    "கார்த்திகை": "Karthigai",
    "ரோகிணி": "Rohini",
    "மிருகசீரிடம்": "Mrigashirsha",
    "திருவாதிரை": "Thiruvathirai",
    "புனர்பூசம்": "Punarpoosam",
    "பூசம்": "Poosam",
    "ஆயில்யம்": "Ayilyam",
    "மகம்": "Magham",
    "பூரம்": "Pooram",
    "உத்திரம்": "Uthiram",
    "ஹஸ்தம்": "Hastham",
    "சித்திரை": "Chithirai",
    "சுவாதி": "Swathi",
    "விசாகம்": "Visakam",
    "அனுஷம்": "Anusham",
    "கேட்டை": "Kettai",
    "மூலம்": "Moolam",
    "பூராடம்": "Pooradam",
    "உத்திராடம்": "Uthiradam",
    "திருவோணம்": "Thiruvonam",
    "அவிட்டம்": "Avittam",
    "சதயம்": "Sadayam",
    "பூரட்டாதி": "Poorattadhi",
    "உத்திரட்டாதி": "Uthirattadhi",
    "ரேவதி": "Revathi"
}

# Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Read image
img = cv2.imread("sample.jpg")

# Resize (2x)
img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

# Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Remove noise
gray = cv2.GaussianBlur(gray, (3,3), 0)

# Threshold
gray = cv2.threshold(
    gray,
    0,
    255,
    cv2.THRESH_BINARY + cv2.THRESH_OTSU
)[1]

# Save processed image
cv2.imwrite("processed.jpg", gray)

# OCR
text = pytesseract.image_to_string(
    Image.open("processed.jpg"),
    lang="tam+eng",
    config="--oem 3 --psm 6"
)

print("OCR TEXT:\n")
print(text)
def extract_fields(text):

    fields = {}

    # Remove hidden unicode characters
    text = re.sub(r'[\u200b-\u200f\u202a-\u202e\u2060\ufeff]', '', text)

    lines = [line.strip() for line in text.split("\n") if line.strip()]

    for line in lines:

        if line.startswith("பெயர்"):
            fields["name"] = line.split(":")[-1].strip()

        elif line.startswith("பிறந்த தேதி"):
            fields["dob"] = line.split(":")[-1].strip()

        elif line.startswith("கல்வித்"):
            fields["qualification"] = line.split(":")[-1].strip()

        elif line.startswith("பணி"):
            value = re.sub(r"^பணி\s*[:53ல]*", "", line)
            fields["occupation"] = value.strip()

        elif line.startswith("மாத வருமானம்"):
            fields["salary"] = line.split(":")[-1].strip()

        elif line.startswith("நட்சத்திரம்"):
            fields["nakshatra"] = line.split(":")[-1].strip()

        elif line.startswith("இராசி"):
            value = re.sub(r"^இராசி\s*[:53ல]*", "", line)
            fields["rasi"] = value.strip()

        elif line.startswith("லக்னம்"):
            value = re.sub(r"^லக்னம்\s*[:53ல]*", "", line)
            fields["lagna"] = value.strip()

        elif line.startswith("உயரம்"):
            m = re.search(r"(\d+)", line)
            if m:
                fields["height"] = m.group(1) + " செ.மீ"

        elif line.startswith("எடை"):
            m = re.search(r"(\d+)", line)
            if m:
                fields["weight"] = m.group(1) + " கி.கி"

    fields["phones"] = re.findall(r"\d{10}", text)

    return fields
fields = extract_fields(text)

 patterns = {
        "fullName": r"பெயர்\s*[:：]?\s*(.+)",
        "dob": r"பிறந்த தேதி\s*[:：]?\s*(.+)",
        "education": r"கல்வித்\s*தகுதி\s*[:：]?\s*(.+)",
        "occupation": r"பணி\s*[:：]?\s*(.+)",
        "annualIncome": r"மாத வருமானம்\s*[:：]?\s*(.+)",
        "nakshatra": r"நட்சத்திரம்\s*[:：]?\s*(.+)",
        "rasi": r"இராசி\s*[:：]?\s*(.+)",
        "lagna": r"லக்னம்\s*[:：]?\s*(.+)",
        "height": r"உயரம்\s*[:：]?\s*(.+)",
        "weight": r"எடை\s*[:：]?\s*(.+)"
    }
    
    for key, pattern in patterns.items():
    m = re.search(pattern, text)
    if m:
        fields[key] = m.group(1).strip()

phones = re.findall(r"\d{10}", text)
fields["phones"] = phones
fields["rasi"] = RASI_MAP.get(fields.get("rasi", ""), fields.get("rasi"))
fields["nakshatra"] = NAKSHATRA_MAP.get(fields.get("nakshatra", ""), fields.get("nakshatra"))
fields.setdefault("birthTime", "")
fields.setdefault("birthPlace", "")
fields.setdefault("email", "")
fields.setdefault("dosham", "None")
fields.setdefault("gotra", "")
fields.setdefault("motherTongue", "")
fields.setdefault("religion", "")
fields.setdefault("caste", "")
fields.setdefault("subCaste", "")
fields.setdefault("familyType", "")
fields.setdefault("complexion", "")
fields.setdefault("bloodGroup", "")
fields.setdefault("fatherName", "")
fields.setdefault("fatherJob", "")
fields.setdefault("motherName", "")
fields.setdefault("motherJob", "")
fields.setdefault("brothers", "")
fields.setdefault("sisters", "")
fields.setdefault("city", "")
fields.setdefault("state", "")
fields.setdefault("country", "")
fields.setdefault("address", "")
print("\nExtracted Fields:\n")
fields = extract_fields(text)

return {
    "success": True,
    "text": text,
    "fields": fields
}