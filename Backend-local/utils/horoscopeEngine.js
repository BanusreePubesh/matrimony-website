import { DINA_PORUTHAM } from "./compatibilityTables.js";
import { checkGana, checkRajju, checkRasi } from "./horoscopeData.js";

export function checkDina(boy, girl) {

    const table = DINA_PORUTHAM[boy];

    if (!table) {
        return false;
    }

    if (table.uthamam.includes(girl)) {
        return true;
    }

    if (table.madhyamam.includes(girl)) {
        return true;
    }

    return false;
}

export function horoscopeMatch(boy, girl) {

    const result = {

        dina: checkDina(
            boy.nakshatra,
            girl.nakshatra
        ),

        gana: checkGana(
            boy.nakshatra,
            girl.nakshatra
        ),

        rajju: checkRajju(
            boy.nakshatra,
            girl.nakshatra
        ),

        rasi: checkRasi(
            boy.nakshatra,
            girl.nakshatra
        )

    };

    let score = 0;

    Object.values(result).forEach(v => {

        if (v)
            score++;

    });

    let grade = "";

    if (score === 4)
        grade = "Excellent";

    else if (score === 3)
        grade = "Good";

    else if (score === 2)
        grade = "Average";

    else
        grade = "Poor";

    return {

        score,

        total: 4,

        percentage: Math.round((score / 4) * 100),

        grade,

        porutham: result

    };

}