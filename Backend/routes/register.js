const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db'); // Your database connection

const upload = multer({ dest: 'uploads/' });

router.post('/register', upload.single('horoscope'), async (req, res) => {
  try {
    const { phone, gender, rasi, nakshatra } = req.body;
    const horoscopePath = req.file ? req.file.path : null;

    // 1. Insert user data into MySQL
    const query = `INSERT INTO users (phone, gender, rasi, nakshatra, horoscope_path) VALUES (?, ?, ?, ?, ?)`;
    await db.execute(query, [phone, gender, rasi, nakshatra, horoscopePath]);

    res.status(200).json({ message: "Registration successful!" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Registration failed, please try again." });
  }
});

module.exports = router;