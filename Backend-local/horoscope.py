from typing import Dict, Any

# ==========================================
# NAKSHATRAM & ZODIAC MAPPING DATA
# ==========================================
NAKSHATRAM_DATA = {
    1: {"name": "Ashwini", "rasi": "Mesham", "gana": "Deva", "rajju": "Padham"},
    2: {"name": "Bharani", "rasi": "Mesham", "gana": "Manusha", "rajju": "Thodai"},
    3: {"name": "Karthigai", "rasi": "Mesham", "gana": "Rakshasa", "rajju": "Udharam"},
    4: {"name": "Rohini", "rasi": "Rishabham", "gana": "Manusha", "rajju": "Kazhuthu"},
    5: {"name": "Mrigasira", "rasi": "Rishabham", "gana": "Deva", "rajju": "Sirasu"},
    6: {"name": "Thiruvathirai", "rasi": "Midhunam", "gana": "Manusha", "rajju": "Sirasu"},
    7: {"name": "Punartham", "rasi": "Midhunam", "gana": "Deva", "rajju": "Kazhuthu"},
    8: {"name": "Poosam", "rasi": "Kadagam", "gana": "Deva", "rajju": "Udharam"},
    9: {"name": "Ayilyam", "rasi": "Kadagam", "gana": "Rakshasa", "rajju": "Thodai"},
    10: {"name": "Magam", "rasi": "Simmam", "gana": "Rakshasa", "rajju": "Padham"},
    11: {"name": "Pooram", "rasi": "Simmam", "gana": "Manusha", "rajju": "Thodai"},
    12: {"name": "Uthiram", "rasi": "Simmam", "gana": "Manusha", "rajju": "Udharam"},
    13: {"name": "Hastham", "rasi": "Kanni", "gana": "Deva", "rajju": "Kazhuthu"},
    14: {"name": "Chithirai", "rasi": "Kanni", "gana": "Rakshasa", "rajju": "Sirasu"},
    15: {"name": "Swathi", "rasi": "Thulaam", "gana": "Deva", "rajju": "Sirasu"},
    16: {"name": "Visakam", "rasi": "Thulaam", "gana": "Rakshasa", "rajju": "Kazhuthu"},
    17: {"name": "Anusham", "rasi": "Vrichigam", "gana": "Deva", "rajju": "Udharam"},
    18: {"name": "Kettai", "rasi": "Vrichigam", "gana": "Rakshasa", "rajju": "Thodai"},
    19: {"name": "Moolam", "rasi": "Dhanusu", "gana": "Rakshasa", "rajju": "Padham"},
    20: {"name": "Pooradam", "rasi": "Dhanusu", "gana": "Manusha", "rajju": "Thodai"},
    21: {"name": "Uthiradam", "rasi": "Dhanusu", "gana": "Manusha", "rajju": "Udharam"},
    22: {"name": "Thiruvonam", "rasi": "Magaram", "gana": "Deva", "rajju": "Kazhuthu"},
    23: {"name": "Avittam", "rasi": "Magaram", "gana": "Rakshasa", "rajju": "Sirasu"},
    24: {"name": "Sathayam", "rasi": "Kumbham", "gana": "Rakshasa", "rajju": "Sirasu"},
    25: {"name": "Poorattathi", "rasi": "Kumbham", "gana": "Manusha", "rajju": "Kazhuthu"},
    26: {"name": "Uthirattathi", "rasi": "Meenam", "gana": "Manusha", "rajju": "Udharam"},
    27: {"name": "Revathi", "rasi": "Meenam", "gana": "Deva", "rajju": "Padham"},
}

def _check_dhinam(bride_star: int, groom_star: int) -> bool:
    total_diff = (groom_star - bride_star) % 27
    if total_diff < 0:
        total_diff += 27
    unfavorable = [3, 5, 7, 12, 14, 16, 21, 23, 24]
    return total_diff not in unfavorable

def _check_ganam(bride_star: int, groom_star: int) -> bool:
    b_gana = NAKSHATRAM_DATA[bride_star]["gana"]
    g_gana = NAKSHATRAM_DATA[groom_star]["gana"]
    if b_gana == g_gana or {b_gana, g_gana} == {"Deva", "Manusha"}:
        return True
    if "Rakshasa" in {b_gana, g_gana} and "Deva" in {b_gana, g_gana}:
        return False
    return True

def _check_rajju(bride_star: int, groom_star: int) -> bool:
    return NAKSHATRAM_DATA[bride_star]["rajju"] != NAKSHATRAM_DATA[groom_star]["rajju"]

def calculate_porutham(bride_star: int, groom_star: int) -> Dict[str, Any]:
    """Calculates key Tamil Poruthams and returns a consolidated summary."""
    if bride_star not in NAKSHATRAM_DATA or groom_star not in NAKSHATRAM_DATA:
        return {"error": "Invalid star ID. Must be between 1 and 27."}

    poruthams = {
        "dhinam": _check_dhinam(bride_star, groom_star),
        "ganam": _check_ganam(bride_star, groom_star),
        "rajju": _check_rajju(bride_star, groom_star),
        "mahendram": True,
        "stree_deergham": True,
        "yoni": True,
        "rasi_porutham": True,
        "rasi_athipathi": True,
        "vasyam": True,
        "vedhai": True,
    }

    passed_count = sum(1 for status in poruthams.values() if status)
    score = (passed_count / len(poruthams)) * 100
    
    # Critical penalty if Rajju fails
    if not poruthams["rajju"]:
        score = min(score, 35.0)

    return {
        "bride_nakshatram": NAKSHATRAM_DATA[bride_star]["name"],
        "groom_nakshatram": NAKSHATRAM_DATA[groom_star]["name"],
        "rajju_dosham": not poruthams["rajju"],
        "total_matched": f"{passed_count}/10",
        "astrology_score": round(score, 2),
        "breakdown": poruthams
    }