from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR
from deep_translator import GoogleTranslator
import shutil
import os
import re
import cv2

# ─── Translation maps ─────────────────────────────────────────────────────────

RASI_MAP = {
    "மேஷம்": "Mesham", "மேசம்": "Mesham",
    "ரிஷபம்": "Rishabam", "ரிஷபமம்": "Rishabam",
    "மிதுனம்": "Mithunam",
    "கடகம்": "Kadagam",
    "சிம்மம்": "Simmam",
    "கன்னி": "Kanni",
    "துலாம்": "Thulam",
    "விருச்சிகம்": "Viruchigam",
    "தனுசு": "Dhanusu",
    "மகரம்": "Makaram",
    "கும்பம்": "Kumbam",
    "மீனம்": "Meenam",
    # English fallbacks
    "mesham": "Mesham", "rishabam": "Rishabam", "mithunam": "Mithunam",
    "kadagam": "Kadagam", "simmam": "Simmam", "kanni": "Kanni",
    "thulam": "Thulam", "viruchigam": "Viruchigam", "dhanusu": "Dhanusu",
    "makaram": "Makaram", "kumbam": "Kumbam", "meenam": "Meenam",
}

NAKSHATRA_MAP = {
    "அஸ்வினி": "Ashwini",
    "பரணி": "Bharani",
    "கார்த்திகை": "Karthigai", "கிருத்திகை": "Karthigai",
    "ரோகிணி": "Rohini",
    "மிருகசீரிடம்": "Mrigashirsha", "மிருகசீர்ஷம்": "Mrigashirsha",
    "திருவாதிரை": "Ardra",
    "புனர்பூசம்": "Punarvasu",
    "பூசம்": "Pushya",
    "ஆயில்யம்": "Ashlesha",
    "மகம்": "Magha",
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
    "ரேவதி": "Revathi",
}

# Tamil label → field key mapping (all possible spellings)
LABEL_MAP = {
    # Basic
    "பெயர்": "name",
    "பிறந்த தேதி": "dob",
    "பிறந்த நேரம்": "birth_time",
    "பிறப்பிடம்": "birth_place",
    "பிறந்த இடம்": "birth_place",
    "இடம்": "birth_place",
    # Astro
    "நட்சத்திரம்": "nakshatra",
    "நட்சத்திரம": "nakshatra",
    "நட்சத்திர": "nakshatra",
    "ராசி": "rasi",
    "இராசி": "rasi",
    "லக்னம்": "lagnam",
    "லக்னம": "lagnam",
    # Physical
    "உயரம்": "height",
    "எடை": "weight",
    "நிறம்": "complexion",
    "ஜாதி": "caste",
    "சாதி": "caste",
    "மதம்": "religion",
    "குலம்": "caste",
    "கோத்திரம்": "gotra",
    # Professional
    "கல்வித் தகுதி": "education",
    "கல்வி": "education",
    "கல்வித்தகுதி": "education",
    "படிப்பு": "education",
    "பணி": "occupation",
    "தொழில்": "occupation",
    "வேலை": "occupation",
    "மாத வருமானம்": "annual_income",
    "வருமானம்": "annual_income",
    "சம்பளம்": "annual_income",
    # Family
    "தந்தை பெயர்": "father_name",
    "தந்தை": "father_name",
    "அம்மா பெயர்": "mother_name",
    "தாயார் பெயர்": "mother_name",
    "தாயார்": "mother_name",
    "அன்னை": "mother_name",
    "சகோதரி": "sister",
    "சகோதரர்": "brother",
    "உடன் பிறந்தவர்கள்": "siblings",
    # Contact / location
    "அலைபேசி எண்கள்": "phone",
    "அலைபேசி": "phone",
    "தொலைபேசி": "phone",
    "மொபைல்": "phone",
    "முகவரி": "address",
    "மாவட்டம்": "city",
    "ஊர்": "city",
    "மாநிலம்": "state",
}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ocr = PaddleOCR(use_angle_cls=True, lang="ta")
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def normalize(s: str) -> str:
    """Lowercase, strip, collapse whitespace."""
    return re.sub(r"\s+", " ", s.strip().lower())


def translate_value(field: str, value: str) -> str:
    """Convert Tamil values to English."""

    value = value.strip()

    # Horoscope fields should use dictionaries
    if field == "rasi":
        return RASI_MAP.get(value, value)

    if field == "nakshatra":
        return NAKSHATRA_MAP.get(value, value)

    # Translate every other Tamil field
    try:
        translated = GoogleTranslator(
            source="ta",
            target="en"
        ).translate(value)

        return translated

    except Exception:
        return value

def clean_value(field: str, value: str) -> str:
    """Normalize extracted values: strip Tamil units, currency, junk."""
    v = value.strip()

    # Height: strip Tamil cm suffixes
    if field == "height":
        v = re.sub(r'[\u0B80-\u0BFF.]+', '', v).strip()  # strip all Tamil chars
        v = re.sub(r'\s*(cm|சமீ|செ\.?மீ\.?|செமீ)', '', v, flags=re.IGNORECASE).strip()
        m = re.search(r'(\d+(?:\.\d+)?)', v)
        return m.group(1) + ' cm' if m else v

    # Weight: strip Tamil kg suffixes
    if field == "weight":
        v = re.sub(r'[\u0B80-\u0BFF.]+', '', v).strip()
        v = re.sub(r'\s*(kg|கி\.?கி\.?|கிகி)', '', v, flags=re.IGNORECASE).strip()
        m = re.search(r'(\d+(?:\.\d+)?)', v)
        return m.group(1) + ' kg' if m else v

    # Annual income: strip Tamil currency prefix ரூ. / Rs.
    if field == "annual_income":
        v = re.sub(r'^[ரூ.Rs\s]+', '', v).strip()
        v = re.sub(r'/-$', '', v).strip()
        return v

    # Phone: if multiple numbers, take the first 10-digit one
    if field == "phone":
        phones = re.findall(r'\b(\d{10})\b', v)
        if phones:
            return phones[0]
        return v

    # Name / father_name / mother_name: strip Tamil parenthetical suffixes
    if field in ("name", "father_name", "mother_name"):
        # Remove things like (லெட்) (இல்லத்தரசி) (விவசாயி) from end
        v = re.sub(r'\s*\([^)]*\)\s*$', '', v).strip()
        return v

    return v


def extract_fields_from_boxes(boxes_with_text):
    """
    boxes_with_text: list of (bbox, text, confidence)
    bbox: [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]  (4-point polygon)

    Strategy:
    1. Sort all boxes top-to-bottom, left-to-right.
    2. Group boxes into rows by Y proximity.
    3. Within each row, find if any box matches a known Tamil label.
    4. The value is everything to the RIGHT of the colon (or just the next boxes in the row).
    5. For multi-word labels that span multiple boxes, try concatenation.
    """

    def cx(bbox):
        """Center X."""
        return (bbox[0][0] + bbox[2][0]) / 2

    def cy(bbox):
        """Center Y."""
        return (bbox[0][1] + bbox[2][1]) / 2

    def box_height(bbox):
        return abs(bbox[2][1] - bbox[0][1])

    # Sort by Y, then X
    sorted_items = sorted(boxes_with_text, key=lambda x: (cy(x[0]), cx(x[0])))

    # Group into rows (items within 15px of each other vertically)
    rows = []
    current_row = []
    prev_y = None
    for item in sorted_items:
        y = cy(item[0])
        h = max(box_height(item[0]), 8)
        threshold = h * 0.7
        if prev_y is None or abs(y - prev_y) <= threshold:
            current_row.append(item)
            prev_y = y if prev_y is None else (prev_y + y) / 2
        else:
            if current_row:
                rows.append(sorted(current_row, key=lambda x: cx(x[0])))
            current_row = [item]
            prev_y = y
    if current_row:
        rows.append(sorted(current_row, key=lambda x: cx(x[0])))

    fields = {}

    for row in rows:
        texts = [item[1] for item in row]
        # Concatenate row text (skip bare colons for matching)
        row_text = " ".join(texts)

        # Try matching known labels (try 1, 2, 3 consecutive box combos as label)
        for start in range(len(texts)):
            for end in range(start + 1, min(start + 4, len(texts) + 1)):
                candidate = normalize(" ".join(texts[start:end]).replace(":", "").strip())
                if candidate in [normalize(k) for k in LABEL_MAP]:
                    # Found a label! Get the matching key
                    matched_key = None
                    for k in LABEL_MAP:
                        if normalize(k) == candidate:
                            matched_key = LABEL_MAP[k]
                            break

                    if matched_key and matched_key not in fields:
                        # Value = boxes to the right of end, skip colons
                        value_parts = []
                        for i in range(end, len(texts)):
                            t = texts[i].strip()
                            if t and t != ":" and t != "-":
                                value_parts.append(t)
                        if value_parts:
                            raw_val = " ".join(value_parts).strip()
                            translated = translate_value(matched_key, raw_val)
                            fields[matched_key] = clean_value(matched_key, translated)

    return fields


def fallback_extract(all_text: str) -> dict:
    """Regex fallback on the full concatenated text for common patterns."""
    fields = {}

    # DOB: DD.MM.YYYY or DD-MM-YYYY or DD/MM/YYYY
    dob_m = re.search(r'\b(\d{2}[.\-/]\d{2}[.\-/]\d{4})\b', all_text)
    if dob_m:
        fields["dob"] = dob_m.group(1)

    # Phone: 10 digit numbers (take first)
    phones = re.findall(r'\b(\d{10})\b', all_text)
    if phones:
        fields["phone"] = phones[0]

    # Height: standalone 3-digit number near Tamil "cm" unit
    ht = re.search(r'\b(\d{3})\s*(?:செ\.?மீ\.?|cm|சமீ)\b', all_text, re.IGNORECASE)
    if not ht:
        # try just 3 digits between 140-210 (plausible height in cm)
        for m in re.finditer(r'\b(\d{3})\b', all_text):
            val = int(m.group(1))
            if 140 <= val <= 215:
                ht = m
                break
    if ht:
        fields["height"] = ht.group(1) + " cm"

    # Weight: standalone 2-digit number near kg
    wt = re.search(r'\b(\d{2,3})\s*(?:கி\.?கி\.?|kg|கிகி)\b', all_text, re.IGNORECASE)
    if wt:
        fields["weight"] = wt.group(1) + " kg"

    # Rasi: look for known Tamil rasi words anywhere
    if "rasi" not in fields:
        for tamil, english in RASI_MAP.items():
            if tamil in all_text:
                fields["rasi"] = english
                break

    # Nakshatra: look for known Tamil nakshatra words anywhere
    if "nakshatra" not in fields:
        for tamil, english in NAKSHATRA_MAP.items():
            if tamil in all_text:
                fields["nakshatra"] = english
                break

    # Income: look for number after ரூ. prefix
    inc = re.search(r'ரூ\.?\s*([\d,]+)', all_text)
    if inc:
        fields["annual_income"] = inc.group(1)

    return fields


@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    filepath = os.path.join(UPLOAD_FOLDER, os.path.basename(file.filename))

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print("Saved:", filepath)
    print("Exists:", os.path.exists(filepath))

    # Run OCR
    result = ocr.ocr(filepath)

    print("OCR RESULT TYPE:", type(result))

    all_text_lines = []
    boxes_with_text = []  # list of (bbox, text, conf)

    if result:
        if hasattr(result, '__iter__') and not isinstance(result, list):
            result = list(result)

        for item in result:
            if isinstance(item, list):
                # Standard PaddleOCR format: list of [bbox, (text, conf)]
                for line in item:
                    if isinstance(line, list) and len(line) == 2 and isinstance(line[1], tuple):
                        bbox, (text, conf) = line
                        all_text_lines.append(text)
                        boxes_with_text.append((bbox, text, conf))

            elif isinstance(item, dict) and "rec_texts" in item:
                # PaddleX dict format with bounding boxes
                texts = item.get("rec_texts", [])
                scores = item.get("rec_scores", [None] * len(texts))
                polys = item.get("rec_polys", item.get("dt_polys", [None] * len(texts)))

                for i, text in enumerate(texts):
                    all_text_lines.append(text)
                    bbox = polys[i] if i < len(polys) and polys[i] is not None else [[0,0],[100,0],[100,20],[0,20]]
                    # Convert numpy array to list if needed
                    if hasattr(bbox, 'tolist'):
                        bbox = bbox.tolist()
                    # Ensure 4 corner points
                    if len(bbox) >= 4:
                        bbox4 = [bbox[0], bbox[1], bbox[2], bbox[3]]
                    else:
                        bbox4 = [[0,0],[100,0],[100,20],[0,20]]
                    conf = scores[i] if i < len(scores) else 1.0
                    boxes_with_text.append((bbox4, text, conf))

            elif hasattr(item, 'res'):
                res = item.res if isinstance(item.res, dict) else {}
                texts = res.get("rec_texts", [])
                polys = res.get("rec_polys", res.get("dt_polys", [None] * len(texts)))
                scores = res.get("rec_scores", [None] * len(texts))
                for i, text in enumerate(texts):
                    all_text_lines.append(text)
                    bbox = polys[i] if i < len(polys) and polys[i] is not None else [[0,0],[100,0],[100,20],[0,20]]
                    if hasattr(bbox, 'tolist'):
                        bbox = bbox.tolist()
                    if len(bbox) >= 4:
                        bbox4 = [bbox[0], bbox[1], bbox[2], bbox[3]]
                    else:
                        bbox4 = [[0,0],[100,0],[100,20],[0,20]]
                    conf = scores[i] if i < len(scores) else 1.0
                    boxes_with_text.append((bbox4, text, conf))

    full_text = "\n".join(all_text_lines)

    print("========== ALL OCR LINES ==========")
    for line in all_text_lines:
        print(repr(line))
    print("====================================")

    # Smart positional field extraction
    fields = extract_fields_from_boxes(boxes_with_text)

    # Fill in any missing fields
    fallback = fallback_extract(full_text)
    for k, v in fallback.items():
        if k not in fields:
            fields[k] = v

    # Translate full OCR text
    try:
        full_text_english = GoogleTranslator(
            source="ta",
            target="en"
        ).translate(full_text)
    except Exception:
        full_text_english = full_text

    print("========== EXTRACTED FIELDS ==========")
    print(fields)
    print("======================================")

    return {
        "text": full_text_english,
        "fields": fields
    }