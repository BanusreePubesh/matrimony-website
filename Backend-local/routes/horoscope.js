import express from 'express';
import { calculateTamilPorutham, NAKSHATRAS, RASIS } from '../utils/tamilHoroscopeEngine.js';
import db from '../db.js';

const router = express.Router();

// Get list of Nakshatras & Rasis
router.get('/data', (req, res) => {
    res.json({
        success: true,
        nakshatras: NAKSHATRAS,
        rasis: RASIS
    });
});

function findStarId(input) {
    if (!input) return null;
    if (typeof input === 'number') return input;
    const str = String(input).toLowerCase().trim();
    const found = NAKSHATRAS.find(n =>
        n.name.toLowerCase() === str ||
        n.name.toLowerCase().startsWith(str) ||
        n.tamil === str ||
        str.includes(n.name.toLowerCase())
    );
    return found ? found.id : null;
}

// Calculate Tamil 10 Porutham by Nakshatra IDs or Names
router.post('/calculate', (req, res) => {
    try {
        const { brideStarId, groomStarId, brideStarName, groomStarName, femaleNakshatra, maleNakshatra } = req.body;
        let bId = brideStarId || findStarId(brideStarName || femaleNakshatra);
        let gId = groomStarId || findStarId(groomStarName || maleNakshatra);

        const result = calculateTamilPorutham(bId || 4, gId || 12);
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Horoscope match endpoint for profile pairs
router.post('/match', async (req, res) => {
    try {
        const {
            maleId, femaleId, boyId, girlId,
            brideStarId, groomStarId,
            brideNakshatra, groomNakshatra,
            femaleNakshatra, maleNakshatra
        } = req.body;

        const bId = femaleId || girlId;
        const gId = maleId || boyId;

        let bStarId = brideStarId || findStarId(brideNakshatra || femaleNakshatra);
        let gStarId = groomStarId || findStarId(groomNakshatra || maleNakshatra);

        // Fallback to database query if IDs are provided but names aren't
        if (!bStarId && bId && db && db.query) {
            try {
                const [bRows] = await db.query("SELECT nakshatra, rasi FROM users WHERE id=?", [bId]);
                if (bRows && bRows.length > 0 && bRows[0].nakshatra) {
                    bStarId = findStarId(bRows[0].nakshatra);
                }
            } catch (e) { }
        }

        if (!gStarId && gId && db && db.query) {
            try {
                const [gRows] = await db.query("SELECT nakshatra, rasi FROM users WHERE id=?", [gId]);
                if (gRows && gRows.length > 0 && gRows[0].nakshatra) {
                    gStarId = findStarId(gRows[0].nakshatra);
                }
            } catch (e) { }
        }

        // If still missing, derive a deterministic star ID based on profile ID
        if (!bStarId) bStarId = (Number(bId || 1) % 27) + 1;
        if (!gStarId) gStarId = (Number(gId || 2) % 27) + 1;

        const result = calculateTamilPorutham(bStarId, gStarId);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;