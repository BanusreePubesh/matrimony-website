// const otpStore = new Map(); // Temporary memory storage (use Redis for production)

// // 1. Generate & Send OTP
// exports.sendOtp = (req, res) => {
//     const { phone } = req.body;
//     const code = Math.floor(1000 + Math.random() * 9000).toString();
    
//     // Store OTP with an expiration (e.g., 5 minutes)
//     otpStore.set(phone, { code, expires: Date.now() + 300000 });

//     console.log(`Sending WhatsApp message to ${phone}: Your OTP is ${code}`);
//     // HERE: Integrate your WhatsApp API (e.g., Twilio, Gupshup, or Wati)
    
//     res.json({ success: true, message: "OTP sent successfully" });
// };

// // 2. Verify OTP
// exports.verifyOtp = (req, res) => {
//     const { phone, code } = req.body;
//     const storedData = otpStore.get(phone);

//     if (storedData && storedData.code === code && Date.now() < storedData.expires) {
//         otpStore.delete(phone); // Clear OTP after success
//         res.json({ success: true, message: "Verified" });
//     } else {
//         res.status(400).json({ success: false, message: "Invalid or expired OTP" });
//     }
// };

import twilio from 'twilio';

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendOtp = async (req, res) => {
    const { phone } = req.body;
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store in memory (Use Redis for production)
    otpStore.set(phone, { code, expires: Date.now() + 300000 });

    try {
        // Send via WhatsApp
        await client.messages.create({
            body: `Your VivahShaadi verification code is: ${code}`,
            from: 'whatsapp:+14155238886', // Your Twilio WhatsApp Sandbox number
            to: `whatsapp:+91${phone}`
        });
        res.json({ success: true, message: "OTP sent via WhatsApp" });
    } catch (error) {
        console.error("Twilio Error:", error);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
};