import dotenv from "dotenv";
dotenv.config({
  path: process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.local",
});
// Fallback: also load .env (dotenv won't override vars already set by .env.local)
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
import horoscopeRouter from "./routes/horoscope.js";
import { getDistance } from "geolib";




const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/horoscope", horoscopeRouter);
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
const router = express.Router();
app.use('/api', router);

// Testing: OTP is always 1234 and Ping4SMS is skipped.
// Production: set OTP_TEST_MODE=false in .env.local / .env.production to send real SMS.
const OTP_TEST_MODE = String(process.env.OTP_TEST_MODE ?? "true").toLowerCase() !== "false";
const TEST_OTP = process.env.TEST_OTP || "1234";
console.log(`OTP mode: ${OTP_TEST_MODE ? `TEST (fixed code ${TEST_OTP}, SMS skipped)` : "PRODUCTION (Ping4SMS)"}`);

async function issueOtp(phone, res) {
  const otpCode = OTP_TEST_MODE ? TEST_OTP : Math.floor(1000 + Math.random() * 9000).toString();
  otpStore.set(phone, { code: otpCode, expires: Date.now() + 300000 });

  if (OTP_TEST_MODE) {
    console.log(`[TEST MODE] OTP for ${phone} is: ${otpCode} (Ping4SMS skipped)`);
    return res.json({
      success: true,
      message: `OTP sent (test mode — use ${TEST_OTP})`,
      code: otpCode,
    });
  }

  try {
    await sendSmsOtp(phone, otpCode);
    return res.json({ success: true, message: "OTP sent successfully via SMS" });
  } catch (error) {
    console.error("========== BACKEND PING4SMS ERROR ==========");
    console.error(error.message || error);
    console.log(`[FALLBACK] OTP for ${phone} is: ${otpCode}`);
    return res.json({
      success: true,
      message: "OTP sent (fallback mode)",
      code: otpCode,
      debugError: error.message,
    });
  }
}

console.log("Meta API Config - Token length:", process.env.WHATSAPP_API_TOKEN?.length || 0);
console.log("Meta API Config - Phone ID:", process.env.WHATSAPP_PHONE_ID);
console.log("Meta API Config - Template Name:", process.env.WHATSAPP_TEMPLATE_NAME);

// 1a. Send Register OTP Endpoint
app.post('/api/otp/send-register', async (req, res) => {

   console.log("========== OTP REGISTER API CALLED ==========");
    console.log(req.body);

  const { phone } = req.body;
  console.log("Phone received:", phone);

  try {
        // 1. Check if user already exists in MySQL
        const result = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
        
        // Handle different mysql2 driver return formats safely
        const rows = Array.isArray(result) ? result[0] : result;
        const existingUsers = Array.isArray(rows) ? rows : (rows ? [rows] : []);

        if (existingUsers.length > 0) {
            // 2. Return 409 Conflict if found
            return res.status(409).json({
                success: false,
                isRegistered: true,
                message: "This phone number is already registered. Please log in instead.",
                user: existingUsers[0]
            });
        }              
        if (!phone || phone.length !== 10) {
            return res.status(400).json({ success: false, message: "Invalid phone number" });
        }

        return await issueOtp(phone, res);

  } catch (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ success: false, message: "Database or server error" });
  }
});

// 1b. Send Login OTP Endpoint
app.post('/api/otp/send-login', async (req, res) => {

   console.log("========== OTP LOGIN API CALLED ==========");
    console.log(req.body);

  const { phone } = req.body;
  console.log("Phone received:", phone);

  try {
        // 1. Check if user exists in MySQL
        const result = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
        
        // Handle different mysql2 driver return formats safely
        const rows = Array.isArray(result) ? result[0] : result;
        const existingUsers = Array.isArray(rows) ? rows : (rows ? [rows] : []);

        if (existingUsers.length === 0) {
            // 2. Return 404 Not Found if not registered
            return res.status(404).json({
                success: false,
                isRegistered: false,
                message: "Phone number not registered. Please sign up first."
            });
        }              
        if (!phone || phone.length !== 10) {
            return res.status(400).json({ success: false, message: "Invalid phone number" });
        }

        return await issueOtp(phone, res);

  } catch (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ success: false, message: "Database or server error" });
  }
});

// 1c. Send WhatsApp Verification OTP Endpoint
app.post('/api/otp/send-whatsapp', async (req, res) => {
  console.log("========== OTP WHATSAPP API CALLED ==========");
  const { phone } = req.body;
  if (!phone || phone.length !== 10) {
    return res.status(400).json({ success: false, message: "Invalid phone number" });
  }
  return await issueOtp(phone, res);
});

// 1d. Legacy Send OTP Endpoint (Alias)
app.post('/api/otp/send', async (req, res) => {
  console.log("========== LEGACY OTP SEND API CALLED ==========");
  console.log(req.body);
  const { type } = req.body;
  if (type === 'login') {
    return res.redirect(307, '/api/otp/send-login');
  }
  if (type === 'whatsapp') {
    return res.redirect(307, '/api/otp/send-whatsapp');
  }
  return res.redirect(307, '/api/otp/send-register');
});

// ── Ping4SMS OTP helper ──────────────────────────────────────────────────────
async function sendSmsOtp(mobile, otp) {
  const apiKey = (process.env.PING4SMS_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("PING4SMS_API_KEY is not configured in .env");
  }

  // Clean to 10-digit local number
  const cleanMobile = String(mobile).replace(/\D/g, "").replace(/^91/, "").slice(-10);
  if (cleanMobile.length !== 10) {
    throw new Error(`Invalid mobile number: ${mobile}`);
  }

  const message = `Your Login Verification code: ${otp} Don't share this code with others -MERCURY`;
  const params = new URLSearchParams({
    key:        apiKey,
    route:      (process.env.PING4SMS_ROUTE      || "2").trim(),
    sender:     (process.env.PING4SMS_SENDER_ID  || "MERSOF").trim(),
    number:     cleanMobile,
    sms:        message,
    templateid: (process.env.PING4SMS_TEMPLATE_ID || "1607100000000339284").trim()
  });

  let lastError;
  for (const base of ["http://site.ping4sms.com/api/smsapi", "https://site.ping4sms.com/api/smsapi"]) {
    try {
      const url = `${base}?${params.toString()}`;
      console.log("[Ping4SMS] Calling:", url);
      const response = await axios.get(url, { timeout: 5000 });
      const responseText = String(response.data ?? "").trim();
      console.log("[Ping4SMS] Response:", responseText);

      if (responseText.includes("101")) {
        throw new Error("Ping4SMS: Insufficient account balance (Error 101)");
      }
      if (!responseText || /error|invalid/i.test(responseText)) {
        throw new Error(`Ping4SMS rejected the request: ${responseText || "empty response"}`);
      }
      return responseText;
    } catch (err) {
      lastError = err;
      console.warn("[Ping4SMS] Endpoint failed:", err.message);
    }
  }

  throw lastError || new Error("Unable to connect to Ping4SMS");
}


// 2. Verify OTP Endpoint
app.post("/api/otp/verify", async (req, res) => {
  const { phone, otp } = req.body;
  console.log("========== OTP VERIFY DEBUG ==========");
  console.log("phone:", JSON.stringify(phone), "otp:", JSON.stringify(otp), "type:", typeof otp);
  console.log("OTP_TEST_MODE:", OTP_TEST_MODE, "TEST_OTP:", JSON.stringify(TEST_OTP));
  console.log("String(otp).trim():", JSON.stringify(String(otp).trim()));
  console.log("Comparison:", String(otp).trim() === TEST_OTP);
  const isTestOtpValid = OTP_TEST_MODE && String(otp).trim() === TEST_OTP;
  console.log("isTestOtpValid:", isTestOtpValid);

  if (!isTestOtpValid) {
    const record = otpStore.get(phone);
    console.log("otpStore record for", JSON.stringify(phone), ":", record);
    console.log("otpStore keys:", [...otpStore.keys()].map(k => JSON.stringify(k)));

    if (!record) {
      return res.status(400).json({ success: false, message: "OTP expired or not sent" });
    }

    if (Date.now() > record.expires) {
      otpStore.delete(phone);
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (String(record.code).trim() !== String(otp).trim()) {
      console.log("OTP MISMATCH! record.code:", JSON.stringify(record.code), "typeof:", typeof record.code, "otp:", JSON.stringify(otp), "typeof:", typeof otp);
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
      rasi, nakshatra, dosham, img,
      mother_tongue, marital_status, diet,
      father_name, father_occupation, mother_name, mother_occupation,
      siblings, family_type, family_status, family_values, native_place, gothram,
      birth_time, birth_place, lagnam,
      pref_age_min, pref_age_max, pref_height, pref_religion,
      pref_education, pref_income, pref_occupation, pref_location, pref_dosham
    } = req.body;

    // Normalize any field that may have been sent twice (FormData duplicate → array)
    const s = (v) => (Array.isArray(v) ? v[0] : v) ?? null;

    if (!phone || !name || !gender) {
      return res.status(400).json({ success: false, message: "Phone, name and gender are required" });
    }

    const horoscopePath = req.file ? `/uploads/${req.file.filename}` : null;
    const genderStr = s(gender) || '';
    const isFemale = genderStr.toLowerCase().includes('female') || genderStr.toLowerCase() === 'bride' || genderStr.toLowerCase() === 'woman';
    
    let rawImg = s(img) || s(req.body.photo) || s(req.body.profile_image) || '';
    if (typeof rawImg === 'string') rawImg = rawImg.trim();

    let profileImg = rawImg;
    if (rawImg && typeof rawImg === 'string' && rawImg.startsWith('data:image/')) {
      try {
        const matches = rawImg.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
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
        console.warn("Failed to save base64 image to file:", saveErr);
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
        rasi, nakshatra, dosham, img, horoscope_path,
        mother_tongue, marital_status, diet,
        father_name, father_occupation, mother_name, mother_occupation,
        siblings, family_type, family_status, family_values, native_place, gothram,
        birth_time, birth_place, lagnam,
        pref_age_min, pref_age_max, pref_height, pref_religion,
        pref_education, pref_income, pref_occupation, pref_location, pref_dosham,
        premium_plan, views_used, interests_used, status, verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Basic', 0, 0, 'Active', 1)
    `;
console.log({
  phone,
  name,
  gender,
  age,
  city,
  state,
  country,
  pincode,
  religion,
  caste,
  education,
  job,
  salary,
  height,
  complexion,
  rasi,
  nakshatra,
  dosham,
  profileImg,
  horoscopePath
});

const queryResult = await db.query(
  "SELECT id FROM users WHERE phone = ?",
  [phone]
);

// Extract rows safely depending on driver format (usually queryResult[0])
const rows = Array.isArray(queryResult) ? queryResult[0] : queryResult;

if (rows && rows.length > 0) {
  return res.status(409).json({
    success: false,
    error: "This mobile number is already registered."
  });
}
// Check if phone number already exists


const result = await db.run(sql, [
  s(phone),
  s(name),
  s(gender) ? s(gender).toLowerCase() : null,
  age ? parseInt(s(age)) : null,
  s(city),
  s(state),
  s(country),
  s(pincode),
  s(religion),
  s(caste),
  s(education),
  s(job),
  s(salary),
  s(height),
  s(complexion),
  s(rasi),
  s(nakshatra),
  s(dosham),
  s(profileImg),
  s(horoscopePath),
  s(mother_tongue),
  s(marital_status),
  s(diet),
  s(father_name),
  s(father_occupation),
  s(mother_name),
  s(mother_occupation),
  s(siblings),
  s(family_type),
  s(family_status),
  s(family_values),
  s(native_place),
  s(gothram),
  s(birth_time),
  s(birth_place),
  s(lagnam),
  pref_age_min ? parseInt(s(pref_age_min)) : null,
  pref_age_max ? parseInt(s(pref_age_max)) : null,
  s(pref_height),
  s(pref_religion),
  s(pref_education),
  s(pref_income),
  s(pref_occupation),
  s(pref_location),
  s(pref_dosham)
]);

console.log("Insert Result:", result);

const insertId = result.insertId;

const users = await db.query(
  "SELECT * FROM users WHERE id = ?",
  [insertId]
);

res.status(201).json({
  success: true,
  message: "Registration successful!",
  user: users[0]
});
  }
   catch (error) {
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
      rows = Array.isArray(result[0]) ? result[0] : (Array.isArray(result) ? result : []);
    }

    // If not found by phone, check by name (fallback)
    if (rows.length === 0 && name && name.trim().length > 2) {
      const result = await db.query(
        "SELECT id, name, phone, horoscope_path FROM users WHERE name = ? AND horoscope_path IS NOT NULL",
        [name.trim()]
      );
      rows = Array.isArray(result[0]) ? result[0] : (Array.isArray(result) ? result : []);
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

// app.post('/api/ocr', upload.single('file'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ success: false, message: "No file uploaded for OCR" });
//     }

//     console.log("Processing horoscope with Gemini Vision:", req.file.path);

//     // Read the uploaded file into a generative part format
//     const imageBuffer = fs.readFileSync(req.file.path);
//     const imagePart = {
//       inlineData: {
//         data: imageBuffer.toString("base64"),
//         mimeType: req.file.mimetype
//       },
//     };
//     // Call Gemini to accurately parse horoscope data fields
// const response = await ai.models.generateContent({
//       model: 'gemini-3.5-flash',
//       contents: [
//         imagePart,
// `Analyze this horoscope/jathagam and registration document. Extract all available user details. 
//         CRITICAL INSTRUCTIONS:
//         1. Convert, transliterate, or translate ALL extracted text into English alphabet characters only. No regional scripts.
//         2. For "fullName", extract ONLY the actual individual person's name. Do NOT extract document headers, labels, or titles like "Suyavivara Kurippu", "Bio-data", or "Horoscope". Find the specific human name (e.g., V. Srinivasan).
        
//         Return a strict JSON object with these exact keys:         
//         "fullName": "",
//           "email": "",
//           "dob": "",
//           "birthTime": "",
//           "birthPlace": "",
//           "contactPhone": "",
//           "rasi": "",
//           "nakshatra": "",
//           "dosham": "None",
//           "gotra": "",
//           "motherTongue": "",
//           "religion": "",
//           "caste": "",
//           "subCaste": "",
//           "familyType": "",
//           "height": "",
//           "weight": "",
//           "complexion": "",
//           "bloodGroup": "",
//           "annualIncome": "",
//           "education": "",
//           "occupation": "",
//           "fatherName": "",
//           "fatherJob": "",
//           "motherName": "",
//           "motherJob": "",
//           "brothers": "",
//           "sisters": "",
//           "city": "",
//           "state": "",
//           "country": "",
//           "address": "",
//           "text": "full text found"
//         }`
//       ],
//     });
//     let rawText = response.text ? response.text() : response.candidates[0].content.parts[0].text;
//     rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

//     const extractedData = JSON.parse(rawText);

//    // Clean up local temp file if using diskStorage
//     if (req.file.path) {
//       fs.unlinkSync(req.file.path);
//     }
//     let parsedData;
//     try {
//       // Clean up response text in case it's wrapped in markdown code blocks
//       const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
//       parsedData = JSON.parse(cleanText);
//     } catch (parseError) {
//       parsedData = {
//         name: "",
//         rasi: "",
//         nakshatra: "",
//         dosham: "None",
//         text: response.text
//       };
//     }

//    // Clean up local uploaded temp file if desired
//     fs.unlinkSync(req.file.path);

// return res.json({
//       success: true,
//       text: parsedData.text || "",
//       fields: {
//         fullName: parsedData.fullName || parsedData.name || "",
//         email: parsedData.email || "",
//         dob: parsedData.dob || "",
//         birthTime: parsedData.birthTime || "",
//         birthPlace: parsedData.birthPlace || "",
//         contactPhone: parsedData.contactPhone || "",
//         rasi: parsedData.rasi || "",
//         nakshatra: parsedData.nakshatra || "",
//         dosham: parsedData.dosham || "None",
//         gotra: parsedData.gotra || "",
//         motherTongue: parsedData.motherTongue || "",
//         religion: parsedData.religion || "",
//         caste: parsedData.caste || "",
//         subCaste: parsedData.subCaste || "",
//         familyType: parsedData.familyType || "",
//         height: parsedData.height || "",
//         weight: parsedData.weight || "",
//         complexion: parsedData.complexion || "",
//         bloodGroup: parsedData.bloodGroup || "",
//         annualIncome: parsedData.annualIncome || "",
//         education: parsedData.education || "",
//         occupation: parsedData.occupation || "",
//         fatherName: parsedData.fatherName || "",
//         fatherJob: parsedData.fatherJob || "",
//         motherName: parsedData.motherName || "",
//         motherJob: parsedData.motherJob || "",
//         brothers: parsedData.brothers || "",
//         sisters: parsedData.sisters || "",
//         city: parsedData.city || "",
//         state: parsedData.state || "",
//         country: parsedData.country || "",
//         address: parsedData.address || ""
//       }
//     });
//   } catch (error) {
//     console.error("CRITICAL OCR BACKEND ERROR:", error);
//     return res.status(500).json({ 
//       success: false, 
//       message: "OCR processing failed on server", 
//       error: error.message 
//     });
//   }
// });



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

    let sql = 'SELECT * FROM users WHERE (gender = ? OR (gender = "bride" AND ? = "female") OR (gender = "groom" AND ? = "male")) AND status = "Active" AND id != ?';
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

router.get("/nearby/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Logged-in user location
    const users = await db.query(
      `SELECT latitude, longitude, state
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const myLat = users[0].latitude;
    const myLng = users[0].longitude;
    const userState = users[0].state;

    // Determine opposite gender so nearby results also show matching gender profiles
    const currentUserResult = await db.query('SELECT gender, age, dob FROM users WHERE id = ?', [userId]);
    const currentGender = Array.isArray(currentUserResult) && currentUserResult[0] ? String(currentUserResult[0].gender || '').toLowerCase() : '';
    const isMale = (currentGender === 'male' || currentGender === 'groom');
    const oppositeGender = isMale ? 'female' : 'male';
    
    let userAge = currentUserResult[0]?.age ? parseInt(currentUserResult[0].age) : null;
    if (!userAge && currentUserResult[0]?.dob) {
      const birthYear = new Date(currentUserResult[0].dob).getFullYear();
      if (!isNaN(birthYear) && birthYear > 1900) {
        userAge = new Date().getFullYear() - birthYear;
      }
    }
    if (!userAge) {
      userAge = isMale ? 28 : 24;
    }

    let nearbySql = `
      SELECT
      id,
      name,
      city,
      latitude,
      longitude,
      state,
      country,
      img AS profile_image,
      horoscope_match,
      age,
      gender
      FROM users
      WHERE id != ? AND (gender = ? OR (gender = 'bride' AND ? = 'female') OR (gender = 'groom' AND ? = 'male'))
    `;
    let nearbyParams = [userId, oppositeGender, oppositeGender, oppositeGender];
    if (isMale) {
      nearbySql += ' AND age <= ? AND age >= 18';
      nearbyParams.push(userAge);
    } else {
      nearbySql += ' AND age >= ?';
      nearbyParams.push(userAge);
    }

    // Fetch all profiles of the opposite gender with age condition
    const profiles = await db.query(nearbySql, nearbyParams);

    if (!Array.isArray(profiles)) {
      return res.status(500).json({ message: 'Unexpected database response for profiles' });
    }

    const nearbyUsers = profiles.map(profile => {
      let distance = null;
      if (profile.latitude !== null && profile.longitude !== null && myLat !== null && myLng !== null) {
        try {
          distance = getDistance(
            {
              latitude: profile.latitude,
              longitude: profile.longitude
            },
            {
              latitude: myLat,
              longitude: myLng
            }
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

    let filtered = nearbyUsers.filter(user => user.distance !== null && Number(user.distance) <= 200);

    if (filtered.length === 0) {
      filtered = nearbyUsers.filter(user => user.state === userState && user.id !== Number(userId));
    }

    // Highest Horoscope Match First, then proximity
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
    console.log(err);
    res.status(500).json(err);
  }
});


// Ping API to test server health
app.get('/api/ping', (req, res) => {
  res.json({ success: true, message: "Backend Server is Running & Healthy!" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));