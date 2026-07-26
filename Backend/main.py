from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import re
import shutil
import sys
from contextlib import asynccontextmanager
from difflib import SequenceMatcher
from paddleocr import PaddleOCR

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv
from google import genai
from google.genai import types
from paddleocr import PaddleOCR
from deep_translator import GoogleTranslator

ocr = PaddleOCR(use_angle_cls=False, lang='en')
try:
    import pytesseract
    from PIL import Image
    if os.name == "nt" and os.path.exists(r"C:\Program Files\Tesseract-OCR\tesseract.exe"):
        pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    elif shutil.which("tesseract"):
        pytesseract.pytesseract.tesseract_cmd = shutil.which("tesseract")
    HAS_TESSERACT = True
except Exception:
    HAS_TESSERACT = False

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except Exception:
    HAS_CV2 = False

def preprocess_image_variants(filepath):
    """Returns list of image filepaths (original, enhanced, thresholded) to maximize OCR extraction."""
    paths = [filepath]
    if not HAS_CV2:
        return paths
    try:
        img = cv2.imread(filepath)
        if img is None:
            return paths

        h, w = img.shape[:2]
        if max(h, w) < 1200:
            scale = 1500.0 / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        enhanced_path = filepath + "_enhanced.jpg"
        cv2.imwrite(enhanced_path, enhanced)
        paths.append(enhanced_path)
    except Exception as e:
        print("OpenCV preprocessing error:", e)
    return paths

# =========================
# ENV
# =========================

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

# =========================
# TRANSLATION MAPS
# =========================

RASI_MAP = {
    "மேஷம்": "Mesham", "மேசம்": "Mesham",
    "ரிஷபம்": "Rishabam", "மிதுனம்": "Mithunam",
    "கடகம்": "Kadagam", "சிம்மம்": "Simmam",
    "கன்னி": "Kanni", "துலாம்": "Thulam",
    "விருச்சிகம்": "Viruchigam", "தனுசு": "Dhanusu",
    "மகரம்": "Makaram", "கும்பம்": "Kumbam",
    "மீனம்": "Meenam"
}

NAKSHATRA_MAP = {
    "அஸ்வினி": "Ashwini", "பரணி": "Bharani",
    "கார்த்திகை": "Karthigai", "ரோகிணி": "Rohini",
    "திருவாதிரை": "Ardra", "புனர்பூசம்": "Punarvasu",
    "பூசம்": "Pushya", "மகம்": "Magha",
    "ஹஸ்தம்": "Hastham", "சித்திரை": "Chithirai",
    "சுவாதி": "Swathi", "விசாகம்": "Visakam",
    "அனுஷம்": "Anusham", "மூலம்": "Moolam",
    "ரேவதி": "Revathi"
}

LABEL_MAP = {
    "name": "name", "full name": "name", "பெயர்": "name",
    "dob": "dob", "date of birth": "dob", "பிறந்த தேதி": "dob",
    "birth time": "birth_time", "time of birth": "birth_time", "பிறந்த நேரம்": "birth_time",
    "birth place": "birth_place", "place of birth": "birth_place", "பிறந்த இடம்": "birth_place", "பிறப்பிடம்": "birth_place",
    "star": "nakshatra", "nakshatra": "nakshatra", "நட்சத்திரம்": "nakshatra",
    "rasi": "rasi", "raasi": "rasi", "ராசி": "rasi",
    "height": "height", "உயரம்": "height",
    "weight": "weight", "எடை": "weight",
    "complexion": "complexion", "நிறம்": "complexion",
    "religion": "religion", "மதம்": "religion",
    "caste": "caste", "ஜாதி": "caste", "சாதி": "caste",
    "education": "education", "கல்வி": "education", "படிப்பு": "education",
    "occupation": "occupation", "job": "occupation", "தொழில்": "occupation", "வேலை": "occupation",
    "income": "annual_income", "annual income": "annual_income", "வருமானம்": "annual_income", "மாத வருமானம்": "annual_income",
    "father name": "father_name", "father's name": "father_name", "தந்தை": "father_name", "தந்தை பெயர்": "father_name",
    "mother name": "mother_name", "mother's name": "mother_name", "தாயார்": "mother_name", "தாயார் பெயர்": "mother_name",
    "phone": "phone", "mobile": "phone", "contact": "phone", "தொலைபேசி": "phone", "மொபைல்": "phone", "அலைபேசி": "phone",
    "address": "address", "முகவரி": "address"
}

# =========================
# FASTAPI START
# =========================

ocr_en = None
ocr_ta = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ocr_en, ocr_ta
    print("Loading PaddleOCR engines...")
    try:
        ocr_en = PaddleOCR(use_angle_cls=True, lang="en")
        print("PaddleOCR (English) Ready")
    except Exception as e:
        print("PaddleOCR English load error:", e)
    try:
        ocr_ta = PaddleOCR(use_angle_cls=True, lang="ta")
        print("PaddleOCR (Tamil) Ready")
    except Exception as e:
        print("PaddleOCR Tamil load error:", e)

    yield

app = FastAPI(lifespan=lifespan)



app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)



UPLOAD_FOLDER="uploads"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

# =========================
# HELPER FUNCTIONS
# =========================


def normalize(text: str):

    return re.sub(
        r"\s+",
        " ",
        text.strip().lower()
    )



def similar(a, b, threshold=0.65):

    return SequenceMatcher(
        None,
        a,
        b
    ).ratio() >= threshold



# =========================
# TRANSLATION
# =========================


TAMIL_ENGLISH_MAP = {
    "இந்து": "Hindu",
    "கிறிஸ்தவர்": "Christian",
    "முஸ்லிம்": "Muslim",
    "சீக்கியர்": "Sikh",
    "ஜைனர்": "Jain",
    "பௌத்தர்": "Buddhist",
    "கொங்கு கவுண்டர்": "Kongu Gounder",
    "கவுண்டர்": "Gounder",
    "வன்னியர்": "Vanniyar",
    "முதலியார்": "Mudaliar",
    "நாடார்": "Nadar",
    "பிள்ளை": "Pillai",
    "செட்டியார்": "Chettiar",
    "நாயுடு": "Naidu",
    "தேவர்": "Thevar",
    "அய்யர்": "Iyer",
    "அய்யங்கார்": "Iyengar",
    "விஸ்வகர்மா": "Vishwakarma",
    "ஆதி திராவிடர்": "Adi Dravidar",
    "கோயம்புத்தூர்": "Coimbatore",
    "தமிழ்நாடு": "Tamil Nadu",
    "இந்தியா": "India",
    "சென்னை": "Chennai",
    "மதுரை": "Madurai",
    "திருச்சி": "Trichy",
    "சேலம்": "Salem",
    "ஈரோடு": "Erode",
    "திருப்பூர்": "Tirupur",
    "நெல்லை": "Tirunelveli",
    "வேலூர்": "Vellore",
    "பாண்டிச்சேரி": "Pondicherry",
    "துலாம்": "Thulam",
    "சுவாதி": "Swathi",
    "மகரம்": "Makaram",
    "திருவோணம்": "Thiruvonam",
    "மேஷம்": "Mesham",
    "ரிஷபம்": "Rishabam",
    "மிதுனம்": "Mithunam",
    "கடகம்": "Kadagam",
    "சிம்மம்": "Simmam",
    "கன்னி": "Kanni",
    "விருச்சிகம்": "Viruchigam",
    "தனுசு": "Dhanusu",
    "கும்பம்": "Kumbam",
    "மீனம்": "Meenam",
    "தமிழ்": "Tamil",
    "இல்லை": "No / None",
    "அணுக்க குடும்பம்": "Nuclear Family",
    "கூட்டு குடும்பம்": "Joint Family",
    "கோதுமை நிறம்": "Wheatish",
    "சிகப்பு": "Fair",
    "மாநிறம்": "Wheatish",
    "கருமை": "Dark",
    "தொழிலதிபர்": "Businessman",
    "இல்லத்தரசி": "Homemaker",
    "விவசாயி": "Farmer",
    "திருமணமானவர்": "Married",
    "திருமணம் ஆகாதவர்": "Unmarried / Single",
    "திரு.": "Mr.",
    "திருமதி.": "Mrs.",
    "செல்வன்": "Mr.",
    "செல்வி": "Ms.",
    "காலை": "Morning",
    "மாலை": "Evening",
    "இரவு": "Night"
}

def translate_to_english(text_str: str) -> str:
    if not text_str or not isinstance(text_str, str):
        return text_str

    v = text_str.strip()
    if not v:
        return v

    if v in TAMIL_ENGLISH_MAP:
        return TAMIL_ENGLISH_MAP[v]

    has_tamil = any('\u0b80' <= c <= '\u0bff' for c in v)
    if not has_tamil:
        return v

    for tamil_term, eng_term in TAMIL_ENGLISH_MAP.items():
        if tamil_term in v:
            v = v.replace(tamil_term, eng_term)

    has_tamil_remaining = any('\u0b80' <= c <= '\u0bff' for c in v)
    if not has_tamil_remaining:
        return v.strip()

    try:
        translated = GoogleTranslator(source="auto", target="en").translate(v)
        if translated and str(translated).strip():
            return str(translated).strip()
    except Exception as e:
        print("GoogleTranslator error:", e)

    return v

def translate_value(field, value):
    if not value or not str(value).strip():
        return value
    return translate_to_english(str(value).strip())





# =========================
# CLEAN VALUES
# =========================


def clean_value(field, value):

    v = value.strip()



    if field == "height":

        number = re.search(
            r"(\d+)",
            v
        )

        if number:
            return number.group(1)+" cm"



    if field == "weight":

        number = re.search(
            r"(\d+)",
            v
        )

        if number:
            return number.group(1)+" kg"



    if field in ["phone", "contactPhone", "mobile", "phone_no"]:
        p_clean = re.sub(r"[Xx]", "9", v)
        digits = re.sub(r"\D", "", p_clean)
        if len(digits) >= 10:
            return digits[:10]
        elif len(digits) > 0:
            return digits.ljust(10, '0')[:10]



    if field in [
        "name",
        "father_name",
        "mother_name"
    ]:

        v = re.sub(
            r"\([^)]*\)",
            "",
            v
        )

        v = re.sub(
            r"(திரு|திருமதி)\.?",
            "",
            v
        )

        return v.strip()



    return v





# =========================
# OCR BOX EXTRACTION
# =========================


def extract_fields_from_boxes(boxes_with_text):


    fields = {}


    detected_fields = set()



def extract_fields_from_boxes(boxes_with_text):
    fields = {}
    detected_fields = set()

    try:
        def get_coords(box):
            try:
                if isinstance(box, (list, tuple)):
                    if len(box) >= 4 and isinstance(box[0], (list, tuple)) and len(box[0]) >= 2:
                        x_center = (float(box[0][0]) + float(box[2][0])) / 2.0
                        y_center = (float(box[0][1]) + float(box[2][1])) / 2.0
                        h = abs(float(box[2][1]) - float(box[0][1]))
                        return x_center, y_center, h
                    elif len(box) >= 4 and isinstance(box[0], (int, float)):
                        x_center = (float(box[0]) + float(box[2])) / 2.0
                        y_center = (float(box[1]) + float(box[3])) / 2.0
                        h = abs(float(box[3]) - float(box[1]))
                        return x_center, y_center, h
            except Exception:
                pass
            return 0.0, 0.0, 10.0

        valid_items = []
        for item in boxes_with_text:
            if not item or len(item) < 2:
                continue
            box, text = item[0], item[1]
            if not text or not str(text).strip():
                continue
            cx_val, cy_val, h_val = get_coords(box)
            valid_items.append({
                "box": box,
                "text": str(text).strip(),
                "cx": cx_val,
                "cy": cy_val,
                "h": max(h_val, 10.0)
            })

        if not valid_items:
            return fields

        sorted_items = sorted(valid_items, key=lambda x: (x["cy"], x["cx"]))

        rows = []
        current = []
        previous_y = None

        for item in sorted_items:
            y = item["cy"]
            h = item["h"]
            if previous_y is None or abs(y - previous_y) < h:
                current.append(item)
                previous_y = y
            else:
                rows.append(sorted(current, key=lambda x: x["cx"]))
                current = [item]
                previous_y = y

        if current:
            rows.append(sorted(current, key=lambda x: x["cx"]))

        for row in rows:
            texts = [x["text"] for x in row]
            for start in range(len(texts)):
                for end in range(start + 1, min(start + 4, len(texts) + 1)):
                    candidate = normalize(" ".join(texts[start:end]).replace(":", ""))
                    matched_key = None
                    for label in LABEL_MAP:
                        if similar(candidate, normalize(label)):
                            matched_key = LABEL_MAP[label]
                            break

                    if matched_key is None or matched_key in detected_fields:
                        continue

                    values = [texts[i].strip() for i in range(end, len(texts)) if texts[i].strip() not in [":", "-"]]
                    if values:
                        raw = " ".join(values)
                        translated = translate_value(matched_key, raw)
                        cleaned = clean_value(matched_key, translated)
                        fields[matched_key] = cleaned
                        detected_fields.add(matched_key)
    except Exception as e:
        print("Error in box extraction:", e)

    return fields


    # =========================
# FALLBACK EXTRACTION
# =========================

def fallback_extract(text):
    fields = {}
    if not text:
        return fields

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    FIELD_PATTERNS = {
        "father_name": [r"father'?s?\s*name", r"father\s*name", r"father", r"தந்தை\s*பெயர்", r"தந்தை", r"அப்பா\s*பெயர்"],
        "father_job": [r"father'?s?\s*occupation", r"father\s*job", r"father\s*occupation", r"தந்தை\s*தொழில்", r"தந்தை\s*பணி"],
        "mother_name": [r"mother'?s?\s*name", r"mother\s*name", r"mother", r"தாயார்\s*பெயர்", r"தாயார்", r"அம்மா\s*பெயர்"],
        "mother_job": [r"mother'?s?\s*occupation", r"mother\s*job", r"mother\s*occupation", r"தாயார்\s*தொழில்", r"தாயார்\s*பணி"],
        "brother": [r"brother'?s?\s*name", r"brother", r"சகோதரர்"],
        "sister": [r"sister'?s?\s*name", r"sister", r"சகோதரி"],
        "sub_caste": [r"sub\s*caste", r"subcaste", r"உட்பிரிவு"],
        "birth_time": [r"birth\s*time", r"time\s*of\s*birth", r"birthtime", r"பிறந்த\s*நேரம்", r"ஜனன\s*நேரம்", r"ஜனன\s*காலம்"],
        "birth_place": [r"place\s*of\s*birth", r"birth\s*place", r"birthplace", r"பிறந்த\s*இடம்", r"பிறப்பிடம்"],
        "dob": [r"date\s*of\s*birth", r"oate\s*of\s*birth", r"dob", r"birth\s*date", r"பிறந்த\s*தேதி", r"தேதி"],
        "name": [r"candidate\s*name", r"groom\s*name", r"bride\s*name", r"full\s*name", r"name", r"பெயர்"],
        "rasi": [r"rashi", r"rasi", r"raasi", r"இராசி", r"ராசி"],
        "nakshatra": [r"nakshatram", r"nakshatra", r"nekshatre", r"star", r"நட்சத்திரம்", r"நக்ஷத்திரம்"],
        "lagnam": [r"lagnam", r"lagna", r"லக்னம்"],
        "manglik_status": [r"manglik\s*status", r"manglik", r"தோஷம்", r"செவ்வாய்\s*தோஷம்"],
        "religion": [r"religion", r"rutigion", r"மதம்"],
        "caste": [r"caste", r"சாதி", r"ஜாதி", r"குலம்"],
        "mother_tongue": [r"mother\s*tongue", r"mothertongue", r"தாய்மொழி"],
        "gotra": [r"gotra", r"gotram", r"கோத்திரம்"],
        "family_type": [r"family\s*type", r"குடும்ப\s*வகை"],
        "complexion": [r"complexion", r"நிறம்"],
        "blood_group": [r"blood\s*group", r"blood", r"இரத்த\s*வகை", r"ரத்த\s*வகை"],
        "height": [r"height", r"உயரம்"],
        "weight": [r"weight", r"எடை"],
        "education": [r"education", r"qualification", r"degree", r"கல்வித்\s*தகுதி", r"கல்வித்தகுதி", r"கல்வி", r"படிப்பு"],
        "occupation": [r"occupation", r"job", r"profession", r"work", r"பணி", r"தொழில்", r"வேலை"],
        "annual_income": [r"annual\s*income", r"income", r"salary", r"மாத\s*வருமானம்", r"வருமானம்", r"சம்பளம்"],
        "email": [r"email\s*id", r"email", r"மின்னஞ்சல்"],
        "phone": [r"phone\s*no\.?", r"phone", r"mobile", r"contact", r"அலைபேசி\s*எண்கள்", r"அலைபேசி", r"தொலைபேசி", r"தொடர்பு"],
        "address": [r"residential\s*address", r"address", r"முகவரி"],
        "city": [r"city", r"town", r"மாவட்டம்", r"ஊர்"],
        "state": [r"state", r"மாநிலம்"],
        "country": [r"country", r"தேசம்", r"நாடு"]
    }

    # Line-by-line Key-Value parsing
    for i, line in enumerate(lines):
        # Match "Label : Value" or "Label = Value" or "Label - Value"
        parts = re.split(r"\s*[:：\=\-\«\>5]\s*", line, maxsplit=1)
        if len(parts) == 2 and parts[0].strip() and parts[1].strip():
            raw_label = parts[0].strip()
            raw_val = parts[1].strip()

            for key, patterns in FIELD_PATTERNS.items():
                if key in fields:
                    continue
                for pat in patterns:
                    if re.search(r"\b" + pat + r"\b", raw_label, re.IGNORECASE):
                        fields[key] = translate_value(key, raw_val)
                        break

        # Fallback if value is on next line
        elif len(parts) == 1 and i + 1 < len(lines):
            raw_label = parts[0].strip()
            raw_val = lines[i+1].strip()

            for key, patterns in FIELD_PATTERNS.items():
                if key in fields:
                    continue
                for pat in patterns:
                    if re.search(r"^\s*" + pat + r"\s*$", raw_label, re.IGNORECASE):
                        fields[key] = translate_value(key, raw_val)
                        break

    # Standalone Regex Fallbacks for critical patterns anywhere in document
    if "phone" not in fields or not fields.get("phone"):
        phones = re.findall(r"\b[6-9][0-9\s\-Xx]{8,14}\b", text)
        for p_raw in phones:
            p_clean = re.sub(r"[Xx]", "9", p_raw)
            p_digits = re.sub(r"\D", "", p_clean)
            if len(p_digits) >= 10:
                fields["phone"] = p_digits[:10]
                break

    if "email" not in fields:
        emails = re.findall(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", text)
        if emails:
            fields["email"] = emails[0]

    if "dob" not in fields:
        dobs = re.findall(r"\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b", text)
        if dobs:
            fields["dob"] = dobs[0]

    return fields


def normalize_and_alias_fields(fields: dict) -> dict:
    alias_map = {
        "name": ["name", "fullName", "full_name"],
        "dob": ["dob", "dateOfBirth", "date_of_birth"],
        "birth_time": ["birth_time", "birthTime"],
        "birth_place": ["birth_place", "birthPlace"],
        "phone": ["phone", "contactPhone", "mobile", "phone_no"],
        "email": ["email"],
        "rasi": ["rasi", "raasi"],
        "nakshatra": ["nakshatra", "star"],
        "dosham": ["dosham", "dosam"],
        "gotra": ["gotra", "gotram"],
        "mother_tongue": ["mother_tongue", "motherTongue"],
        "religion": ["religion"],
        "caste": ["caste"],
        "sub_caste": ["sub_caste", "subCaste"],
        "family_type": ["family_type", "familyType"],
        "height": ["height"],
        "weight": ["weight"],
        "complexion": ["complexion"],
        "blood_group": ["blood_group", "bloodGroup"],
        "annual_income": ["annual_income", "annualIncome", "income", "salary"],
        "education": ["education"],
        "occupation": ["occupation", "job"],
        "father_name": ["father_name", "fatherName", "fathersName"],
        "father_job": ["father_job", "fatherJob", "fathersJob"],
        "mother_name": ["mother_name", "motherName", "mothersName"],
        "mother_job": ["mother_job", "motherJob", "mothersJob"],
        "brother": ["brother", "brotherName", "brothersName"],
        "sister": ["sister", "sisterName", "sistersName"],
        "city": ["city"],
        "state": ["state"],
        "country": ["country"],
        "address": ["address", "residentialAddress"]
    }

    result = {}
    for k, v in fields.items():
        if v and str(v).strip():
            result[k] = str(v).strip()

    for canonical_key, aliases in alias_map.items():
        val = ""
        for alias in aliases:
            if alias in fields and fields[alias] and str(fields[alias]).strip():
                val = str(fields[alias]).strip()
                break
        if val:
            for alias in aliases:
                result[alias] = val

    return result


# =========================
# OCR API
# =========================


@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_variants = preprocess_image_variants(filepath)

    global ocr_en, ocr_ta
    all_text = []
    boxes_with_text = []

    # 1. Try PaddleOCR across image variants
    primary_ocr = ocr_en or ocr_ta
    if primary_ocr is not None:
        for img_path in image_variants:
            try:
                result = primary_ocr.ocr(img_path)
                if result:
                    temp_text = []
                    temp_boxes = []
                    for page in result:
                        if page:
                            for line in page:
                                bbox = line[0]
                                text = line[1][0]
                                conf = line[1][1] if len(line[1]) > 1 else 1.0
                                temp_text.append(text)
                                temp_boxes.append((bbox, text, conf))
                    if temp_text and len(" ".join(temp_text).strip()) > len(" ".join(all_text).strip()):
                        all_text = temp_text
                        boxes_with_text = temp_boxes
            except Exception as e:
                print("Primary PaddleOCR processing error:", e)

    full_text = "\n".join(all_text)

    is_fragmented = False
    if all_text:
        avg_len = sum(len(t.strip()) for t in all_text) / max(len(all_text), 1)
        if avg_len < 2.5:
            is_fragmented = True

    # 2. Try pytesseract if primary OCR yields poor output
    if (is_fragmented or not full_text.strip() or len(full_text.strip()) < 10) and HAS_TESSERACT:
        for img_path in image_variants:
            try:
                tess_text = pytesseract.image_to_string(Image.open(img_path))
                if tess_text and len(tess_text.strip()) > len(full_text.strip()):
                    print("Using Pytesseract OCR output")
                    full_text = tess_text.strip()
                    is_fragmented = False
            except Exception as t_err:
                print("Pytesseract error:", t_err)

    # Positional Box & Fallback Regex Extraction
    box_fields = extract_fields_from_boxes(boxes_with_text) if boxes_with_text else {}
    regex_fields = fallback_extract(full_text)

    ai_fields = {}
    ai_extracted_text = ""
    gemini_error_msg = ""

    try:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key or not api_key.startswith("AIzaSy"):
            gemini_error_msg = "GEMINI_API_KEY in Backend-local/.env is invalid or missing. Please add a valid API Key from https://aistudio.google.com to enable 100% accurate AI vision OCR on blurry/handwritten images."
            print(f"[OCR NOTICE] {gemini_error_msg}")

        with open(filepath, "rb") as f:
            image_bytes = f.read()

        ext = file.filename.lower()
        mime_type = "image/jpeg"
        if ext.endswith(".png"):
            mime_type = "image/png"
        elif ext.endswith(".webp"):
            mime_type = "image/webp"

        prompt = f"""
        You are an expert data extractor for Tamil, English, and bilingual matrimony biodata documents.
        Analyze the attached document image directly as well as any OCR text provided.

        OCR Hint Text:
        {full_text}

        Perform 2 tasks:
        1. "extracted_text": Extract all readable text from the document clearly line by line in original language (Tamil/English).
        2. "fields": Extract key biodata details into JSON format matching these exact keys (use empty string "" if not found):
           - name (string)
           - dob (string, Date of birth)
           - birthTime (string)
           - birthPlace (string)
           - religion (string, e.g. Hindu / இந்து)
           - caste (string)
           - subCaste (string)
           - motherTongue (string)
           - bloodGroup (string, e.g. O+)
           - height (string)
           - weight (string)
           - education (string)
           - occupation (string)
           - income (string)
           - fatherName (string)
           - motherName (string)
           - phone (string)
           - city (string)
           - state (string)
           - country (string)
           - rasi (string)
           - nakshatra (string)
           - address (string)

        Return ONLY a JSON object with keys "extracted_text" and "fields". Do not include markdown code block formatting (no ```json).
        """

        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        available_models = []
        try:
            for m in client.models.list():
                m_name = getattr(m, "name", "")
                supported_methods = getattr(m, "supported_generation_methods", [])
                if m_name and "gemini" in m_name.lower() and ("generateContent" in supported_methods or not supported_methods):
                    available_models.append(m_name)
        except Exception as l_err:
            print("Error listing models from API:", l_err)

        model_candidates = available_models if available_models else [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "models/gemini-2.0-flash",
            "gemini-1.5-flash",
            "models/gemini-1.5-flash"
        ]

        response = None
        for model_name in model_candidates:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[image_part, prompt]
                )
                if response and response.text:
                    print(f"Successfully processed with Gemini model: {model_name}")
                    gemini_error_msg = ""
                    break
            except Exception as g_err:
                gemini_error_msg = str(g_err)
                print(f"Gemini model {model_name} error: {g_err}")

        if response and response.text:
            raw_output = response.text.strip()
            if raw_output.startswith("```"):
                first_newline = raw_output.find("\n")
                if first_newline != -1:
                    raw_output = raw_output[first_newline + 1:]
                if raw_output.endswith("```"):
                    raw_output = raw_output[:-3]

            parsed = json.loads(raw_output.strip())
            if isinstance(parsed, dict):
                if "fields" in parsed and isinstance(parsed["fields"], dict):
                    ai_fields = parsed["fields"]
                    ai_extracted_text = parsed.get("extracted_text", "")
                else:
                    ai_fields = parsed

    except Exception as e:
        print("Gemini extraction error:", e)

    # Replace fragmented or empty OCR text with Gemini Vision's clean extracted text if available
    if ai_extracted_text and (not full_text or is_fragmented or len(full_text.strip()) < 10):
        full_text = ai_extracted_text

    # Multi-tier merge: AI > Box > Regex
    merged_fields = {}
    merged_fields.update(regex_fields)
    merged_fields.update(box_fields)
    for k, v in ai_fields.items():
        if v and str(v).strip():
            merged_fields[k] = str(v).strip()

    final_fields = normalize_and_alias_fields(merged_fields)

    # Convert all extracted values to English and enforce strict 10-digit phone formatting
    english_fields = {}
    for k, v in final_fields.items():
        if v and str(v).strip():
            val_str = translate_to_english(str(v).strip())
            # Enforce 10 numeric digits for all phone keys
            if k in ["phone", "contactPhone", "mobile", "phone_no"] or "phone" in k.lower() or "mobile" in k.lower():
                p_clean = re.sub(r"[Xx]", "9", val_str)
                digits = re.sub(r"\D", "", p_clean)
                if len(digits) >= 10:
                    val_str = digits[:10]
                elif len(digits) > 0:
                    val_str = digits.ljust(10, '0')[:10]
            english_fields[k] = val_str
        else:
            english_fields[k] = ""

    res = {"success": True, "text": full_text, "fields": english_fields}
    if gemini_error_msg:
        res["note"] = gemini_error_msg

    try:
        print("========== OCR FINAL EXTRACTED FIELDS ==========")
        print(json.dumps(final_fields, ensure_ascii=False, indent=2))
        print("================================================")
    except Exception:
        pass

    return res

  
# =========================
# TEST API
# =========================


@app.get("/")
def home():

    return {

        "message":
        "Matrimony OCR API running"

    }





# from fastapi import FastAPI, UploadFile, File
# from fastapi.middleware.cors import CORSMiddleware
# from paddleocr import PaddleOCR
# from deep_translator import GoogleTranslator
# import shutil
# import os
# import re
# import cv2
# from contextlib import asynccontextmanager
# import pytesseract
# from google import genai
# from dotenv import load_dotenv
# import os


# load_dotenv()


# client = genai.Client(
#     api_key=os.getenv("GEMINI_API_KEY")
# )


# # ─── Translation maps ─────────────────────────────────────────────────────────

# RASI_MAP = {
#     "மேஷம்": "Mesham", "மேசம்": "Mesham",
#     "ரிஷபம்": "Rishabam", "ரிஷபமம்": "Rishabam",
#     "மிதுனம்": "Mithunam",
#     "கடகம்": "Kadagam",
#     "சிம்மம்": "Simmam",
#     "கன்னி": "Kanni",
#     "துலாம்": "Thulam",
#     "விருச்சிகம்": "Viruchigam",
#     "தனுசு": "Dhanusu",
#     "மகரம்": "Makaram",
#     "கும்பம்": "Kumbam",
#     "மீனம்": "Meenam",
#     # English fallbacks
#     "mesham": "Mesham", "rishabam": "Rishabam", "mithunam": "Mithunam",
#     "kadagam": "Kadagam", "simmam": "Simmam", "kanni": "Kanni",
#     "thulam": "Thulam", "viruchigam": "Viruchigam", "dhanusu": "Dhanusu",
#     "makaram": "Makaram", "kumbam": "Kumbam", "meenam": "Meenam",
# }

# NAKSHATRA_MAP = {
#     "அஸ்வினி": "Ashwini",
#     "பரணி": "Bharani",
#     "கார்த்திகை": "Karthigai", "கிருத்திகை": "Karthigai",
#     "ரோகிணி": "Rohini",
#     "மிருகசீரிடம்": "Mrigashirsha", "மிருகசீர்ஷம்": "Mrigashirsha",
#     "திருவாதிரை": "Ardra",
#     "புனர்பூசம்": "Punarvasu",
#     "பூசம்": "Pushya",
#     "ஆயில்யம்": "Ashlesha",
#     "மகம்": "Magha",
#     "பூரம்": "Pooram",
#     "உத்திரம்": "Uthiram",
#     "ஹஸ்தம்": "Hastham",
#     "சித்திரை": "Chithirai",
#     "சுவாதி": "Swathi",
#     "விசாகம்": "Visakam",
#     "அனுஷம்": "Anusham",
#     "கேட்டை": "Kettai",
#     "மூலம்": "Moolam",
#     "பூராடம்": "Pooradam",
#     "உத்திராடம்": "Uthiradam",
#     "திருவோணம்": "Thiruvonam",
#     "அவிட்டம்": "Avittam",
#     "சதயம்": "Sadayam",
#     "பூரட்டாதி": "Poorattadhi",
#     "உத்திரட்டாதி": "Uthirattadhi",
#     "ரேவதி": "Revathi",
# }

# # Tamil label → field key mapping (all possible spellings)
# LABEL_MAP = {
#     # Basic
#     "பெயர்": "name",
#     "பிறந்த தேதி": "dob",
#     "பிறந்த நேரம்": "birth_time",
#     "பிறப்பிடம்": "birth_place",
#     "பிறந்த இடம்": "birth_place",
#     "இடம்": "birth_place",
#     # Astro
#     "நட்சத்திரம்": "nakshatra",
#     "நட்சத்திரம": "nakshatra",
#     "நட்சத்திர": "nakshatra",
#     "ராசி": "rasi",
#     "இராசி": "rasi",
#     "லக்னம்": "lagnam",
#     "லக்னம": "lagnam",
#     # Physical
#     "உயரம்": "height",
#     "எடை": "weight",
#     "நிறம்": "complexion",
#     "ஜாதி": "caste",
#     "சாதி": "caste",
#     "மதம்": "religion",
#     "குலம்": "caste",
#     "கோத்திரம்": "gotra",
#     # Professional
#     "கல்வித் தகுதி": "education",
#     "கல்வி": "education",
#     "கல்வித்தகுதி": "education",
#     "படிப்பு": "education",
#     "பணி": "occupation",
#     "தொழில்": "occupation",
#     "வேலை": "occupation",
#     "மாத வருமானம்": "annual_income",
#     "வருமானம்": "annual_income",
#     "சம்பளம்": "annual_income",
#     # Family
#     "தந்தை பெயர்": "father_name",
#     "தந்தை": "father_name",
#     "அம்மா பெயர்": "mother_name",
#     "தாயார் பெயர்": "mother_name",
#     "தாயார்": "mother_name",
#     "அன்னை": "mother_name",
#     "சகோதரி": "sister",
#     "சகோதரர்": "brother",
#     "உடன் பிறந்தவர்கள்": "siblings",
#     # Contact / location
#     "அலைபேசி எண்கள்": "phone",
#     "அலைபேசி": "phone",
#     "தொலைபேசி": "phone",
#     "மொபைல்": "phone",
#     "முகவரி": "address",
#     "மாவட்டம்": "city",
#     "ஊர்": "city",
#     "மாநிலம்": "state",
# }

# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ocr = PaddleOCR(use_angle_cls=True, lang="ta")
# # ocr = PaddleOCR(use_angle_cls=True, lang='en')
# ocr = None

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     global ocr

#     print("Loading PaddleOCR...")

#     ocr = PaddleOCR(
#         use_angle_cls=True,
#         lang="en"
#     )
#     print("PaddleOCR Ready")

#     yield


# app = FastAPI(lifespan=lifespan)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
# UPLOAD_FOLDER = "uploads"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# def normalize(s: str) -> str:
#     """Lowercase, strip, collapse whitespace."""
#     return re.sub(r"\s+", " ", s.strip().lower())


# def translate_value(field: str, value: str) -> str:
#     """Convert Tamil values to English."""

#     value = value.strip()

#     # Horoscope fields should use dictionaries
#     if field == "rasi":
#         return RASI_MAP.get(value, value)

#     if field == "nakshatra":
#         return NAKSHATRA_MAP.get(value, value)

#     # Translate every other Tamil field
#     try:
#         translated = GoogleTranslator(
#             source="ta",
#             target="en"
#         ).translate(value)

#         return translated

#     except Exception:
#         return value

# def clean_value(field: str, value: str) -> str:
#     """Normalize extracted values: strip Tamil units, currency, junk."""
#     v = value.strip()

#     # Height: strip Tamil cm suffixes
#     if field == "height":
#         v = re.sub(r'[\u0B80-\u0BFF.]+', '', v).strip()  # strip all Tamil chars
#         v = re.sub(r'\s*(cm|சமீ|செ\.?மீ\.?|செமீ)', '', v, flags=re.IGNORECASE).strip()
#         m = re.search(r'(\d+(?:\.\d+)?)', v)
#         return m.group(1) + ' cm' if m else v

#     # Weight: strip Tamil kg suffixes
#     if field == "weight":
#         v = re.sub(r'[\u0B80-\u0BFF.]+', '', v).strip()
#         v = re.sub(r'\s*(kg|கி\.?கி\.?|கிகி)', '', v, flags=re.IGNORECASE).strip()
#         m = re.search(r'(\d+(?:\.\d+)?)', v)
#         return m.group(1) + ' kg' if m else v

#     # Annual income: strip Tamil currency prefix ரூ. / Rs.
#     if field == "annual_income":
#         v = re.sub(r'^[ரூ.Rs\s]+', '', v).strip()
#         v = re.sub(r'/-$', '', v).strip()
#         return v

#     # Phone: if multiple numbers, take the first 10-digit one
#     if field == "phone":
#         phones = re.findall(r'\b(\d{10})\b', v)
#         if phones:
#             return phones[0]
#         return v

#     # Name / father_name / mother_name: strip Tamil parenthetical suffixes
#     if field in ("name", "father_name", "mother_name"):
#         # Remove things like (லெட்) (இல்லத்தரசி) (விவசாயி) from end
#         v = re.sub(r'\s*\([^)]*\)\s*$', '', v).strip()
#         return v

#     return v


# def extract_fields_from_boxes(boxes_with_text):
#     """
#     boxes_with_text: list of (bbox, text, confidence)


#     FIELD_PRIORITY = [
#         "name",
#         "dob",
#         "birth_place",
#         "phone",
#         "father_name",
#         "mother_name"
#     ]

#     def cx(bbox):
#         return (bbox[0][0] + bbox[2][0]) / 2
#     bbox: [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]  (4-point polygon)

#     Strategy:
#     1. Sort all boxes top-to-bottom, left-to-right.
#     2. Group boxes into rows by Y proximity.
#     3. Within each row, find if any box matches a known Tamil label.
#     4. The value is everything to the RIGHT of the colon (or just the next boxes in the row).
#     5. For multi-word labels that span multiple boxes, try concatenation.
#     """

#     def cx(bbox):
#         """Center X."""
#         return (bbox[0][0] + bbox[2][0]) / 2

#     def cy(bbox):
#         """Center Y."""
#         return (bbox[0][1] + bbox[2][1]) / 2

#     def box_height(bbox):
#         return abs(bbox[2][1] - bbox[0][1])

#     # Sort by Y, then X
#     sorted_items = sorted(boxes_with_text, key=lambda x: (cy(x[0]), cx(x[0])))

#     # Group into rows (items within 15px of each other vertically)
#     rows = []
#     current_row = []
#     prev_y = None
#     for item in sorted_items:
#         y = cy(item[0])
#         h = max(box_height(item[0]), 8)
#         threshold = h * 0.7
#         if prev_y is None or abs(y - prev_y) <= threshold:
#             current_row.append(item)
#             prev_y = y if prev_y is None else (prev_y + y) / 2
#         else:
#             if current_row:
#                 rows.append(sorted(current_row, key=lambda x: cx(x[0])))
#             current_row = [item]
#             prev_y = y
#     if current_row:
#         rows.append(sorted(current_row, key=lambda x: cx(x[0])))

#     detected_fields = set()
#     for row in rows:
#         texts = [item[1] for item in row]
#         # Concatenate row text (skip bare colons for matching)
#         row_text = " ".join(texts)

#         # Try matching known labels (try 1, 2, 3 consecutive box combos as label)
#         for start in range(len(texts)):
#             for end in range(start + 1, min(start + 4, len(texts) + 1)):
#                 candidate = normalize(" ".join(texts[start:end]).replace(":", "").strip())

# def extract_fields_from_boxes(boxes_with_text):
#     """
#     boxes_with_text: list of (bbox, text, confidence)


#     FIELD_PRIORITY = [
#         "name",
#         "dob",
#         "birth_place",
#         "phone",
#         "father_name",
#         "mother_name"
#     ]

#     def cx(bbox):
#         return (bbox[0][0] + bbox[2][0]) / 2
#     bbox: [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]  (4-point polygon)

#     Strategy:
#     1. Sort all boxes top-to-bottom, left-to-right.
#     2. Group boxes into rows by Y proximity.
#     3. Within each row, find if any box matches a known Tamil label.
#     4. The value is everything to the RIGHT of the colon (or just the next boxes in the row).
#     5. For multi-word labels that span multiple boxes, try concatenation.
#     """

#     def cx(bbox):
#         """Center X."""
#         return (bbox[0][0] + bbox[2][0]) / 2

#     def cy(bbox):
#         """Center Y."""
#         return (bbox[0][1] + bbox[2][1]) / 2

#     def box_height(bbox):
#         return abs(bbox[2][1] - bbox[0][1])

#     # Sort by Y, then X
#     sorted_items = sorted(boxes_with_text, key=lambda x: (cy(x[0]), cx(x[0])))

#     # Group into rows (items within 15px of each other vertically)
#     rows = []
#     current_row = []
#     prev_y = None
#     for item in sorted_items:
#         y = cy(item[0])
#         h = max(box_height(item[0]), 8)
#         threshold = h * 0.7
#         if prev_y is None or abs(y - prev_y) <= threshold:
#             current_row.append(item)
#             prev_y = y if prev_y is None else (prev_y + y) / 2
#         else:
#             if current_row:
#                 rows.append(sorted(current_row, key=lambda x: cx(x[0])))
#             current_row = [item]
#             prev_y = y
#     if current_row:
#         rows.append(sorted(current_row, key=lambda x: cx(x[0])))

#     detected_fields = set()
#     for row in rows:
#         texts = [item[1] for item in row]
#         # Concatenate row text (skip bare colons for matching)
#         row_text = " ".join(texts)

#         # Try matching known labels (try 1, 2, 3 consecutive box combos as label)
#         for start in range(len(texts)):
#             for end in range(start + 1, min(start + 4, len(texts) + 1)):
#                 candidate = normalize(" ".join(texts[start:end]).replace(":", "").strip())
# matched_key = None

# for k in LABEL_MAP:
#     if similar(candidate, normalize(k)):
#         matched_key = LABEL_MAP[k]
#         break

# if matched_key:                  
#       # Found a label! Get the matching key
#                     matched_key = None
#                     for k in LABEL_MAP:
#                         if normalize(k) == candidate:
#                             matched_key = LABEL_MAP[k]
#                             break

#                     if matched_key:

#     # Do not replace already detected important fields
#     if matched_key in detected_fields:
#         continue

#     value_parts = []

#     for i in range(end, len(texts)):
#         t = texts[i].strip()
#         if t and t not in [":", "-"]:
#             value_parts.append(t)

#     if value_parts:

#         raw_val = " ".join(value_parts).strip()

#         translated = translate_value(
#             matched_key,
#             raw_val
#         )

#         cleaned = clean_value(
#             matched_key,
#             translated
#         )

#         fields[matched_key] = cleaned
#         detected_fields.add(matched_key)

#     print("FINAL EXTRACTED FIELDS:", fields)

#     return fields



# if matched_key:                  
#       # Found a label! Get the matching key
#                     matched_key = None
#                     for k in LABEL_MAP:
#                         if normalize(k) == candidate:
#                             matched_key = LABEL_MAP[k]
#                             break

#                     if matched_key:

#     # Do not replace already detected important fields
#     if matched_key in detected_fields:
#         continue

#     value_parts = []

#     for i in range(end, len(texts)):
#         t = texts[i].strip()
#         if t and t not in [":", "-"]:
#             value_parts.append(t)

#     if value_parts:

#         raw_val = " ".join(value_parts).strip()

#         translated = translate_value(
#             matched_key,
#             raw_val
#         )

#         cleaned = clean_value(
#             matched_key,
#             translated
#         )

#         fields[matched_key] = cleaned
#         detected_fields.add(matched_key)


#     return fields


# def fallback_extract(all_text: str) -> dict:
#     """Regex fallback on the full concatenated text for common patterns."""
#     fields = {}

#     # DOB: DD.MM.YYYY or DD-MM-YYYY or DD/MM/YYYY
#     dob_m = re.search(r'\b(\d{2}[.\-/]\d{2}[.\-/]\d{4})\b', all_text)
#     if dob_m:
#         fields["dob"] = dob_m.group(1)

#     # Phone: 10 digit numbers (take first)
#     phones = re.findall(r'\b(\d{10})\b', all_text)
#     if phones:
#         fields["phone"] = phones[0]

#     # Height: standalone 3-digit number near Tamil "cm" unit
#     ht = re.search(r'\b(\d{3})\s*(?:செ\.?மீ\.?|cm|சமீ)\b', all_text, re.IGNORECASE)
#     if not ht:
#         # try just 3 digits between 140-210 (plausible height in cm)
#         for m in re.finditer(r'\b(\d{3})\b', all_text):
#             val = int(m.group(1))
#             if 140 <= val <= 215:
#                 ht = m
#                 break
#     if ht:
#         fields["height"] = ht.group(1) + " cm"

#     # Weight: standalone 2-digit number near kg
#     wt = re.search(r'\b(\d{2,3})\s*(?:கி\.?கி\.?|kg|கிகி)\b', all_text, re.IGNORECASE)
#     if wt:
#         fields["weight"] = wt.group(1) + " kg"

#     # Rasi: look for known Tamil rasi words anywhere
#     if "rasi" not in fields:
#         for tamil, english in RASI_MAP.items():
#             if tamil in all_text:
#                 fields["rasi"] = english
#                 break

#     # Nakshatra: look for known Tamil nakshatra words anywhere
#     if "nakshatra" not in fields:
#         for tamil, english in NAKSHATRA_MAP.items():
#             if tamil in all_text:
#                 fields["nakshatra"] = english
#                 break

#     # Income: look for number after ரூ. prefix
#     inc = re.search(r'ரூ\.?\s*([\d,]+)', all_text)
#     if inc:
#         fields["annual_income"] = inc.group(1)

#     return fields


# @app.post("/ocr")
# async def extract_text(file: UploadFile = File(...)):

#     filepath = os.path.join(
#         UPLOAD_FOLDER,
#         os.path.basename(file.filename)
#     )
# with open(filepath, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)

#     print("Saved:", filepath)
#     print("Exists:", os.path.exists(filepath))

#     global ocr
# # Run OCR
#     result = ocr.ocr(filepath, cls=True)

   
# print("OCR RESULT TYPE:", type(result))

# all_text_lines = []
# boxes_with_text = []

# if result and result[0]:
#     for line in result[0]:
#         bbox = line[0]
#         text = line[1][0]
#         conf = line[1][1]

#         all_text_lines.append(text)
#         boxes_with_text.append((bbox, text, conf))

# full_text = "\n".join(all_text_lines)

#     print("========== ALL OCR LINES ==========")
#     for line in all_text_lines:
#         print(repr(line))
#     print("====================================")

#     # Smart positional field extraction
#     fields = extract_fields_from_boxes(boxes_with_text)

#     # Fill in any missing fields
#     fallback = fallback_extract(full_text)
#     for k, v in fallback.items():
#         if k not in fields:
#             fields[k] = v

#     # Translate full OCR text
#     try:
#         full_text_english = GoogleTranslator(
#             source="ta",
#             target="en"
#         ).translate(full_text)
#     except Exception:
#         full_text_english = full_text

#     print("========== EXTRACTED FIELDS ==========")
#     print(fields)
#     print("======================================")
# print("FINAL RESPONSE:")
# print({
#     "text": full_text_english,
#     "fields": fields
# })
#     return {
#         "text": full_text_english,
#         "fields": fields
#     }
# @app.get("/")
# def home():
#     return {
#         "message": "Matrimony OCR API running"
#     }