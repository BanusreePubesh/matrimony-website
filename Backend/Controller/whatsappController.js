import axios from 'axios';
import 'dotenv/config';

export const sendWhatsAppOTP = async (phone, otp) => {
    // Load credentials from environment
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'otp_verification';

    if (!token || !phoneId) {
        console.error("WhatsApp API credentials missing in .env");
        return false;
    }

    // Prepare phone number (Ensure it's in 91XXXXXXXXXX format)
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const finalTo = "91" + cleanPhone;

    const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: finalTo,
        type: "template",
        template: {
            name: templateName,
            language: { code: "en_US" },
            components: [
                {
                    type: "body",
                    parameters: [{ type: "text", text: otp }]
                },
                {
                    type: "button",
                    sub_type: "quick_reply",
                    index: "0",
                    parameters: [{ type: "text", text: otp }]
                }
            ]
        }
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        console.log(`WhatsApp Sent to ${finalTo}. Status: ${response.status}`);
        return true;
    } catch (error) {
        console.error("WhatsApp Error:", error.response?.data || error.message);
        return false;
    }
};