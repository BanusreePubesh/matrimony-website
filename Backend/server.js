import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import db from './db.js';
import { createWorker } from 'tesseract.js';
import { GoogleGenAI } from '@google/genai';
import { getDistance } from 'geolib';



const app = express();
app.use(cors());
app.use(express.json());
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database connection and create tables/seed data
db.initDB()
  .then(() => console.log("Database initialized successfully."))
  .catch(err => console.error("Database initialization failed:", err));


// Configure multer for file uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Memory storage for temporary OTP codes
const otpStore = new Map();

// ──────────────────────────────────────────────────────────────
// OTP TEST MODE
// Set OTP_TEST_MODE=true  in .env for testing  → OTP is always "1234", no SMS sent
// Set OTP_TEST_MODE=false in .env for production → real random OTP sent via SMS
// ──────────────────────────────────────────────────────────────
const isOtpTestMode = (process.env.OTP_TEST_MODE || "true").trim().toLowerCase() === "true";
console.log(`OTP Mode: ${isOtpTestMode ? "TEST (code=1234)" : "PRODUCTION (SMS enabled)"}`);

console.log("Ping4SMS API configured:", Boolean(process.env.PING4SMS_API_KEY));
// 1. Send OTP Endpoint
app.post("/api/otp/send-register", async (req, res) => {
    const { phone } = req.body;

    try {
        // Check if phone is already registered
        const rows = await db.query(
            "SELECT * FROM users WHERE phone = ?",
            [phone]
        );

console.log("Phone:", phone);
console.log("Rows:", rows);
console.log("Rows length:", rows?.length);

        if (rows && rows.length > 0) {
    return res.status(409).json({
        success: false,
        isRegistered: true,
        message: "This phone number is already registered. Please log in instead."
    });
}

        if (!phone || phone.length !== 10) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }

        // In test mode use "1234", in production generate random 4-digit OTP
        const otpCode = isOtpTestMode ? "1234" : Math.floor(1000 + Math.random() * 9000).toString();

        // Store OTP for 5 minutes
        otpStore.set(phone, {
            code: otpCode,
            expires: Date.now() + 300000
        });

        if (isOtpTestMode) {
            // TEST MODE — skip SMS, just log
            console.log(`TEST OTP for ${phone}: ${otpCode}`);
            return res.json({
                success: true,
                message: "OTP generated successfully"
            });
        }

        try {
            await sendSmsOtp(phone, otpCode);

            return res.json({
                success: true,
                message: "OTP sent successfully via SMS"
            });
        } catch (error) {
              console.error("========== BACKEND PING4SMS ERROR ==========");
              console.error(error.response?.data || error.message || error);
              otpStore.delete(phone);
              return res.status(502).json({ success: false, message: "Unable to send SMS OTP" });
        }

    } catch (err) {
        console.error("Database Error:", err);
        return res.status(500).json({
            success: false,
            message: "Database or server error"
        });
    }
});
async function sendSmsOtp(mobile, otp) {
  const apiKey = (process.env.PING4SMS_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("PING4SMS_API_KEY is not configured");
  }

  const cleanMobile = String(mobile).replace(/\D/g, "").replace(/^91/, "").slice(-10);
  if (cleanMobile.length !== 10) {
    throw new Error("Invalid mobile number");
  }

  const message = `Your Login Verification code: ${otp} Don't share this code with others -MERCURY`;
  const params = new URLSearchParams({
    key: apiKey,
    route: (process.env.PING4SMS_ROUTE || "2").trim(),
    sender: (process.env.PING4SMS_SENDER_ID || "MERSOF").trim(),
    number: cleanMobile,
    sms: message,
    templateid: (process.env.PING4SMS_TEMPLATE_ID || "1607100000000339284").trim()
  });

  let lastError;
  for (const endpoint of ["http://site.ping4sms.com/api/smsapi", "https://site.ping4sms.com/api/smsapi"]) {
    try {
      const response = await axios.get(`${endpoint}?${params.toString()}`, { timeout: 5000 });
      const responseText = String(response.data ?? "").trim();
      const lowerResponse = responseText.toLowerCase();
      if (responseText.includes("101")) {
        throw new Error("Ping4SMS account has insufficient balance");
      }
      if (!responseText || lowerResponse.includes("error") || lowerResponse.includes("invalid")) {
        throw new Error(`Ping4SMS rejected the request: ${responseText || "empty response"}`);
      }
      return responseText;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to connect to Ping4SMS");
}

// 2. Verify OTP Endpoint
app.post("/api/otp/verify", async (req, res) => {
  const { phone, otp } = req.body;

  // In test mode, always accept '1234' for any phone number
  const isTestOtpValid = isOtpTestMode && String(otp).trim() === "1234";

  if (!isTestOtpValid) {
    const record = otpStore.get(phone);

    if (!record) {
      return res.status(400).json({ success: false, message: "OTP expired or not sent" });
    }

    if (Date.now() > record.expires) {
      otpStore.delete(phone);
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (String(record.code).trim() !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    otpStore.delete(phone);
  } else {
    otpStore.delete(phone);
  }

  // OTP verified! Check if this user exists in MySQL
  try {
    const users = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
    
    if (users.length > 0) {
      const user = users[0];
      if (user.status === 'Blocked') {
        return res.status(403).json({ success: false, message: "Your account is blocked by the Admin." });
      }
      return res.json({
        success: true,
        message: "OTP Verified",
        isRegistered: true,
        user
      });
    } else {
      return res.json({
        success: true,
        message: "OTP Verified",
        isRegistered: false,
        phone
      });
    }
  } catch (err) {
    console.error("Database check failed:", err);
    res.status(500).json({ success: false, message: "Database lookup failed." });
  }
});

// 3. User Registration Endpoint
app.post('/api/register', upload.single('horoscope'), async (req, res) => {
  try {
    const { 
      phone, name, gender, age, city, state, country, pincode, 
      religion, caste, education, job, salary, height, complexion, 
      rasi, nakshatra, dosham, img, photo 
    } = req.body;

    const s = (v) => (Array.isArray(v) ? v[0] : v) ?? null;

    const phoneVal = s(phone);
    const nameVal = s(name);
    const genderVal = s(gender);
    const ageVal = s(age);

    if (!phoneVal || !nameVal || !genderVal) {
      return res.status(400).json({ success: false, message: "Phone, name and gender are required" });
    }

    const horoscopePath = req.file ? `/uploads/${req.file.filename}` : null;
    const genderStr = (genderVal || '').toLowerCase();
    const isFemale = genderStr.includes('female') || genderStr === 'bride' || genderStr === 'woman';
    
    // Save base64 extracted photo directly to static uploads directory if present
    let rawImg = s(img) || s(photo) || s(req.body.profile_image) || '';
    if (typeof rawImg === 'string') rawImg = rawImg.trim();

    let profileImg = rawImg;
    if (profileImg && typeof profileImg === 'string' && profileImg.startsWith('data:image/')) {
      try {
        const matches = profileImg.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mime = matches[1].toLowerCase();
          const ext = mime.includes('png') ? '.png' : mime.includes('webp') ? '.webp' : '.jpg';
          const filename = `photo-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
          const filePath = path.join(uploadsDir, filename);
          const buffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(filePath, buffer);
          profileImg = `/uploads/${filename}`;
        }
      } catch (saveErr) {
        console.warn("Failed to save base64 image to file, retaining base64 string:", saveErr);
      }
    } else if (!profileImg || (typeof profileImg === 'string' && profileImg.trim() === '')) {
      profileImg = isFemale 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&fit=crop&q=80' 
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&fit=crop&q=80';
    }

    // Save to MySQL
    const sql = `
      INSERT INTO users (
        phone, name, gender, age, city, state, country, pincode, 
        religion, caste, education, job, salary, height, complexion, 
        rasi, nakshatra, dosham, img, horoscope_path, premium_plan, views_used, interests_used, status, verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Basic', 0, 0, 'Active', 1)
    `;

    const rows = await db.query(
      "SELECT id FROM users WHERE phone = ?",
      [phoneVal]
    );

    if (rows && rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already registered.",
        error: "This mobile number is already registered."
      });
    }

    const result = await db.query(sql, [
      phoneVal ?? null,
      nameVal ?? null,
      genderVal ? genderVal.toLowerCase() : null,
      ageVal ? parseInt(ageVal) : null,
      s(city) ?? null,
      s(state) ?? null,
      s(country) ?? null,
      s(pincode) ?? null,
      s(religion) ?? null,
      s(caste) ?? null,
      s(education) ?? null,
      s(job) ?? null,
      s(salary) ?? null,
      s(height) ?? null,
      s(complexion) ?? null,
      s(rasi) ?? null,
      s(nakshatra) ?? null,
      s(dosham) ?? null,
      profileImg ?? null,
      horoscopePath ?? null
    ]);

    const insertId = result?.insertId ?? result?.[0]?.insertId;

    let newUsers = [];
    if (insertId) {
      const usersFound = await db.query(
        "SELECT * FROM users WHERE id = ?",
        [insertId]
      );
      newUsers = Array.isArray(usersFound) ? (Array.isArray(usersFound[0]) ? usersFound[0] : usersFound) : [usersFound];
    }
    if (!newUsers || newUsers.length === 0) {
      const usersByPhone = await db.query(
        "SELECT * FROM users WHERE phone = ?",
        [phoneVal]
      );
      newUsers = Array.isArray(usersByPhone) ? (Array.isArray(usersByPhone[0]) ? usersByPhone[0] : usersByPhone) : [usersByPhone];
    }

    const matchedUser = (newUsers && newUsers.length > 0) ? newUsers[0] : null;

    const savedUser = {
      ...(matchedUser || {}),
      id: matchedUser?.id || insertId || Date.now(),
      phone: phoneVal,
      name: nameVal,
      gender: genderVal,
      age: parseInt(ageVal) || 25,
      img: matchedUser?.img || profileImg,
      photo: matchedUser?.img || profileImg
    };

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      user: savedUser
    });
  } catch (error) {
    console.error("Registration Error:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 4. Check if document is already uploaded for an existing user
app.post('/api/check-document', async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone && !name) {
      return res.status(400).json({ success: false, message: "Phone or name required" });
    }

    let rows = [];

    // Check by phone number first (most reliable)
    if (phone && phone.length >= 10) {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const result = await db.query(
        "SELECT id, name, phone, horoscope_path FROM users WHERE phone = ? AND horoscope_path IS NOT NULL",
        [cleanPhone]
      );
      rows = result || [];
    }

    // If not found by phone, check by name (fallback)
    if (rows.length === 0 && name && name.trim().length > 2) {
      const result = await db.query(
        "SELECT id, name, phone, horoscope_path FROM users WHERE name = ? AND horoscope_path IS NOT NULL",
        [name.trim()]
      );
      rows = result || [];
    }

    if (rows && rows.length > 0) {
      return res.status(409).json({
        success: false,
        alreadyUploaded: true,
        message: "This document has already been uploaded. Please login instead."
      });
    }

    return res.json({ success: true, alreadyUploaded: false });
  } catch (err) {
    console.error("Document check error:", err);
    // Return safe response so upload can proceed if DB check fails
    return res.json({ success: true, alreadyUploaded: false });
  }
});

app.post('/api/ocr', upload.single('file'), async (req, res) => {

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded for OCR" });
    }

    console.log("Processing horoscope with Gemini Vision:", req.file.path);

    // Read the uploaded file into a generative part format
    const imageBuffer = fs.readFileSync(req.file.path);
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: req.file.mimetype
      },
    };
    // Call Gemini to accurately parse horoscope data fields
    const ocrPrompt = `Analyze this horoscope/jathagam and registration document.

Extract all available user details.

Rules:
1. Convert all extracted text to English.
2. Extract ONLY the person's actual name.
3. Return ONLY valid JSON.

{
  "fullName":"",
  "email":"",
  "dob":"",
  "birthTime":"",
  "birthPlace":"",
  "contactPhone":"",
  "rasi":"",
  "nakshatra":"",
  "dosham":"None",
  "gotra":"",
  "motherTongue":"",
  "religion":"",
  "caste":"",
  "subCaste":"",
  "familyType":"",
  "height":"",
  "weight":"",
  "complexion":"",
  "bloodGroup":"",
  "annualIncome":"",
  "education":"",
  "occupation":"",
  "fatherName":"",
  "fatherJob":"",
  "motherName":"",
  "motherJob":"",
  "brothers":"",
  "sisters":"",
  "city":"",
  "state":"",
  "country":"",
  "address":"",
  "text":""
}`;

    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-3.1-pro-preview",
      "gemini-2.5-flash",
      "gemini-1.5-pro"
    ];

    let response = null;
    let geminiError = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [imagePart, ocrPrompt]
        });
        if (response && response.text) {
          console.log(`Successfully parsed with Gemini Vision model: ${modelName}`);
          break;
        }
      } catch (err) {
        geminiError = err;
        console.warn(`Gemini model ${modelName} error:`, err.message || err);
      }
    }

    if (!response || !response.text) {
      throw geminiError || new Error("Failed to extract data from image with Gemini");
    }

    // Get Gemini response
    let rawText = response.text;

// Remove markdown if Gemini returns ```json
rawText = rawText
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

let parsedData;

try {
  parsedData = JSON.parse(rawText);
} catch (err) {
  console.error("JSON Parse Error:", err);

  parsedData = {
    fullName: "",
    email: "",
    dob: "",
    birthTime: "",
    birthPlace: "",
    contactPhone: "",
    rasi: "",
    nakshatra: "",
    dosham: "None",
    gotra: "",
    motherTongue: "",
    religion: "",
    caste: "",
    subCaste: "",
    familyType: "",
    height: "",
    weight: "",
    complexion: "",
    bloodGroup: "",
    annualIncome: "",
    education: "",
    occupation: "",
    fatherName: "",
    fatherJob: "",
    motherName: "",
    motherJob: "",
    brothers: "",
    sisters: "",
    city: "",
    state: "",
    country: "",
    address: "",
    text: rawText
  };
}

// Delete uploaded image
if (req.file?.path && fs.existsSync(req.file.path)) {
  fs.unlinkSync(req.file.path);
}

function isCountOrNotProvided(val) {
  if (!val || typeof val !== 'string') return true;
  const cleaned = val.trim().toLowerCase();
  if (!cleaned) return true;
  if (['nil', 'none', 'no', 'n/a', 'na', '-', '0', 'not provided', 'null', 'undefined'].includes(cleaned)) return true;
  if (/^\d+$/.test(cleaned)) return true;
  if (/^(\d+|one|two|three|four|five|\s|,|brother|sister|brothers|sisters|elder|younger|married|unmarried|-|\(|\))+$/i.test(cleaned)) return true;
  return false;
}

return res.json({
      success: true,
      text: parsedData.text || "",
      fields: {
        fullName: parsedData.fullName || parsedData.name || "",
        email: parsedData.email || "",
        dob: parsedData.dob || "",
        birthTime: parsedData.birthTime || "",
        birthPlace: parsedData.birthPlace || "",
        contactPhone: parsedData.contactPhone || "",
        rasi: parsedData.rasi || "",
        nakshatra: parsedData.nakshatra || "",
        dosham: parsedData.dosham || "None",
        gotra: parsedData.gotra || "",
        motherTongue: parsedData.motherTongue || "",
        religion: parsedData.religion || "",
        caste: parsedData.caste || "",
        subCaste: parsedData.subCaste || "",
        familyType: parsedData.familyType || "",
        height: parsedData.height || "",
        weight: parsedData.weight || "",
        complexion: parsedData.complexion || "",
        bloodGroup: parsedData.bloodGroup || "",
        annualIncome: parsedData.annualIncome || "",
        education: parsedData.education || "",
        occupation: parsedData.occupation || "",
        fatherName: isCountOrNotProvided(parsedData.fatherName) ? "" : parsedData.fatherName,
        fatherJob: parsedData.fatherJob || "",
        motherName: isCountOrNotProvided(parsedData.motherName) ? "" : parsedData.motherName,
        motherJob: parsedData.motherJob || "",
        brotherName: isCountOrNotProvided(parsedData.brotherName || parsedData.brothers) ? "" : (parsedData.brotherName || parsedData.brothers),
        sisterName: isCountOrNotProvided(parsedData.sisterName || parsedData.sisters) ? "" : (parsedData.sisterName || parsedData.sisters),
        brothers: parsedData.brothers || "",
        sisters: parsedData.sisters || "",
        city: parsedData.city || "",
        state: parsedData.state || "",
        country: parsedData.country || "",
        address: parsedData.address || ""
      }
    });
  } catch (error) {
    console.error("CRITICAL OCR BACKEND ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      message: "OCR processing failed on server", 
      error: error.message 
    });
  }
});

// app.post('/api/ocr', upload.single('file'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ success: false, message: "No file uploaded" });
//     }

//     console.log("OCR file received successfully:", req.file.filename);

//     return res.json({
//       success: true,
//       text: "Scanned successfully",
//       fields: {
//         rasi: "",
//         nakshatra: "",
//         dosham: ""
//       }
//     });
//   } catch (error) {
//     console.error("OCR Route Error:", error);
//     return res.status(500).json({ success: false, message: "Internal server error during OCR" });
//   }
// });
// 4. Get Current User Data
app.get('/api/user/me', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId query param required" });
  }

  try {
    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database query failed" });
  }
});

app.get('/api/nearby/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId param required' });
    }

    const users = await db.query('SELECT latitude, longitude, state, gender FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { latitude: myLat, longitude: myLng, state: userState, gender: currentGenderRaw } = users[0];
    const currentGender = String(currentGenderRaw || '').toLowerCase();
    const oppositeGender = (currentGender === 'male' || currentGender === 'groom') ? 'female' : 'male';
    const profiles = await db.query(`
      SELECT
        id,
        name,
        age,
        city,
        state,
        country,
        gender,
        education,
        job,
        salary,
        height,
        complexion,
        rasi,
        nakshatra,
        dosham,
        img AS profile_image,
        horoscope_match,
        latitude,
        longitude
      FROM users
      WHERE id != ? AND (gender = ? OR (gender = 'bride' AND ? = 'female') OR (gender = 'groom' AND ? = 'male'))
    `, [userId, oppositeGender, oppositeGender, oppositeGender]);

    const nearbyUsers = profiles.map(profile => {
      let distance = null;
      if (profile.latitude !== null && profile.longitude !== null && myLat !== null && myLng !== null) {
        try {
          distance = getDistance(
            { latitude: myLat, longitude: myLng },
            { latitude: profile.latitude, longitude: profile.longitude }
          );
        } catch (err) {
          distance = null;
        }
      }
      return {
        ...profile,
        distance: distance !== null ? Number((distance / 1000).toFixed(2)) : null
      };
    });

    let filtered = nearbyUsers.filter(u => u.distance !== null && u.distance <= 200);
    if (filtered.length === 0) {
      filtered = nearbyUsers.filter(u => u.state === userState);
    }

    filtered.sort((a, b) => {
      const aMatch = Number(a.horoscope_match || 0);
      const bMatch = Number(b.horoscope_match || 0);
      if (bMatch !== aMatch) return bMatch - aMatch;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/nearby/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId param required' });
    }

    const users = await db.query('SELECT latitude, longitude, state, gender FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { latitude: myLat, longitude: myLng, state: userState, gender: currentGenderRaw } = users[0];
    const currentGender = String(currentGenderRaw || '').toLowerCase();
    const oppositeGender = (currentGender === 'male' || currentGender === 'groom') ? 'female' : 'male';
    const profiles = await db.query(`
      SELECT
        id,
        name,
        age,
        city,
        state,
        country,
        gender,
        education,
        job,
        salary,
        height,
        complexion,
        rasi,
        nakshatra,
        dosham,
        img AS profile_image,
        horoscope_match,
        latitude,
        longitude
      FROM users
      WHERE id != ? AND (gender = ? OR (gender = 'bride' AND ? = 'female') OR (gender = 'groom' AND ? = 'male'))
    `, [userId, oppositeGender, oppositeGender, oppositeGender]);

    const nearbyUsers = profiles.map(profile => {
      let distance = null;
      if (profile.latitude !== null && profile.longitude !== null && myLat !== null && myLng !== null) {
        try {
          distance = getDistance(
            { latitude: myLat, longitude: myLng },
            { latitude: profile.latitude, longitude: profile.longitude }
          );
        } catch (err) {
          distance = null;
        }
      }
      return {
        ...profile,
        distance: distance !== null ? Number((distance / 1000).toFixed(2)) : null
      };
    });

    let filtered = nearbyUsers.filter(u => u.distance !== null && u.distance <= 200);
    if (filtered.length === 0) {
      filtered = nearbyUsers.filter(u => u.state === userState);
    }

    filtered.sort((a, b) => {
      const aMatch = Number(a.horoscope_match || 0);
      const bMatch = Number(b.horoscope_match || 0);
      if (bMatch !== aMatch) return bMatch - aMatch;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


app.post("/api/otp/send-login", async (req, res) => {
    const { phone } = req.body;

    try {
        const rows = await db.query(
            "SELECT * FROM users WHERE phone = ?",
            [phone]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Phone number not registered."
            });
        }

        if (!phone || phone.length !== 10) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }

        // In test mode use "1234", in production generate random 4-digit OTP
        const otpCode = isOtpTestMode ? "1234" : Math.floor(1000 + Math.random() * 9000).toString();

        // Store OTP for 5 minutes
        otpStore.set(phone, {
            code: otpCode,
            expires: Date.now() + 300000
        });

        if (isOtpTestMode) {
            // TEST MODE — skip SMS, just log
            console.log(`TEST OTP for ${phone}: ${otpCode}`);
            return res.json({
                success: true,
                message: "OTP generated successfully"
            });
        }

        try {
            await sendSmsOtp(phone, otpCode);

            return res.json({
                success: true,
                message: "OTP sent successfully via SMS"
            });
        } catch (error) {
              console.error("========== BACKEND PING4SMS ERROR ==========");
              console.error(error.response?.data || error.message || error);
              otpStore.delete(phone);
              return res.status(502).json({ success: false, message: "Unable to send SMS OTP" });
        }
    } catch (err) {
        console.error("Database Error:", err);
        return res.status(500).json({
            success: false,
            message: "Database or server error"
        });
    }
});
// 5. Update Membership Plan (Plan Simulator helper)
app.post('/api/user/plan', async (req, res) => {
  const { userId, tier } = req.body;
  if (!userId || !tier) {
    return res.status(400).json({ success: false, message: "userId and tier are required" });
  }

  try {
    await db.run('UPDATE users SET premium_plan = ? WHERE id = ?', [tier, userId]);
    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    res.json({ success: true, message: `Upgraded to ${tier} plan`, user: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update plan" });
  }
});

// ── Razorpay Payment Gateway ───────────────────────────────────────────────

// Get public Razorpay Key ID
app.get('/api/payment/config', (req, res) => {
  const keyId = (process.env.RAZORPAY_KEY_ID || 'rzp_test_MKWS2Prv8NxVml').trim();
  res.json({ success: true, keyId });
});

// Create Razorpay Order
app.post('/api/payment/create-order', async (req, res) => {
  const { userId, tier, amount } = req.body;

  const keyId = (process.env.RAZORPAY_KEY_ID || 'rzp_test_MKWS2Prv8NxVml').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || 'F4yrombYrFTKp2WkXSYZtbE4').trim();

  // Determine amount in paise (1 INR = 100 paise)
  let amountPaise = 249900; // default Gold: ₹2,499
  if (amount && !isNaN(Number(amount))) {
    amountPaise = Math.round(Number(amount) * 100);
  } else if (tier === 'Basic') {
    amountPaise = 99900;   // ₹999
  } else if (tier === 'Gold') {
    amountPaise = 249900;  // ₹2,499
  } else if (tier === 'Premium') {
    amountPaise = 499900;  // ₹4,999
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const orderData = {
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${userId || 'usr'}`,
      notes: {
        userId: String(userId || ''),
        tier: String(tier || 'Gold')
      }
    };

    const response = await axios.post(
      'https://api.razorpay.com/v1/orders',
      orderData,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      order: response.data,
      keyId
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Razorpay order',
      error: error.response?.data || error.message
    });
  }
});

// Verify Razorpay Payment Signature and Upgrade User Plan
app.post('/api/payment/verify-payment', async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    tier
  } = req.body;

  const keySecret = (process.env.RAZORPAY_KEY_SECRET || 'F4yrombYrFTKp2WkXSYZtbE4').trim();

  try {
    // Verify signature using HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn('Razorpay signature mismatch:', { expectedSignature, razorpay_signature });
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay payment signature'
      });
    }

    // Payment signature is valid! Upgrade the user's membership plan in DB
    const selectedTier = tier || 'Gold';
    if (userId) {
      await db.run('UPDATE users SET premium_plan = ? WHERE id = ?', [selectedTier, userId]);

      // Calculate numeric amount based on tier
      const amountValue = selectedTier === 'Premium' ? 4999 : (selectedTier === 'Gold' ? 2499 : 999);

      // Record transaction in payments table
      try {
        await db.run(
          `INSERT INTO payments (user_id, plan_name, amount, currency, razorpay_order_id, razorpay_payment_id, status)
           VALUES (?, ?, ?, 'INR', ?, ?, 'success')`,
          [userId, selectedTier, amountValue, razorpay_order_id || null, razorpay_payment_id || null]
        );
      } catch (payErr) {
        console.warn('Failed to insert into payments table:', payErr.message);
      }

      // Record/Update active plan in user_plans table
      try {
        const planRows = await db.query('SELECT id FROM plans WHERE plan_name = ?', [selectedTier]);
        const planId = planRows && planRows.length > 0 ? planRows[0].id : 1;
        await db.run(
          `INSERT INTO user_plans (user_id, plan_id, plan_name, amount_paid, status, razorpay_payment_id)
           VALUES (?, ?, ?, ?, 'active', ?)`,
          [userId, planId, selectedTier, amountValue, razorpay_payment_id || null]
        );
      } catch (userPlanErr) {
        console.warn('Failed to insert into user_plans table:', userPlanErr.message);
      }

      const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      const updatedUser = users && users.length > 0 ? users[0] : null;

      return res.json({
        success: true,
        message: `Payment successful! Upgraded to ${selectedTier} plan.`,
        user: updatedUser,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id
    });
  } catch (error) {
    console.error('Razorpay Verify Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// Get user plans view (All users with their plan details)
app.get('/api/user-plans', async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.phone,
        u.email,
        u.premium_plan,
        p.price as plan_price,
        p.period as plan_period,
        p.daily_profile_views,
        p.interest_requests,
        p.verified_matches,
        p.direct_messaging,
        u.views_used,
        u.interests_used,
        u.created_at
      FROM users u
      LEFT JOIN plans p ON u.premium_plan = p.plan_name
      ORDER BY u.id DESC
    `);
    res.json({ success: true, userPlans: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user plans', error: err.message });
  }
});

// Get all plans list
app.get('/api/plans', async (req, res) => {
  try {
    const rows = await db.query(`SELECT * FROM plans ORDER BY price ASC`);
    res.json({ success: true, plans: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch plans', error: err.message });
  }
});

// Get payment history for a user
app.get('/api/payment/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await db.query(
      `SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, payments: history || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment history', error: err.message });
  }
});

// Get all payments (Admin)
app.get('/api/admin/payments', async (req, res) => {
  try {
    const history = await db.query(
      `SELECT p.*, u.name as user_name, u.phone as user_phone, u.email as user_email
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json({ success: true, payments: history || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments', error: err.message });
  }
});


// Update User Location endpoint (Used after registration / location verification)
app.post('/api/user/location', async (req, res) => {
  const { userId, phone, latitude, longitude, city, state, country, pincode } = req.body;
  if (!userId && !phone) {
    return res.status(400).json({ success: false, message: "userId or phone is required" });
  }

  try {
    const updates = [];
    const values = [];

    if (latitude !== undefined && latitude !== null && !isNaN(Number(latitude))) {
      updates.push('latitude = ?');
      values.push(Number(latitude));
    }
    if (longitude !== undefined && longitude !== null && !isNaN(Number(longitude))) {
      updates.push('longitude = ?');
      values.push(Number(longitude));
    }
    if (city) {
      updates.push('city = ?');
      values.push(city);
    }
    if (state) {
      updates.push('state = ?');
      values.push(state);
    }
    if (country) {
      updates.push('country = ?');
      values.push(country);
    }
    if (pincode) {
      updates.push('pincode = ?');
      values.push(pincode);
    }

    if (updates.length > 0) {
      const whereField = userId ? 'id' : 'phone';
      values.push(userId || phone);
      await db.run(`UPDATE users SET ${updates.join(', ')} WHERE ${whereField} = ?`, values);
    }

    const whereField = userId ? 'id' : 'phone';
    const users = await db.query(`SELECT * FROM users WHERE ${whereField} = ?`, [userId || phone]);
    const user = (users && users.length > 0) ? users[0] : null;

    res.json({ success: true, message: "Location updated successfully", user });
  } catch (error) {
    console.error("Location update error:", error);
    res.status(500).json({ success: false, message: "Failed to update location", error: error.message });
  }
});

// Verify WhatsApp Number (Increases profile completion to 75%)
app.post('/api/user/verify-whatsapp', async (req, res) => {
  const { userId, phone, otp } = req.body;
  if (!userId && !phone) {
    return res.status(400).json({ success: false, message: "userId or phone is required" });
  }

  try {
    const whereField = userId ? 'id' : 'phone';
    const identifier = userId || phone;

    const existing = await db.query(`SELECT * FROM users WHERE ${whereField} = ?`, [identifier]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const curr = existing[0];
    const isAadharVerified = Boolean(curr.aadhar_verified);
    const newCompletion = isAadharVerified ? 80 : 75;

    await db.run(
      `UPDATE users SET whatsapp_verified = 1, profile_completion = ? WHERE ${whereField} = ?`,
      [newCompletion, identifier]
    );

    const updatedRows = await db.query(`SELECT * FROM users WHERE ${whereField} = ?`, [identifier]);
    const updatedUser = updatedRows && updatedRows.length > 0 ? updatedRows[0] : null;

    res.json({
      success: true,
      message: "WhatsApp number verified successfully! Profile is now 75% complete.",
      completion: newCompletion,
      user: updatedUser
    });
  } catch (error) {
    console.error("WhatsApp verification error:", error);
    res.status(500).json({ success: false, message: "Verification failed", error: error.message });
  }
});

// Verify Aadhaar Card (Increases profile completion to 80%)
app.post('/api/user/verify-aadhar', async (req, res) => {
  const { userId, phone, aadharNumber } = req.body;
  if (!userId && !phone) {
    return res.status(400).json({ success: false, message: "userId or phone is required" });
  }

  try {
    const whereField = userId ? 'id' : 'phone';
    const identifier = userId || phone;

    const existing = await db.query(`SELECT * FROM users WHERE ${whereField} = ?`, [identifier]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const curr = existing[0];
    const newCompletion = 80;

    await db.run(
      `UPDATE users SET aadhar_verified = 1, aadhar_number = ?, profile_completion = ? WHERE ${whereField} = ?`,
      [aadharNumber ? String(aadharNumber).replace(/\D/g, '') : null, newCompletion, identifier]
    );

    const updatedRows = await db.query(`SELECT * FROM users WHERE ${whereField} = ?`, [identifier]);
    const updatedUser = updatedRows && updatedRows.length > 0 ? updatedRows[0] : null;

    res.json({
      success: true,
      message: "Aadhaar Card verified successfully! Profile is now 80% complete.",
      completion: newCompletion,
      user: updatedUser
    });
  } catch (error) {
    console.error("Aadhaar verification error:", error);
    res.status(500).json({ success: false, message: "Verification failed", error: error.message });
  }
});

// 6. Profiles Listing (Filtered by opposite gender)
app.get('/api/profiles', async (req, res) => {
  const { userId, religion, caste, education, minAge, maxAge, state, income } = req.query;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }

  try {
    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const currentUser = users[0];
    const userGender = (currentUser.gender || '').toLowerCase();
    const isMale = userGender === 'male' || userGender === 'groom';
    
    // Determine user numeric age
    let userAge = currentUser.age ? parseInt(currentUser.age) : null;
    if (!userAge && currentUser.dob) {
      const birthYear = new Date(currentUser.dob).getFullYear();
      if (!isNaN(birthYear) && birthYear > 1900) {
        userAge = new Date().getFullYear() - birthYear;
      }
    }
    if (!userAge) {
      userAge = isMale ? 28 : 24;
    }

    // Determine opposite gender filter
    // bride -> female, groom -> male
    const oppositeGender = isMale ? 'female' : 'male';

    let sql = "SELECT * FROM users WHERE (gender = ? OR (gender = 'bride' AND ? = 'female') OR (gender = 'groom' AND ? = 'male')) AND status = 'Active' AND id != ?";
    let params = [oppositeGender, oppositeGender, oppositeGender, userId];

    // Age rule:
    // If user is male: below or equal to his age female profiles only (age <= userAge, >= 18)
    // If user is female: above or equal to her age male profiles only (age >= userAge)
    if (isMale) {
      sql += ' AND age <= ? AND age >= 18';
      params.push(userAge);
    } else {
      sql += ' AND age >= ?';
      params.push(userAge);
    }

    if (religion && religion !== 'All') {
      sql += ' AND religion = ?';
      params.push(religion);
    }
    if (caste && caste !== 'All') {
      sql += ' AND caste = ?';
      params.push(caste);
    }
    if (education && education !== 'All') {
      sql += ' AND education LIKE ?';
      params.push(`%${education}%`);
    }
    if (state && state !== 'All') {
      sql += ' AND state = ?';
      params.push(state);
    }
    if (income && income !== 'All') {
      sql += ' AND (income LIKE ? OR salary LIKE ?)';
      params.push(`%${income}%`, `%${income}%`);
    }
    if (minAge) {
      sql += ' AND age >= ?';
      params.push(parseInt(minAge));
    }
    if (maxAge) {
      sql += ' AND age <= ?';
      params.push(parseInt(maxAge));
    }

    const profiles = await db.query(sql, params);
    res.json({ success: true, profiles });
  } catch (error) {
    console.error("Failed to load profiles:", error);
    res.status(500).json({ success: false, message: "Database query failed" });
  }
});

// 7. Get Profile Detail & Enforce View Limits
app.get('/api/profiles/:id', async (req, res) => {
  const viewedId = req.params.id;
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: "userId parameter is required" });
  }

  try {
    const viewers = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const profiles = await db.query('SELECT * FROM users WHERE id = ?', [viewedId]);

    if (viewers.length === 0 || profiles.length === 0) {
      return res.status(404).json({ success: false, message: "User or profile not found" });
    }

    const viewer = viewers[0];
    const targetProfile = { ...profiles[0] };

    // Record profile views and check limits
    if (parseInt(userId) !== parseInt(viewedId)) {
      const views = await db.query('SELECT * FROM profile_views WHERE viewer_id = ? AND viewed_id = ?', [userId, viewedId]);
      
      if (views.length === 0) {
        // First time viewing this profile
        if (viewer.premium_plan === 'Basic' && viewer.views_used >= 50) {
          return res.json({ 
            success: false, 
            limitReached: true, 
            message: "Profile View Limit Reached! Upgrade to Gold or Premium to unlock unlimited views." 
          });
        }

        // Add view to database
        await db.run('INSERT IGNORE INTO profile_views (viewer_id, viewed_id) VALUES (?, ?)', [userId, viewedId]);
        await db.run('UPDATE users SET views_used = views_used + 1 WHERE id = ?', [userId]);
        viewer.views_used += 1;
      }
    }

    // Apply plan locks
    if (viewer.premium_plan === 'Basic') {
      // Basic plan: mask phone number and hide horoscope
      targetProfile.phone = targetProfile.phone.substring(0, 4) + '******';
      targetProfile.horoscope_path = null;
      targetProfile.isLocked = true;
    } else {
      targetProfile.isLocked = false;
    }

    res.json({ 
      success: true, 
      profile: targetProfile, 
      viewerStats: { views_used: viewer.views_used, plan: viewer.premium_plan } 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch profile details" });
  }
});

// 8. Interests: Send Interest
app.post('/api/interests/send', async (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) {
    return res.status(400).json({ success: false, message: "senderId and receiverId are required" });
  }

  try {
    const senders = await db.query('SELECT * FROM users WHERE id = ?', [senderId]);
    if (senders.length === 0) {
      return res.status(404).json({ success: false, message: "Sender not found" });
    }

    const sender = senders[0];

    // Enforce limits
    if (sender.premium_plan === 'Basic' && sender.interests_used >= 10) {
      return res.json({ 
        success: false, 
        limitReached: true, 
        message: "Interest limit of 10 reached for Basic plan. Upgrade to Gold to send up to 50!" 
      });
    }

    if (sender.premium_plan === 'Gold' && sender.interests_used >= 50) {
      return res.json({ 
        success: false, 
        limitReached: true, 
        message: "Interest limit of 50 reached for Gold plan. Upgrade to Premium for unlimited interests!" 
      });
    }

    // Insert interest record
    await db.run('INSERT IGNORE INTO interests (sender_id, receiver_id, status) VALUES (?, ?, \'pending\')', [senderId, receiverId]);
    await db.run('UPDATE users SET interests_used = interests_used + 1 WHERE id = ?', [senderId]);

    res.json({ success: true, message: "Interest request sent successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send interest. Duplicate request." });
  }
});

// 9. Interests: List Sent/Received
app.get('/api/interests', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId required" });
  }

  try {
    // Get sent interests
    const sent = await db.query(`
      SELECT i.*, u.name, u.age, u.city, u.img 
      FROM interests i 
      JOIN users u ON i.receiver_id = u.id 
      WHERE i.sender_id = ?
    `, [userId]);

    // Get received interests
    const received = await db.query(`
      SELECT i.*, u.name, u.age, u.city, u.img 
      FROM interests i 
      JOIN users u ON i.sender_id = u.id 
      WHERE i.receiver_id = ?
    `, [userId]);

    res.json({ success: true, sent, received });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load interests" });
  }
});

// 10. Interests: Accept/Reject
app.post('/api/interests/respond', async (req, res) => {
  const { interestId, status } = req.body; // status: 'accepted' or 'rejected'
  if (!interestId || !status) {
    return res.status(400).json({ success: false, message: "interestId and status are required" });
  }

  try {
    await db.run('UPDATE interests SET status = ? WHERE id = ?', [status, interestId]);
    res.json({ success: true, message: `Interest ${status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database update failed" });
  }
});

// 11. Chat: List Active chats
app.get('/api/chats', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId required" });
  }

  try {
    // Get unique users current user has messages with
    const sql = `
      SELECT DISTINCT u.id, u.name, u.img, u.online,
        (SELECT text FROM messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as lastMsg,
        (SELECT created_at FROM messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as time
      FROM users u
      WHERE u.id IN (
        SELECT DISTINCT sender_id FROM messages WHERE receiver_id = ?
        UNION
        SELECT DISTINCT receiver_id FROM messages WHERE sender_id = ?
      )
    `;
    const chats = await db.query(sql, [userId, userId, userId, userId, userId, userId]);
    
    // Sort by latest message time
    chats.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

    res.json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load chats" });
  }
});

// 12. Chat: History
app.get('/api/chats/:receiverId', async (req, res) => {
  const { receiverId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: "userId required" });
  }

  try {
    const messages = await db.query(`
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) 
      ORDER BY created_at ASC
    `, [userId, receiverId, receiverId, userId]);

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load chat history" });
  }
});

// 13. Chat: Send Message
app.post('/api/chats/send', async (req, res) => {
  const { senderId, receiverId, text } = req.body;
  if (!senderId || !receiverId || !text) {
    return res.status(400).json({ success: false, message: "senderId, receiverId, and text are required" });
  }

  try {
    const result = await db.run('INSERT INTO messages (sender_id, receiver_id, text) VALUES (?, ?, ?)', [senderId, receiverId, text]);
    res.json({ success: true, messageId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

// 14. Admin: Statistics
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await db.query('SELECT COUNT(*) as count FROM users');
    const premiumUsers = await db.query('SELECT COUNT(*) as count FROM users WHERE premium_plan != \'Basic\'');
    const pendingHoroscopes = await db.query('SELECT COUNT(*) as count FROM users WHERE horoscope_path IS NOT NULL AND horoscope_status = \'pending\'');
    const openReports = await db.query('SELECT COUNT(*) as count FROM reports WHERE status = \'open\'');
    
    // Revenue mock calculation (from DB subscriptions)
    const goldCount = await db.query('SELECT COUNT(*) as count FROM users WHERE premium_plan = \'Gold\'');
    const premCount = await db.query('SELECT COUNT(*) as count FROM users WHERE premium_plan = \'Premium\'');
    const totalRevenue = (goldCount[0].count * 2499) + (premCount[0].count * 4999);

    // Gender ratio split
    const males = await db.query('SELECT COUNT(*) as count FROM users WHERE gender = \'male\' OR gender = \'groom\'');
    const females = await db.query('SELECT COUNT(*) as count FROM users WHERE gender = \'female\' OR gender = \'bride\'');

    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers[0].count,
        premiumUsers: premiumUsers[0].count,
        pendingHoroscopes: pendingHoroscopes[0].count,
        openReports: openReports[0].count,
        totalRevenue: totalRevenue,
        genderRatio: {
          males: males[0].count,
          females: females[0].count
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load admin stats" });
  }
});

// 15. Admin: Users List
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users list" });
  }
});

// Admin: Toggle user status (block/unblock)
app.post('/api/admin/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Active' or 'Blocked'
  try {
    await db.run('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: `User status set to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user status" });
  }
});

// 16. Admin: Horoscopes verification list
app.get('/api/admin/horoscopes', async (req, res) => {
  try {
    const users = await db.query('SELECT id, name, phone, rasi, nakshatra, dosham, horoscope_path, horoscope_status FROM users WHERE horoscope_path IS NOT NULL');
    res.json({ success: true, horoscopes: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load horoscopes" });
  }
});

// Admin: Approve/Reject horoscope
app.post('/api/admin/horoscopes/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'
  try {
    await db.run('UPDATE users SET horoscope_status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: `Horoscope verification status set to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update horoscope status" });
  }
});

// 17. Admin: Reports
app.get('/api/admin/reports', async (req, res) => {
  try {
    const reports = await db.query(`
      SELECT r.*, u1.name as reportedName, u2.name as reporterName 
      FROM reports r 
      JOIN users u1 ON r.reported_id = u1.id 
      JOIN users u2 ON r.reporter_id = u2.id
    `);
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load reports" });
  }
});

// Ping API to test server health
app.get('/api/ping', (req, res) => {
  res.json({ success: true, message: "Backend Server is Running & Healthy!" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));