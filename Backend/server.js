import dotenv from "dotenv";
dotenv.config
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import multer from 'multer';
import db from './db.js';
import { createWorker } from 'tesseract.js';
import { GoogleGenAI } from '@google/genai';



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

console.log("Meta API Config - Token length:", process.env.WHATSAPP_API_TOKEN?.length || 0);
console.log("Meta API Config - Phone ID:", process.env.WHATSAPP_PHONE_ID);
console.log("Meta API Config - Template Name:", process.env.WHATSAPP_TEMPLATE_NAME);
// 1. Send OTP Endpoint
app.post("/api/otp/send-register", async (req, res) => {
    const { phone } = req.body;

    try {
        // Check if phone is already registered
        const [rows] = await db.query(
            "SELECT * FROM users WHERE phone = ?",
            [phone]
        );

console.log("Phone:", phone);
console.log("Rows:", rows);
console.log("Rows length:", rows.length);

        if (rows.length > 0) {
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

        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Store OTP for 5 minutes
        otpStore.set(phone, {
            code: otpCode,
            expires: Date.now() + 300000
        });

        try {
            await sendWhatsAppOtp(`91${phone}`, otpCode);

            return res.json({
                success: true,
                message: "OTP sent successfully",
                code: otpCode
            });
        } catch (error) {
            console.error("========== BACKEND META API ERROR ==========");
            console.error(error.response?.data || error);

            console.log(`[FALLBACK] OTP for ${phone}: ${otpCode}`);

            return res.json({
                success: true,
                message: "OTP sent (fallback)",
                code: otpCode,
                debugError: error.response?.data?.error?.message || error.message
            });
        }

    } catch (err) {
        console.error("Database Error:", err);
        return res.status(500).json({
            success: false,
            message: "Database or server error"
        });
    }
});
// Meta API helper function (RETAINED & PRESERVED)
async function sendWhatsAppOtp(phoneNumber, otpCode) {
  const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phoneNumber,
    type: "template",
    template: {
      name: process.env.WHATSAPP_TEMPLATE_NAME,
      language: {
        code: "en_US"
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: otpCode
            }
          ]
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "text",
              text: otpCode
            }
          ]
        }
      ]
    }
  };

  return axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
      "Content-Type": "application/json"
    }
  });
}

// 2. Verify OTP Endpoint
app.post("/api/otp/verify", async (req, res) => {
  const { phone, otp } = req.body;
  const record = otpStore.get(phone);

  if (!record) {
    return res.status(400).json({ success: false, message: "OTP expired or not sent" });
  }

  if (Date.now() > record.expires) {
    otpStore.delete(phone);
    return res.status(400).json({ success: false, message: "OTP expired" });
  }

  if (record.code !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  otpStore.delete(phone);

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
      rasi, nakshatra, dosham, img 
    } = req.body;

    if (!phone || !name || !gender) {
      return res.status(400).json({ success: false, message: "Phone, name and gender are required" });
    }

    const horoscopePath = req.file ? `/uploads/${req.file.filename}` : null;
    // Default image if none provided
    const profileImg = img || (gender.toLowerCase().includes('female') || gender.toLowerCase() === 'bride' 
      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300' 
      : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300');

    // Save to MySQL
    const sql = `
      INSERT INTO users (
        phone, name, gender, age, city, state, country, pincode, 
        religion, caste, education, job, salary, height, complexion, 
        rasi, nakshatra, dosham, img, horoscope_path, premium_plan, views_used, interests_used, status, verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Basic', 0, 0, 'Active', 1)
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


const result = await db.query(sql, [
  phone ?? null,
  name ?? null,
  gender ? gender.toLowerCase() : null,
  age ? parseInt(age) : null,
  city ?? null,
  state ?? null,
  country ?? null,
  pincode ?? null,
  religion ?? null,
  caste ?? null,
  education ?? null,
  job ?? null,
  salary ?? null,
  height ?? null,
  complexion ?? null,
  rasi ?? null,
  nakshatra ?? null,
  dosham ?? null,
  profileImg ?? null,
  horoscopePath ?? null
]);
console.log("Insert Result:", result);
const insertId = result[0].insertId;

const [newUsers] = await db.query(
  "SELECT * FROM users WHERE id = ?",
  [insertId]
);

res.status(201).json({
  success: true,
  message: "Registration successful!",
  user: newUsers[0]   // Return a single user object
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
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: [
    imagePart,
    `Analyze this horoscope/jathagam and registration document.

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
}`
  ]
});

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
        fatherName: parsedData.fatherName || "",
        fatherJob: parsedData.fatherJob || "",
        motherName: parsedData.motherName || "",
        motherJob: parsedData.motherJob || "",
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


app.post("/api/otp/send-login", async (req, res) => {
    const { phone } = req.body;

    const [rows] = await db.query(
        "SELECT * FROM users WHERE phone = ?",
        [phone]
    );

    if (rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Phone number not registered."
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

// Reset Plan Limits for testing
app.post('/api/user/reset-limits', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }

  try {
    await db.run('UPDATE users SET views_used = 0, interests_used = 0 WHERE id = ?', [userId]);
    await db.run('DELETE FROM profile_views WHERE viewer_id = ?', [userId]);
    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    res.json({ success: true, message: "Limits reset successfully", user: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reset limits" });
  }
});

// 6. Profiles Listing (Filtered by opposite gender)
app.get('/api/profiles', async (req, res) => {
  const { userId, religion, caste, minAge, maxAge, state } = req.query;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }

  try {
    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const currentUser = users[0];
    const userGender = currentUser.gender.toLowerCase();
    
    // Determine opposite gender filter
    // bride -> female, groom -> male
    const oppositeGender = (userGender === 'male' || userGender === 'groom') ? 'female' : 'male';

    let sql = 'SELECT * FROM users WHERE (gender = ? OR (gender = "bride" AND ? = "female") OR (gender = "groom" AND ? = "male")) AND status = "Active" AND id != ?';
    let params = [oppositeGender, oppositeGender, oppositeGender, userId];

    if (religion && religion !== 'All') {
      sql += ' AND religion = ?';
      params.push(religion);
    }
    if (caste && caste !== 'All') {
      sql += ' AND caste = ?';
      params.push(caste);
    }
    if (state && state !== 'All') {
      sql += ' AND state = ?';
      params.push(state);
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