// Tamil 10 Porutham (பத்து பொருத்தங்கள்) Astrological Match Engine

export const NAKSHATRAS = [
  { id: 1, name: "Ashwini", tamil: "அஸ்வினி", rasi: "Mesham", rasiTamil: "மேஷம்", gana: "Deva", rajju: "Padham", yoni: "Horse", yoniSex: "M" },
  { id: 2, name: "Bharani", tamil: "பரணி", rasi: "Mesham", rasiTamil: "மேஷம்", gana: "Manusha", rajju: "Thodai", yoni: "Elephant", yoniSex: "M" },
  { id: 3, name: "Karthigai", tamil: "கார்த்திகை", rasi: "Mesham", rasiTamil: "மேஷம்", gana: "Rakshasa", rajju: "Udharam", yoni: "Goat", yoniSex: "F" },
  { id: 4, name: "Rohini", tamil: "ரோஹிணி", rasi: "Rishabham", rasiTamil: "ரிஷபம்", gana: "Manusha", rajju: "Kazhuthu", yoni: "Serpent", yoniSex: "M" },
  { id: 5, name: "Mrigasira", tamil: "மிருகசீரிஷம்", rasi: "Rishabham", rasiTamil: "ரிஷபம்", gana: "Deva", rajju: "Sirasu", yoni: "Serpent", yoniSex: "F" },
  { id: 6, name: "Thiruvathirai", tamil: "திருவாதிரை", rasi: "Midhunam", rasiTamil: "மிதுனம்", gana: "Manusha", rajju: "Kazhuthu", yoni: "Dog", yoniSex: "F" },
  { id: 7, name: "Punartham", tamil: "புனர்பூசம்", rasi: "Midhunam", rasiTamil: "மிதுனம்", gana: "Deva", rajju: "Kazhuthu", yoni: "Cat", yoniSex: "F" },
  { id: 8, name: "Poosam", tamil: "பூசம்", rasi: "Kadagam", rasiTamil: "கடகம்", gana: "Deva", rajju: "Udharam", yoni: "Goat", yoniSex: "M" },
  { id: 9, name: "Ayilyam", tamil: "ஆயில்யம்", rasi: "Kadagam", rasiTamil: "கடகம்", gana: "Rakshasa", rajju: "Thodai", yoni: "Cat", yoniSex: "M" },
  { id: 10, name: "Magam", tamil: "மகம்", rasi: "Simmam", rasiTamil: "சிம்மம்", gana: "Rakshasa", rajju: "Padham", yoni: "Rat", yoniSex: "M" },
  { id: 11, name: "Pooram", tamil: "பூரம்", rasi: "Simmam", rasiTamil: "சிம்மம்", gana: "Manusha", rajju: "Thodai", yoni: "Rat", yoniSex: "F" },
  { id: 12, name: "Uthiram", tamil: "உத்திரம்", rasi: "Simmam", rasiTamil: "சிம்மம்", gana: "Manusha", rajju: "Udharam", yoni: "Cow", yoniSex: "M" },
  { id: 13, name: "Hastham", tamil: "அஸ்தம்", rasi: "Kanni", rasiTamil: "கன்னி", gana: "Deva", rajju: "Kazhuthu", yoni: "Buffalo", yoniSex: "F" },
  { id: 14, name: "Chithirai", tamil: "சித்திரை", rasi: "Kanni", rasiTamil: "கன்னி", gana: "Rakshasa", rajju: "Sirasu", yoni: "Tiger", yoniSex: "F" },
  { id: 15, name: "Swathi", tamil: "சுவாதி", rasi: "Thulaam", rasiTamil: "துலாம்", gana: "Deva", rajju: "Kazhuthu", yoni: "Buffalo", yoniSex: "M" },
  { id: 16, name: "Visakam", tamil: "விசாகம்", rasi: "Thulaam", rasiTamil: "துலாம்", gana: "Rakshasa", rajju: "Kazhuthu", yoni: "Tiger", yoniSex: "M" },
  { id: 17, name: "Anusham", tamil: "அனுஷம்", rasi: "Vrichigam", rasiTamil: "விருச்சிகம்", gana: "Deva", rajju: "Udharam", yoni: "Deer", yoniSex: "F" },
  { id: 18, name: "Kettai", tamil: "கேட்டை", rasi: "Vrichigam", rasiTamil: "விருச்சிகம்", gana: "Rakshasa", rajju: "Thodai", yoni: "Deer", yoniSex: "M" },
  { id: 19, name: "Moolam", tamil: "மூலம்", rasi: "Dhanusu", rasiTamil: "தனுசு", gana: "Rakshasa", rajju: "Padham", yoni: "Dog", yoniSex: "M" },
  { id: 20, name: "Pooradam", tamil: "பூராடம்", rasi: "Dhanusu", rasiTamil: "தனுசு", gana: "Manusha", rajju: "Thodai", yoni: "Monkey", yoniSex: "M" },
  { id: 21, name: "Uthiradam", tamil: "உத்திராடம்", rasi: "Dhanusu", rasiTamil: "தனுசு", gana: "Manusha", rajju: "Udharam", yoni: "Mongoose", yoniSex: "M" },
  { id: 22, name: "Thiruvonam", tamil: "திருவோணம்", rasi: "Magaram", rasiTamil: "மகரம்", gana: "Deva", rajju: "Kazhuthu", yoni: "Monkey", yoniSex: "F" },
  { id: 23, name: "Avittam", tamil: "அவிட்டம்", rasi: "Magaram", rasiTamil: "மகரம்", gana: "Rakshasa", rajju: "Sirasu", yoni: "Lion", yoniSex: "F" },
  { id: 24, name: "Sathayam", tamil: "சதயம்", rasi: "Kumbham", rasiTamil: "கும்பம்", gana: "Rakshasa", rajju: "Kazhuthu", yoni: "Horse", yoniSex: "F" },
  { id: 25, name: "Poorattathi", tamil: "பூரட்டாதி", rasi: "Kumbham", rasiTamil: "கும்பம்", gana: "Manusha", rajju: "Kazhuthu", yoni: "Lion", yoniSex: "M" },
  { id: 26, name: "Uthirattathi", tamil: "உத்திரட்டாதி", rasi: "Meenam", rasiTamil: "மீனம்", gana: "Manusha", rajju: "Udharam", yoni: "Cow", yoniSex: "F" },
  { id: 27, name: "Revathi", tamil: "ரேவதி", rasi: "Meenam", rasiTamil: "மீனம்", gana: "Deva", rajju: "Padham", yoni: "Elephant", yoniSex: "F" }
];

export const RASIS = [
  { id: 1, name: "Mesham", tamil: "மேஷம்", lord: "Mars" },
  { id: 2, name: "Rishabham", tamil: "ரிஷபம்", lord: "Venus" },
  { id: 3, name: "Midhunam", tamil: "மிதுனம்", lord: "Mercury" },
  { id: 4, name: "Kadagam", tamil: "கடகம்", lord: "Moon" },
  { id: 5, name: "Simmam", tamil: "சிம்மம்", lord: "Sun" },
  { id: 6, name: "Kanni", tamil: "கன்னி", lord: "Mercury" },
  { id: 7, name: "Thulaam", tamil: "துலாம்", lord: "Venus" },
  { id: 8, name: "Vrichigam", tamil: "விருச்சிகம்", lord: "Mars" },
  { id: 9, name: "Dhanusu", tamil: "தனுசு", lord: "Jupiter" },
  { id: 10, name: "Magaram", tamil: "மகரம்", lord: "Saturn" },
  { id: 11, name: "Kumbham", tamil: "கும்பம்", lord: "Saturn" },
  { id: 12, name: "Meenam", tamil: "மீனம்", lord: "Jupiter" }
];

// Planet friendships
const PLANET_FRIENDS = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"]
};

// Enemy animal pairs for Yoni
const YONI_ENEMIES = [
  ["Horse", "Buffalo"],
  ["Elephant", "Lion"],
  ["Goat", "Monkey"],
  ["Serpent", "Mongoose"],
  ["Dog", "Deer"],
  ["Cat", "Rat"],
  ["Cow", "Tiger"]
];

// Mutual Vedhai star pairs
const VEDHAI_PAIRS = [
  [1, 18], [2, 17], [3, 16], [4, 15], [6, 22], [7, 21], [8, 20], [9, 19],
  [10, 27], [11, 26], [12, 25], [13, 24], [5, 14], [14, 23], [5, 23]
];

// Vasya pairs (Rasi index 1-12)
const VASYA_MAP = {
  1: [5, 8],
  2: [4, 7],
  3: [6],
  4: [8, 11],
  5: [10],
  6: [3, 2],
  7: [10],
  8: [4],
  9: [12],
  10: [11],
  11: [12],
  12: [10]
};

/**
 * Calculates full 10 Tamil Poruthams between Bride (Girl) and Groom (Boy)
 */
export function calculateTamilPorutham(brideStarId, groomStarId) {
  const bride = NAKSHATRAS.find(n => n.id === Number(brideStarId)) || NAKSHATRAS[3]; // Default Rohini
  const groom = NAKSHATRAS.find(n => n.id === Number(groomStarId)) || NAKSHATRAS[11]; // Default Uthiram

  const brideRasi = RASIS.find(r => r.name === bride.rasi) || RASIS[1];
  const groomRasi = RASIS.find(r => r.name === groom.rasi) || RASIS[4];

  // 1. Dina Porutham (தின பொருத்தம்)
  let countToGroom = ((groom.id - bride.id + 27) % 27) + 1;
  let dinaRem = countToGroom % 9;
  let dinaPass = [2, 4, 6, 8, 9, 0].includes(dinaRem) || [2, 4, 6, 8, 9, 11, 13, 15, 17, 18, 20, 22, 24, 26, 27].includes(countToGroom);

  // 2. Gana Porutham (கண பொருத்தம்)
  let ganaPass = false;
  if (bride.gana === groom.gana) {
    ganaPass = true;
  } else if (bride.gana === "Deva" || groom.gana === "Deva") {
    ganaPass = true;
  } else if (bride.gana === "Manusha" && groom.gana === "Deva") {
    ganaPass = true;
  }

  // 3. Yoni Porutham (யோனி பொருத்தம்)
  let yoniEnemy = YONI_ENEMIES.some(pair =>
    (pair.includes(bride.yoni) && pair.includes(groom.yoni) && bride.yoni !== groom.yoni)
  );
  let yoniPass = !yoniEnemy;

  // 4. Rasi Porutham (ராசி பொருத்தம்)
  let rasiDiff = ((groomRasi.id - brideRasi.id + 12) % 12) + 1;
  let rasiPass = ![2, 6, 8, 12].includes(rasiDiff);

  // 5. Rasi Adhipathi Porutham (ராசி அதிபதி பொருத்தம்)
  let bLord = brideRasi.lord;
  let gLord = groomRasi.lord;
  let rasiAdhipathiPass = (bLord === gLord) ||
    (PLANET_FRIENDS[bLord] && PLANET_FRIENDS[bLord].includes(gLord)) ||
    (PLANET_FRIENDS[gLord] && PLANET_FRIENDS[gLord].includes(bLord));

  // 6. Rajju Porutham (ரஜ்ஜு பொருத்தம்) - CRITICAL
  let rajjuDosham = bride.rajju === groom.rajju;
  let rajjuPass = !rajjuDosham;

  // 7. Vedhai Porutham (வேதை பொருத்தம்)
  let hasVedhai = VEDHAI_PAIRS.some(pair =>
    (pair[0] === bride.id && pair[1] === groom.id) || (pair[1] === bride.id && pair[0] === groom.id)
  );
  let vedhaiPass = !hasVedhai;

  // 8. Vasya Porutham (வசிய பொருத்தம்)
  let vasyaPass = (VASYA_MAP[brideRasi.id] && VASYA_MAP[brideRasi.id].includes(groomRasi.id)) ||
    (VASYA_MAP[groomRasi.id] && VASYA_MAP[groomRasi.id].includes(brideRasi.id)) || false;

  // 9. Mahendra Porutham (மகேந்திர பொருத்தம்)
  let mahendraPass = [4, 7, 10, 13, 16, 19, 22, 25].includes(countToGroom);

  // 10. Stree Deergam Porutham (ஸ்திரீ தீர்க்கம் பொருத்தம்)
  let streeDeergamPass = countToGroom > 13;

  const poruthams = [
    { name: "Dina Porutham", tamil: "தின பொருத்தம்", status: dinaPass, desc: "Health & Longevity" },
    { name: "Gana Porutham", tamil: "கண பொருத்தம்", status: ganaPass, desc: "Temperament & Nature" },
    { name: "Yoni Porutham", tamil: "யோனி பொருத்தம்", status: yoniPass, desc: "Physical Intimacy & Harmony" },
    { name: "Rasi Porutham", tamil: "ராசி பொருத்தம்", status: rasiPass, desc: "Family Harmony & Lineage" },
    { name: "Rasi Adhipathi", tamil: "ராசி அதிபதி பொருத்தம்", status: rasiAdhipathiPass, desc: "Rasi Lord Friendship" },
    { name: "Rajju Porutham", tamil: "ரஜ்ஜு பொருத்தம்", status: rajjuPass, desc: "Mandatory Longevity of Spouse" },
    { name: "Vedhai Porutham", tamil: "வேதை பொருத்தம்", status: vedhaiPass, desc: "Freedom from Affliction" },
    { name: "Vasya Porutham", tamil: "வசிய பொருத்தம்", status: vasyaPass, desc: "Mutual Attraction & Love" },
    { name: "Mahendra Porutham", tamil: "மகேந்திர பொருத்தம்", status: mahendraPass, desc: "Children & Prosperity" },
    { name: "Stree Deergam", tamil: "ஸ்திரீ தீர்க்கம் பொருத்தம்", status: streeDeergamPass, desc: "Wealth & Well-being" }
  ];

  let matchedCount = poruthams.filter(p => p.status).length;
  let scorePct = Math.round((matchedCount / 10) * 100);
  if (rajjuDosham) {
    scorePct = Math.min(scorePct, 45); // Rajju dosham severely impacts overall score
  }

  let grade = "Poor";
  if (scorePct >= 80 && !rajjuDosham) grade = "Uthamam (Uttam / Excellent)";
  else if (scorePct >= 60 && !rajjuDosham) grade = "Madhyamam (Good / Medium)";
  else grade = "Adhamam (Not Recommended)";

  return {
    bride: { name: bride.name, tamil: bride.tamil, rasi: bride.rasi, rasiTamil: bride.rasiTamil },
    groom: { name: groom.name, tamil: groom.tamil, rasi: groom.rasi, rasiTamil: groom.rasiTamil },
    matched_count: matchedCount,
    total_poruthams: 10,
    matched_ratio: `${matchedCount}/10`,
    astrology_score: scorePct,
    grade,
    rajju_dosham: rajjuDosham,
    poruthams
  };
}
