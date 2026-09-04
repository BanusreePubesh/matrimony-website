const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshta",
  "Moola",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati"
];

function getIndex(star) {
    return NAKSHATRAS.indexOf(star);
}

function calculateMatch(boy, girl) {

    const boyStar = getIndex(boy.nakshatra);
    const girlStar = getIndex(girl.nakshatra);

    if (boyStar === -1 || girlStar === -1) {
        throw new Error("Invalid Nakshatra");
    }

    let result = {

        dina:false,
        gana:false,
        mahendra:false,
        streeDheerga:false,
        yoni:false,
        rasi:false,
        rasiAdhipathi:false,
        vasya:false,
        rajju:false,
        vedha:false,

        score:0
    };

    const distance =
        (girlStar - boyStar + 27) % 27;

    // Dina
    if([2,4,6,8,9,11,13,15,18,20,22,24,26].includes(distance)){
        result.dina=true;
        result.score++;
    }

    // Gana
    if(Math.abs(girlStar-boyStar)<=9){
        result.gana=true;
        result.score++;
    }

    // Mahendra
    if([4,7,10,13,16,19,22,25].includes(distance)){
        result.mahendra=true;
        result.score++;
    }

    // Stree Dheerga
    if(distance>=13){
        result.streeDheerga=true;
        result.score++;
    }

    // Temporary Rules
    if(boy.rasi!==girl.rasi){
        result.rasi=true;
        result.score++;
    }

    if(boy.dosham===girl.dosham){
        result.yoni=true;
        result.score++;
    }

    result.vasya=true;
    result.score++;

    result.rasiAdhipathi=true;
    result.score++;

    result.rajju=true;
    result.score++;

    result.vedha=true;
    result.score++;

    result.percentage =
        Math.round(result.score/10*100);

    if(result.score>=9)
        result.status="Excellent";
    else if(result.score>=7)
        result.status="Very Good";
    else if(result.score>=5)
        result.status="Average";
    else
        result.status="Not Recommended";

    return result;
}

module.exports={
    calculateMatch
};