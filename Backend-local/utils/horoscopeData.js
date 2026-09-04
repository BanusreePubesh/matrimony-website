import { NAKSHATRA_DATA } from "./astroData.js";
import { YONI_COMPATIBILITY } from "./compatibilityTables.js";
export function checkGana(boy, girl){

    const b = NAKSHATRA_DATA[boy].gana;
    const g = NAKSHATRA_DATA[girl].gana;

    if(b===g)
        return true;

    if(b==="Deva" && g==="Manushya")
        return true;

    if(b==="Manushya" && g==="Deva")
        return true;

    if(b==="Manushya" && g==="Rakshasa")
        return true;

    if(b==="Rakshasa" && g==="Manushya")
        return true;

    return false;
}

export function checkRajju(boy, girl){


    const rajju = checkRajju(
    boy.nakshatra,
    girl.nakshatra
);

    return (
        NAKSHATRA_DATA[boy].rajju !==
        NAKSHATRA_DATA[girl].rajju
    );

}

export function checkYoni(boy, girl){

    return (
        NAKSHATRA_DATA[boy].yoni ===
        NAKSHATRA_DATA[girl].yoni
    );

}

export function checkRasi(boy, girl){

    return (
        NAKSHATRA_DATA[boy].rasi !==
        NAKSHATRA_DATA[girl].rasi
    );

}

export function checkYoni(boy, girl) {

    const boyYoni = NAKSHATRA_DATA[boy].yoni;
    const girlYoni = NAKSHATRA_DATA[girl].yoni;

    return (
        YONI_COMPATIBILITY[boyYoni]?.[girlYoni] ?? false
    );

}