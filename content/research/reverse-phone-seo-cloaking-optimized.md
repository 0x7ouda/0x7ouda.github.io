---
title: 'Reverse Phone SEO Cloaking Infrastructure, Synthetic Phone Generation, and Ad Monetization'
description: 'An OSINT-driven investigation into SEO cloaking infrastructure, deterministic phone-number generation, redirects, and ad-based monetization.'
date: 2026-08-17
category: 'OSINT'
tags:
  - OSINT
cover: '/images/research/reverse-phone-seo-cloaking/0.png'
toc: true
---

# Reverse Phone SEO Cloaking Infrastructure, Synthetic Phone Generation, and Ad Monetization

## Initial Investigation

After receiving a suspicious message on my personal phone number, my initial assessment was that it appeared consistent with a social engineering attempt, potentially aimed at obtaining access to or stealing funds from an electronic wallet.

![Suspicious message received on the phone](/images/research/reverse-phone-seo-cloaking/1.png)

![Additional screenshot from the suspicious message](/images/research/reverse-phone-seo-cloaking/2.png)

## Suspicious Search Result

While conducting OSINT research on the sender’s phone number, I encountered an unusual result. The number appeared on a Google-indexed page surfaced by the OSINT platform. However, when I accessed the page directly in a browser, its behavior immediately raised questions: the page rendered completely blank, with no visible content corresponding to what had appeared in the search results.

![Google-indexed reverse-phone search result](/images/research/reverse-phone-seo-cloaking/3.png)

## Source Code Analysis

Things got even stranger. I scanned the subdomain using VirusTotal and found that it had been flagged as malicious by one or more security vendors. I then went back to the page and inspected its source code.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta
      name="viewport"
      content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <meta name="robots" content="noarchive" />
    <meta name="referrer" content="unsafe-url" />
    <script>
      (function () {
        const d =
          'KGZ1bmN0aW9uKCl7CiAgICBjb25zdCBkPSJLR1oxYm1OMGFXOXVLQ2w3Q2lBZ0lDQmpiMjV6ZENCa1BTSmFSemxxWkZjeGJHSnVVWFZaVjFKclVsaGFiR0p1...'; // Base64 payload truncated for readability
        eval(decodeURIComponent(escape(atob(d))));
      })();
    </script>
  </head>
  <body>
    <p id="Blog1"></p>
  </body>
</html>
```

> **Note:** The Base64 blob above has been truncated for readability and to avoid expensive syntax highlighting during site builds. The decoded logic is preserved below.

I found that the page contained JavaScript code that had been encoded in Base64 multiple times.

```javascript
document.addEventListener('DOMContentLoaded', function () {
  //var currentUrl = window.location.origin + window.location.pathname;
  var currentUrl = window.location.href;
  var existing = document.querySelector("link[rel='canonical']");

  if (existing) {
    existing.setAttribute('href', currentUrl);
  } else {
    var link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', currentUrl);
    document.head.appendChild(link);
  }

  var canonicalFromDom = document
    .querySelector("link[rel='canonical']")
    .getAttribute('href');
});

document.addEventListener('DOMContentLoaded', function () {
  (function () {
    let language_detect = '';
    if (navigator.language) {
      language_detect = navigator.language.slice(0, 2).toLowerCase();
    }

    const blockedLangs = [
      'hi',
      'ur',
      'bn',
      'pa',
      'ta',
      'te',
      'ml',
      'kn',
      'gu',
      'mr',
      'or',
      'as',
      'id',
      'ru',
    ];

    const probIndia =
      !language_detect || blockedLangs.includes(language_detect);
    const isGooglebot = /(googlebot|InspectionTool)/i.test(navigator.userAgent);
    const fromGoogle = document.referrer.toLowerCase().includes('google');

    if (isGooglebot) {
      const s = document.createElement('script');
      s.src = 'ext.js';
      s.defer = true;
      document.head.appendChild(s);
    } else if (fromGoogle && !probIndia) {
      const destination = 'https://www.wrdforwrd.com';
      window.location.replace(destination);
    } else if (probIndia) {
      //const destination = 'https://www.spokeo.com/reverse-phone-lookup?g=phone_landing_5_A3579837731';
      //window.location.replace(destination);
    }
  })();
});
```

## Cloaking Logic

The script first sets the page’s canonical URL to the current address. More importantly, it then checks the visitor’s **browser language, user agent, and referrer** to decide how the page should behave.

If the visitor is identified as Googlebot, the page loads an additional JavaScript file called `ext.js`. In contrast, a normal user arriving from Google is redirected to `wrdforwrd.com`.

This means the page presents different behavior to search-engine crawlers and real users, which is consistent with **cloaking-like behavior**. The script also contains an inactive, commented-out redirect to **Spokeo**, suggesting that a reverse-phone lookup service may have been used as an alternative destination in an earlier version.

## Inspecting `ext.js`

The next step was to inspect the `ext.js` file.

```javascript
(function () {
  const d =
    'KGZ1bmN0aW9uKCl7CiAgICBjb25zdCBkPSJLR1oxYm1OMGFXOXVLQ2w3Q2lBZ0lDQmpiMjV6ZENCa1BTSkRVMEZuV1RJNWRXTXpVV2RhYmtwMllsVmtkbUl5...'; // Base64 payload truncated for readability
  eval(decodeURIComponent(escape(atob(d))));
})();
```

> **Note:** The full encoded blob has been truncated in this publication. The decoded JavaScript used for the analysis remains intact below.

Once again, the JavaScript was Base64-encoded.

```javascript
   const fromGoogle = document.referrer.toLowerCase().includes("google");
   const isGooglebot = /(googlebot|InspectionTool)/i.test(navigator.userAgent);
 //alert(fromGoogle);
 //alert(isGooglebot);
   if (fromGoogle && !isGooglebot && false) { //
  window.location.href = "https://www.";
   } else if ((isGooglebot) || true) {


 // function getUrlSeed() {
   // const raw = window.location.search.slice(1); // tutto dopo ?
   // const match = raw.match(/\b\d{6}\b/);
   // if (!match) return 123456;
   // return parseInt(match[0], 10);
 // }

 function fnv1a32(str) {
   let h = 0x811c9dc5; // offset basis
   for (let i = 0; i < str.length; i++) {
  h ^= str.charCodeAt(i);
  h = Math.imul(h, 0x01000193); // FNV prime
   }
   return h >>> 0; // unsigned 32 bit
 }

 /*
 function getUrlSeed() {
   // 1ï¸â£ Query string vince sempre
   const raw = window.location.search.slice(1);
   const match = raw.match(/\b\d{6}\b/);
   if (match) return parseInt(match[0], 10);

   // 2ï¸â£ Account dall'host
   const host = window.location.host;
   const account = host.split(".")[0]?.toLowerCase();
   if (!account) return 123456;

   // 3ï¸â£ Hash dell'intero account
   const hash = fnv1a32(account);

   // 4ï¸â£ Seed a 6 cifre (100000â999999)
   return (hash % 900000) + 100000;
 }
 */

 // 1) Seed 6 cifre
 function getUrlSeed6() {
   const raw = window.location.search.slice(1);
   const match = raw.match(/\b\d{6}\b/);
   if (match) return parseInt(match[0], 10);

   const host = window.location.host || "";
   const account = (host.split(".")[0] || "").toLowerCase();
   if (!account) return 123456;

   const hash = fnv1a32(account);
   return (hash % 900000) + 100000;
 }

 const hostAccount = ((window.location.hostname || "").split(".")[0] || "").toLowerCase();
 const baseNum = getUrlSeed6();


 // === Deterministic PRNG ===
 function seededPRNG(seed) {
   let t = seed + 0x6D2B79F5;
   return function () {
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
   };
 }
 function seededPRNGnew(seed) {
   let t = seed + 0x6D2B79F5;
   return function () {
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const result = ((t ^ (t >>> 14)) >>> 0) % 1000000;
  return result.toString().padStart(6, '0');
   };
 }

 const arrays = {

 descriptors: [
   "Global", "Modern", "Urban", "Digital", "Creative", "NextGen", "Dynamic", "Future", "Smart", "Strategic",
   "Elite", "Innovative", "Prime", "Noble", "Authentic", "Sustainable", "Bright", "Golden", "Agile", "Trusted",
   "Advanced", "Progressive", "Visionary", "Elegant", "Refined", "Structured", "Precise", "Empowered", "Fresh", "Independent",
   "Connected", "Original", "Cultural", "Tactical", "Limitless", "Balanced", "Energetic", "Powerful", "Intuitive", "Evolving",
   "Clean", "Robust", "Relevant", "Globalized", "Bold", "Collaborative", "Experimental", "Cutting-Edge", "Minimal",
   "Neoteric", "Organized", "Seamless", "Premium", "Tuned", "Unified", "Verified", "Aligned", "Compact", "Composed",
   "Futuristic", "Grounded", "Daring", "Measured", "Methodical", "Open", "Optimized", "Planned", "Practical",
   "Prepared", "Quality", "Refreshed", "Reliable", "Revolutionary", "Sleek", "Solid", "Steady", "Strong", "Tailored",
   "Tested", "Thorough", "Thoughtful", "Time-Tested", "Upgraded", "User-Friendly", "Vibrant", "Well-Balanced", "Well-Crafted",
   "Aesthetic", "Analytical", "Architectural", "Attentive", "Beautiful", "Branded", "Calm", "Challenging",
   "Clear", "Comfortable", "Confident", "Consistent", "Cool", "Courageous", "Curious", "Deliberate", "Detailed", "Distinct",
   "Diverse", "Effective", "Efficient", "Ethical", "Experienced", "Expert", "Fair", "Focused", "Friendly", "Genuine",
   "Green", "Growth", "Honest", "Inclusive", "Inspired", "Intentional", "Joyful", "Knowledgeable", "Lean",
   "Logical", "Luxurious", "Meaningful", "Meticulous", "Mindful", "Multicultural", "Natural", "Nimble", "Open-Minded", "Passionate",
   "Patient", "Performance-Driven", "Plentiful", "Polished", "Popular", "Pristine", "Professional", "Purposeful", "Receptive",
   "Resilient", "Resourceful", "Responsive", "Result-Oriented", "Rethought", "Safe", "Secure", "Simple", "Skilled",
   "Stable", "Stylish", "Systematic", "Talented", "Timeless", "Transparent", "Unifying"
 ],

 activityFields: [
   "Consulting", "Architecture", "Engineering", "Technology", "Design", "Finance", "Marketing", "Media", "Retail", "Travel",
   "Innovation", "Real Estate", "Healthcare", "Biotech", "Education", "E-commerce", "Supply Chain", "Software", "AI Research", "Legal Services",
   "Entertainment", "Automotive", "Construction", "Advertising", "Agritech", "Food Tech", "Cloud Services", "Cybersecurity", "Data Analytics", "Digital Solutions",
   "Fashion", "Fine Art", "Furniture", "Gaming", "Green Energy", "HR Services", "Industrial Design", "Interior Design", "IT Support", "Journalism",
   "Lifestyle", "Logistics", "Luxury Goods", "Manufacturing", "Medical Devices", "Mining", "Mobile Apps", "Motion Graphics", "NFT Solutions", "Online Education",
   "Pharmaceutical", "Photography", "Public Relations", "Publishing", "Renewable Energy", "Retail Design", "Robotics", "Smart Homes", "Social Media", "Space Tech",
   "Sports Management", "Streaming", "Sustainability", "Tax Advisory", "Trade", "Training", "Translation", "Travel Services", "UX/UI", "Venture Capital",
   "Virtual Reality", "Warehousing", "Web Development", "Wellness", "Yoga", "Blockchain", "Carbon Solutions", "Climate Tech", "Data Science", "Drone Tech",
   "E-learning", "Eco Solutions", "Environmental Consulting", "Event Planning", "Film Production", "Food Services", "Freight", "Gene Therapy", "Geo Intelligence", "GovTech",
   "Green Building", "Heritage Management", "Hospitality", "Hydrogen Tech", "Import/Export", "Industrial Automation", "Innovation Strategy", "Insurance", "Interior Architecture", "Language Services",
   "Legal Tech", "Lifestyle Coaching", "Live Events", "Luxury Travel", "Management", "Marine Tech", "Marketplace", "Materials Science", "Mental Health", "Metaverse Development",
   "Micro-Mobility", "Mobile Marketing", "Nanotech", "Neuroscience", "Nutrition", "Ocean Science", "Online Platforms", "Organic Farming", "Outsourcing", "Packaging",
   "Paralegal", "Payment Solutions", "Pet Tech", "Philanthropy", "Physical Therapy", "Platform Economy", "Product Design", "Professional Services", "PropTech", "Psychology",
   "Public Affairs", "Quantum Computing", "R&D", "Renewables", "Retail Strategy", "Revenue Optimization", "SaaS", "Science Communication", "Sensor Tech", "Server Management",
   "Service Design", "Shared Mobility", "Smart Cities", "Space Tourism", "Sponsorship", "Sportswear", "Startup Incubation", "Surgical Tech", "Sustainable Fashion", "Talent Management",
   "Telecom", "Therapy Services", "Tokenization", "Tourism Strategy", "Trade Consulting", "Transport Logistics", "Trust Services", "Urban Planning", "UX Strategy", "Vegan Products",
   "Restaurants", "Bars", "Cafes", "Hair Salons", "Barbershops", "Beauty Salons", "Nail Studios", "Gyms", "Fitness Centers", "Spas",
   "Wellness Centers", "Tattoo Studios", "Driving Schools", "Parking Services", "Dry Cleaning", "Laundry Services", "Car Wash", "Auto Repair", "Mechanics", "Gas Stations",
   "Bike Repair", "Tailoring", "Shoe Repair", "Pet Grooming", "Veterinary Clinics", "Childcare", "Kindergartens", "After School Programs", "Tutoring Services", "Language Schools",
   "Music Schools", "Dance Studios", "Theater Groups", "Photography Studios", "Printing Services", "Copy Centers", "Florists", "Bakeries", "Butcher Shops", "Fish Markets",
   "Grocery Stores", "Supermarkets", "Delis", "Convenience Stores", "Bookstores", "Gift Shops", "Toy Stores", "Jewelry Stores", "Watch Repair", "Home Decor",
   "Lighting Stores", "Appliance Repair", "Electronics Repair", "Smartphone Services", "Computer Repair", "Tech Support", "Locksmith Services", "Moving Services", "Storage Units", "Plumbing Services",
   "Electrical Services", "HVAC Services", "Construction Companies", "Renovation Services", "Cleaning Services", "Pest Control", "Security Services", "Legal Offices", "Notary Services", "Accounting Firms",
   "Tax Services", "Immigration Services", "Travel Agencies", "Real Estate Agencies", "Property Management", "Interior Decoration", "Landscaping", "Garden Centers", "Nurseries", "Pet Stores",
   "Aquarium Services", "Fireplace Services", "Roofing Services", "Window Installation", "Blinds and Curtains", "Flooring Services", "Tiling Services", "Carpet Cleaning", "Event Catering", "Wedding Planners",
   "Party Supplies", "Balloon Services", "Makeup Services", "Massage Therapy", "Acupuncture", "Chiropractic Services", "Nutrition Consulting", "Life Coaching", "Resume Services", "Career Counseling"
 ],

 activityNouns: [
   "Group", "Partners", "Studio", "Collective", "Lab", "House", "Works", "Systems", "Company", "Firm",
   "Workshop", "Bureau", "Network", "Consortium", "Office", "Division", "Agency", "Corporation", "Initiative", "Unit",
   "Foundation", "Cooperative", "Institute", "Atelier", "Studio", "Project", "Alliance", "Enterprise", "Platform", "Service",
   "Venture", "Organization", "Solution", "Development", "Association", "Agency", "Guild", "Fabric", "Practice", "People",
   "Circle", "Entity", "Node", "Outlet", "Movement", "Assembly", "Department", "Channel", "Federation", "Union",
   "Crew", "Club", "Society", "Fraternity", "Conglomerate", "Syndicate", "Authority", "Front", "Matrix", "Hive",
   "Base", "Cell", "Forge", "Grid", "Core", "Think Tank", "Consulate", "Task Force", "Branch", "Lobby"
 ],

 surnames: [
   "Smith", "Johnson", "Brown", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin",
   "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall",
   "Allen", "Young", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Green", "Adams",
   "Baker", "Nelson", "Carter", "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker",
   "Evans", "Edwards", "Collins", "Stewart", "Sanchez", "Morris", "Rogers", "Reed", "Cook", "Morgan",
   "Bell", "Murphy", "Bailey", "Rivera", "Cooper", "Richardson", "Cox", "Howard", "Ward", "Flores",
   "Diaz", "Simmons", "Foster", "Gonzales", "Bryant", "Alexander", "Russell", "Griffin", "Hayes", "Myers",
   "Ford", "Hamilton", "Graham", "Sullivan", "Wallace", "Woods", "Cole", "West", "Jordan", "Owens",
   "Reynolds", "Fisher", "Ellis", "Harrison", "Gibson", "McDonald", "Cruz", "Marshall", "Ortiz", "Gomez",
   "Murray", "Freeman", "Wells", "Webb", "Simpson", "Stevens", "Tucker", "Porter", "Hunter", "Hicks"
 ],

 cities: [
   "New York", "Los Angeles", "London", "Paris", "Berlin", "Tokyo", "San Francisco", "Toronto", "Sydney", "Amsterdam",
   "Barcelona", "Chicago", "Hong Kong", "Singapore", "Stockholm", "Copenhagen", "Melbourne", "Dubai", "Vancouver", "Milan",
   "Oslo", "Zurich", "Munich", "Brussels", "Dublin", "Lisbon", "Vienna", "Prague", "Warsaw", "Budapest",
   "Helsinki", "Tallinn", "Reykjavik", "Seoul", "Bangkok", "Shanghai", "Beijing", "Buenos Aires", "SÃ£o Paulo", "Mexico City",
   "Cape Town", "Nairobi", "Casablanca", "Doha", "Abu Dhabi", "Kuala Lumpur", "Jakarta", "Manila", "Mumbai", "Bangalore",
   "Athens", "Istanbul", "Krakow", "Bratislava", "Ljubljana", "Belgrade", "Sofia", "Tbilisi", "Riga", "Vilnius",
   "Kyiv", "Tel Aviv", "Beirut", "Cairo", "Tehran", "Baghdad", "Karachi", "Lagos", "Accra", "Johannesburg",
   "Havana", "Santiago", "Lima", "Quito", "La Paz", "Montevideo", "AsunciÃ³n", "Panama City", "San JosÃ©", "Porto",
   "Valencia", "Marseille", "Lyon", "Bordeaux", "Frankfurt", "Hamburg", "Cologne", "Stuttgart", "DÃ¼sseldorf", "Leipzig"
 ],

 conjunctions: [
   "&", "-", "and", "et", "und", "_"
 ],

 companyTypes: [
   "Inc.", "LLC", "Ltd.", "GmbH", "S.A.", "S.r.l.", "SARL", "BV", "Oy", "AS",
   "Pty Ltd", "KK", "SpA", "PLC", "LP", "LLP", "SNC", "SCS", "ULC", "Corp.",
   "S.A.S.", "AB", "A/S", "NV", "ApS", "AG", "S.C.", "OÃ", "d.o.o.", "K.K.",
   "EURL", "SL", "SA", "Sdn Bhd", "Tmi", "Sp. z o.o.", "Zrt.", "Ltd. Co.", "LLC Co.", "Co. Ltd."
 ]
 };

 /*
 function seededShuffle(array, seed) {
   let result = array.slice();
   let s = parseInt(seed);
   for (let i = result.length - 1; i > 0; i--) {
  s = (s * 9301 + 49297) % 233280;
  const j = s % (i + 1);
  [result[i], result[j]] = [result[j], result[i]];
   }
   return result;
 }

 function generateCompanyName(seed) {
   if (!/^\d{6}$/.test(seed)) throw new Error("Seed must be 6 digits");
   const counters = Object.fromEntries(Object.keys(arrays).map(k => [k, 0]));
   const baseOrder = ["descriptors","activityFields","activityNouns","surnames","cities"];//,"conjunctions","companyTypes"
   const keyOrder = seededShuffle(baseOrder, seed);
   const structure = [];
   const totalWords = 4 + Number(seed[0]) % 3;
   const getIndex = (key, offset) => {
  const arr = arrays[key];
  const digit = Number(seed[offset % seed.length]);
  const index = (digit + counters[key]) % arr.length;
  counters[key]++;
  return arr[index];
   };
   for (let i = 0; structure.length < totalWords; i++) {
  const key = keyOrder[i % keyOrder.length];
  if (key === "conjunctions" && structure.at(-1) && arrays.conjunctions.includes(structure.at(-1))) continue;
  structure.push(getIndex(key, i));
   }
   const name = structure.join(" ");
   return name.charAt(0).toUpperCase() + name.slice(1);
 }*/

 function xmur3(str) {
   let h = 1779033703 ^ str.length;
   for (let i = 0; i < str.length; i++) {
  h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
  h = (h << 13) | (h >>> 19);
   }
   return function() {
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
   };
 }

 function mulberry32(a) {
   return function() {
  let t = (a += 0x6D2B79F5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
   };
 }




const rng = seededPRNG(baseNum); //seed

function seededShuffle(array, seed) {
  let result = array.slice();
  let s = parseInt(seed);
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateCompanyName(seed) {
  if (!/^\d{6}$/.test(seed)) throw new Error("Seed must be 6 digits");
  const counters = Object.fromEntries(Object.keys(arrays).map(k => [k, 0]));
  const baseOrder = ["descriptors","activityFields","activityNouns","surnames","cities"];//,"conjunctions","companyTypes"
  const keyOrder = seededShuffle(baseOrder, seed);
  const structure = [];
  const totalWords = 4 + Number(seed[0]) % 3;
  const getIndex = (key, offset) => {
    const arr = arrays[key];
    const digit = Number(seed[offset % seed.length]);
    const index = (digit + counters[key]) % arr.length;
    counters[key]++;
    return arr[index];
  };
  for (let i = 0; structure.length < totalWords; i++) {
    const key = keyOrder[i % keyOrder.length];
    if (key === "conjunctions" && structure.at(-1) && arrays.conjunctions.includes(structure.at(-1))) continue;
    structure.push(getIndex(key, i));
  }
  const name = structure.join(" ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function generateCompanyNameJSON(seed) {
  if (!/^\d{6}$/.test(seed)) throw new Error("Seed must be 6 digits");
  const counters = Object.fromEntries(Object.keys(arrays).map(k => [k, 0]));
  const baseOrder = ["descriptors","activityFields","activityNouns","surnames"];//,"cities","conjunctions","companyTypes"
  const keyOrder = seededShuffle(baseOrder, seed);
  const structure = [];
  const totalWords = 4 + Number(seed[0]) % 3;
  const getIndex = (key, offset) => {
    const arr = arrays[key];
    const digit = Number(seed[offset % seed.length]);
    const index = (digit + counters[key]) % arr.length;
    counters[key]++;
    return arr[index];
  };
  for (let i = 0; structure.length < totalWords; i++) {
    const key = keyOrder[i % keyOrder.length];
    if (key === "conjunctions" && structure.at(-1) && arrays.conjunctions.includes(structure.at(-1))) continue;
    structure.push(getIndex(key, i));
  }
  const name = structure.join(" ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

 // === Helpers ===
 function hashSeed(seed) {
   const letters = 'abcdefghijklmnopqrstuvwxyz';
   const part1 = letters[seed % 26];
   const part2 = letters[Math.floor(seed / 26) % 26];
   const num = ('0' + (seed % 100)).slice(-2);
   return `${part1}${part2}-${num}`;
 }

 // === Build page ===
 const container = document.getElementById("Blog1");
 const hostname = window.location.hostname;
 const parts = hostname.split('.');
 const rootDomain = parts.slice(-2).join('.');


 function generateSlug(seed, i) {
   //(LCG)
   function rand() {
  seed = (seed * 9301 + i * 49297) % 233280;
  return seed / 233280;
   }

   const sourceArrays = [
  arrays.descriptors,
  arrays.activityFields,
  arrays.activityNouns,
  arrays.surnames,
  arrays.cities
   ];

   // numWords: 1â3
   const numWords = 1 + Math.floor(rand() * 3);

   const words = [];
   const used = new Set();

   for (let j = 0; j < numWords; j++) {
  let arr;
  do {
    arr = sourceArrays[Math.floor(rand() * sourceArrays.length)];
  } while (used.has(arr) && used.size < sourceArrays.length);
  used.add(arr);

  const word = arr[Math.floor(rand() * arr.length)]
    .toLowerCase()
    .replace(/\s+/g, '');
  words.push(word);
   }

   // W o WH - DETERM.
   const withDash = rand() > 0.5;
   return words.join(withDash ? '-' : '');
 }


 function deterministicPosition(seed, max = 30) {
   // LCG (Linear Congruential Generator)
   let n = (seed * 9301 + 49297) % 233280;
   return (Math.floor((n / 233280) * max) + 1);
 }

 function isMobile() {
   return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
 }

 let ctaPos = 0;

 if (isMobile()) {

  ctaPos = deterministicPosition(baseNum, 1);

 } else {

  ctaPos = deterministicPosition(baseNum, 5);

 }



 function mixDigits(num) {
   // Mix
   let digits = num.split('');
   let mixed1 = [];
   let mixed2 = [];

   // Mischia le cifre in modo alternato
   for (let i = 0; i < digits.length; i++) {
  if (i % 2 === 0) {
    mixed1.push(digits[i]);
  } else {
    mixed2.push(digits[i]);
  }
   }

   let tel4 = '0' + mixed1.join('') + mixed2.join('');
   let tel5 = '0' + mixed2.join('') + mixed1.join('');

   tel4=tel4.substring(0,11);
   tel5=tel5.substring(0,11);

   return { tel4, tel5 };
 }

 ////
 /*
 function normalizeToSubdomain(str) {
  if (!str) return "";

  return str
   .normalize("NFD")                     // separa accenti
   .replace(/[\u0300-\u036f]/g, "")      // rimuove accenti
   .toLowerCase()                        // minuscolo
   .replace(/[^a-z0-9]+/g, "-")          // sostituisce tutto ciÃ² che non Ã¨ [a-z0-9] con "-"
   .replace(/^-+|-+$/g, "")              // rimuove i "-" all'inizio e alla fine
   .slice(0, 63);                        // limite massimo per un subdomain
 }
 */

 function normalizeToSubdomain(str, index = 0) {
  if (!str) return "";

  // 1. Normalizzazione base
  let clean = str
   .normalize("NFD")
   .replace(/[\u0300-\u036f]/g, "")
   .toLowerCase()
   .replace(/[^a-z0-9 ]+/g, " ")     // simboli â spazio
   .trim()
   .replace(/\s+/g, " ");            // spazi multipli â 1

  const words = clean.split(" ");
  const count = words.length;

  // 2. Scelta deterministica in base allâindice:
  //    0 â tutto
  //    1 â 1 parola
  //    2 â 2 parole
  //    (cicla automaticamente)
  const mode = index % 3;

  let selected;

  if (mode === 1 && count >= 1) {
   // prendi 1 sola parola (deterministica)
   const i = index % count;
   selected = [words[i]];
  }
  else if (mode === 2 && count >= 2) {
   // prendi 2 parole (deterministiche)
   const i1 = index % count;
   const i2 = (index + 1) % count;
   selected = [words[i1], words[i2]];
  }
  else {
   // usa tutto
   selected = words;
  }

  // 3. Se 1â2 parole â niente separatore
  let joined;
  if (selected.length <= 2) {
   joined = selected.join("");
  } else {
   joined = selected.join("-");
  }

  // 4. Limite DNS 63 caratteri
  return joined.slice(0, 63);
 }


 const extraDataDiv = document.getElementById("Blog1");
 let extraHTML = "";//"<div>";


 /*
 for (let i = 0; i < 9000; i++) {


 if ((i==ctaPos) && false){

 (function() {

 const destinations = [
   "https://www.enigmatario.com",
   "https://www.enigmatario.com/?p=216",
   "https://www.enigmatario.com/?p=212",
   "https://www.enigmatario.com/?p=209",
   "https://www.enigmatario.com/?p=206",
   "https://www.enigmatario.com/?p=202"
 ];

   const DEST_URL = destinations[baseNum % destinations.length]; //'https://';

   // markup CTA
   function buildCTA() {
  // wrapper figure
  const figure = document.createElement('figure');
  figure.className = 'cta-figure';
  figure.setAttribute('role', 'region');
  //figure.setAttribute('aria-label', 'See full report card');

  // img o placeholder
  const img = document.createElement('img');
  img.src = 'un.png';
  //img.style.width = '160px';
  //img.style.height = '160px';

  img.style.display = 'block';
  img.style.margin = '0 auto';
  img.style.maxWidth = '100%';
  img.style.height = 'auto';

  //img.alt = 'Illustration - full report available';
  img.loading = 'lazy';
  figure.appendChild(img);

  // text
  const figcaption = document.createElement('figcaption');
  figcaption.className = 'cta-caption';

  const h = document.createElement('div');
  h.className = 'cta-title';
  h.textContent = 'Possible Owner Identified'; //Results Found

  const lead = document.createElement('div');
  lead.className = 'cta-lead';
  lead.textContent = 'Full Details Available'; //Click below to v

  // link (styled as button)
  const a = document.createElement('a');
  a.className = 'pulse-btn pulsing';
  a.href = DEST_URL;
  //a.target = '_blank';
  //a.rel = 'noopener noreferrer';
  //a.referrerPolicy = 'no-referrer';
  a.textContent = 'Check Name';
  a.setAttribute('role','button');
  a.setAttribute('aria-label','See full report - opens in new tab');

  // keys
  a.addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.key === 'Enter') {
   e.preventDefault();
   a.click();
    }
  });

  // feedback click
  a.addEventListener('click', function() {
    a.style.opacity = '0.85';
    setTimeout(() => { a.style.opacity = ''; }, 160);
  });

  figcaption.appendChild(h);
  figcaption.appendChild(lead);
  figcaption.appendChild(a);
  figure.appendChild(figcaption);
  container.appendChild(figure);

  // on-scroll (viewport)
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
   entries.forEach(entry => {
     if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
    figure.classList.add('visible');
    io.disconnect();
     }
   });
    }, { threshold: [0.2] });
    io.observe(figure);
  } else {
    setTimeout(() => figure.classList.add('visible'), 300);
  }

  // deactive pulsing when focus
  ['focus', 'mouseenter', 'click'].forEach(evt =>
    a.addEventListener(evt, () => a.classList.remove('pulsing'))
  );
   }

  buildCTA();

 })();
 }//end ctaPos
*/




/*
   const imageSeed = Math.floor(rng() * 1000); // PRNG
   const gender = imageSeed % 2 === 0 ? "men" : "women";
   const imageIndex = imageSeed % 100;
   const imageURL = `https://randomuser.me/api/portraits/${gender}/${imageIndex}.jpg`;
   //console.log(gender+""+imageIndex);



   let num = "";
   for (let d = 0; d < 10; d++) num += Math.floor(rng() * 10);
   const tel1 = `${num.slice(0,3)}-${num.slice(3,6)}-${num.slice(6)}`;
   const tel2 = "0" + num.substring(0,10);
   const { tel4, tel5 } = mixDigits(num.substring(0,10));
   const telFull = `${num.slice(0,3)}${num.slice(3,6)}${num.slice(6)}`;

   if (i == 0) {
  //document.title = name; //+tel1
   }

  let num6 = "";
  for (let d = 0; d < 10; d++) {
    num6 += Math.floor(rng() * 83);
  }

  let num7 = "";
  for (let d = 0; d < 10; d++) {
    num7 += Math.floor(rng() * 61);
  }

  let num8 = "";
  for (let d = 0; d < 10; d++) {
    num8 += Math.floor(rng() * 28);
  }

  let num9 = "";
  for (let d = 0; d < 10; d++) {
    num9 += Math.floor(rng() * 41);
  }

  let num10 = "";
  for (let d = 0; d < 10; d++) {
    num10 += Math.floor(rng() * 33);
  }

  let num11 = "";
  for (let d = 0; d < 10; d++) {
    num11 += Math.floor(rng() * 74);
  }

   tel6 = "0" + num6.substring(0, 10);

   tel7 = "0" + num7.substring(0, 10);

   tel8 = "0" + num8.substring(0, 10);

   tel9 = "0" + num9.substring(0, 10);

   tel10 = "0" + num10.substring(0, 10);

   tel11 = "0" + num11.substring(0, 10);

   if (tel2.substring(3,6) === tel5.substring(6,9)) {
  ////const prefix = generateSlug(seed,i);//hashSeed(parseInt(newSeed,10));
  const prefix = normalizeToSubdomain(name,i);
  const domain = window.location.protocol + "//" + window.location.hostname + "/index.html?" + newSeed;

  extraHTML += `<a href="${domain}" title="${name}, ${tel1},">${name}, ${tel1}</a> (${tel4}) , ,`; //tel2

   } else {
  extraHTML += `${name}, ${tel1} / (${tel2} / ${tel4} / ${tel5} / ${tel6} / ${tel7} / ${tel8} / ${tel9} / ${tel10} / ${tel11}) `;

   }
 }

 extraDataDiv.innerHTML += extraHTML;//+"</div>";
 */



// ===== 0) Helpers =====
function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function gcd(a, b) {
  while (b !== 0) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

function makePermuter90k(seed6, saltStr = "") {

  let m = (fnv1a32(String(seed6) + "|" + saltStr) % 89999) + 1; // 1..89999
  if (m % 2 === 0) m += 1;

  while (m % 3 === 0 || m % 5 === 0 || gcd(m, 90000) !== 1) {
    m += 2;
    if (m >= 90000) m -= 89999;
  }

  const add = fnv1a32("add|" + seed6 + "|" + saltStr) % 90000;

  return function permute90k(n) {
    return (n * m + add) % 90000;
  };
}

function pad6(n) {
  const s = String(n);
  return s.length >= 6 ? s : "0".repeat(6 - s.length) + s;
}

function unique6FromI(baseNum, i, saltStr = "") {
  const MOD = 1000000;
  const MULT = 48271; // coprimo con 1e6
  const add = fnv1a32(String(baseNum) + "|" + saltStr) % MOD;
  const x = (add + (i * MULT) % MOD) % MOD;
  return pad6(x);
}


const TEN_MIN = 1000000000;                  // 10 cifre, prima cifra 1-9
const TEN_SPAN = 9000000000;                 // range totale (da 1e9 a 9.999...e9)

/*
function makeTel11Factory(baseNum, saltStr = "") {

  let A = (fnv1a32("A|" + baseNum + "|" + saltStr) % (TEN_SPAN - 1)) + 1;
  if (A % 2 === 0) A += 1;
  while (A % 3 === 0 || A % 5 === 0) A += 2;
 const B0 = fnv1a32("B|" + baseNum + "|" + saltStr) % TEN_SPAN;
  const permute = makePermuter90k(baseNum, saltStr);

  function makeTel11(i, k, Br) {
    const raw = i * 10 + k;   // 0..89999
    const idx = permute(raw); // 0..89999
    const ten = TEN_MIN + ((idx * A + Br) % TEN_SPAN);
    return "0" + String(ten);
  }

  return { makeTel11, B0 };
}*/

function makeTel11Factory(baseNum, saltStr = "") {
  const permute = makePermuter90k(baseNum, saltStr);

  const A9 = (fnv1a32("A9|" + baseNum + "|" + saltStr) % 999999999) + 1; // 1..999,999,999
  const B9 = fnv1a32("B9|" + baseNum + "|" + saltStr) % 1000000000;      // 0..999,999,999

  return function makeTel11(i, k, rowMixBase) {
    const raw = i * 10 + k;      // 0..89999
    const idx = permute(raw);    // bijezione 0..89999

 const d = (idx % 9) + 1;


/**/
 const mix32 = (Math.imul((idx ^ rowMixBase) >>> 0, A9) >>> 0); // â
 unsigned 0..2^32-1
 const tail9 = (mix32 + B9) % 1000000000;                      // â
 0..999,999,999
 return "0" + String(d) + String(tail9).padStart(9, "0");


//10 digits
// const mix32 = (Math.imul((idx ^ rowMixBase) >>> 0, A9) >>> 0);
// const tail8 = (mix32 + B9) % 100000000;
// return "0" + String(d) + String(tail8).padStart(8, "0");

  };
}

/*const { makeTel11, B0 } = makeTel11Factory(baseNum, hostAccount);*/
const makeTel11 = makeTel11Factory(baseNum, hostAccount);
const contentBlog = [];


let title="";
let numTitle="";

let tel1Global = "";

for (let i = 0; i < 9000; i++) {

  //const rowMixBase = fnv1a32("M|" + baseNum + "|" + hostAccount + "|" + i) % TEN_SPAN;

  const rowMixBase = fnv1a32("M|" + baseNum + "|" + hostAccount + "|" + i);
  /*
  const Br = (B0 + rowMixBase) % TEN_SPAN;
  */

  /*
  const tel1  = makeTel11(i, 0, Br);
  const tel4  = makeTel11(i, 1, Br);
  const tel5  = makeTel11(i, 2, Br);

  const newSeed = unique6FromI(baseNum, i, hostAccount);
  const name = generateCompanyName(newSeed);

  const tel2  = makeTel11(i, 3, Br);
  const tel6  = makeTel11(i, 4, Br);
  const tel7  = makeTel11(i, 5, Br);
  const tel8  = makeTel11(i, 6, Br);
  const tel9  = makeTel11(i, 7, Br);
  const tel10 = makeTel11(i, 8, Br);
  const tel11 = makeTel11(i, 9, Br);
  */



   const seed = baseNum * 1000 + i;
   const rng = seededPRNG(seed);
   const rngNew = seededPRNGnew(seed);
   //const newSeed = rngNew();
   //const name = generateCompanyName(newSeed);

  let num = "";
  for (let d = 0; d < 10; d++) num += Math.floor(rng() * 10);

  //////const tel1 = `${num.slice(0,3)}-${num.slice(3,6)}-${num.slice(6)}`;
  const tel1  = makeTel11(i, 0, rowMixBase);

  //tel1 = `${tel1.slice(0,3)}-${tel1.slice(3,7)}-${tel1.slice(7)}`;



  const tel4  = makeTel11(i, 1, rowMixBase);
  const tel5  = makeTel11(i, 2, rowMixBase);

  const newSeed = unique6FromI(baseNum, i, hostAccount);
  const name = generateCompanyName(newSeed);
  //let tel1Global = "";

  if (i==0) {
   //title=name;
   tel1Global=tel1;

  }

  const tel2  = makeTel11(i, 3, rowMixBase);
  const tel6  = makeTel11(i, 4, rowMixBase);
  const tel7  = makeTel11(i, 5, rowMixBase);
  const tel8  = makeTel11(i, 6, rowMixBase);
  const tel9  = makeTel11(i, 7, rowMixBase);
  const tel10 = makeTel11(i, 8, rowMixBase);
  const tel11 = makeTel11(i, 9, rowMixBase);


  const safeName = escapeHtml(name);
  const safeTel1 = escapeHtml(tel1);
  const safeTel4 = escapeHtml(tel4);

  const h = fnv1a32(baseNum + "|" + i);
  if ((h % 100) < 1) {
    const domain = window.location.protocol + "//" + window.location.hostname + "/?" + newSeed;
    contentBlog.push(
      `<a href="${domain}" title="${safeName}, ${safeTel1},">${safeName}, ${safeTel1}</a> (${safeTel4}) , ,`
    );
  } else {
    contentBlog.push(
      `${safeName}, ${safeTel1} / (${tel2} / ${tel4} / ${tel5} / ${tel6} / ${tel7} / ${tel8} / ${tel9} / ${tel10} / ${tel11}) `
    );
  }
}

extraDataDiv.innerHTML = contentBlog.join("");








(function () {

  /* =====================================================
     ð¢ SEED DETERMINISTICO (da query ?613540)
     ===================================================== */

function getSeed() {
  const q = window.location.search.replace("?", "");
  const n = parseInt(q, 10);
  return Number.isFinite(n) ? n : 100000;
}

    //let seed1 = getSeed();
  let seed1 = baseNum;

// LCG: Linear Congruential Generator (32-bit)
function nextSeed() {
  seed1 = (Math.imul(seed1, 1664525) + 1013904223) >>> 0;
  return seed1;
}

function pick(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const s = nextSeed();
  return arr[s % arr.length];
}

  /* =====================================================
     ð§± DATA POOLS â MODIFICA QUESTI
     ===================================================== */

const JOB_TITLES = [
  "Customer Care Representative",
  "Call Center Operator",
  "Inbound Call Center Agent",
  "Outbound Call Center Agent",
  "Customer Support Specialist",
  "Customer Service Associate",
  "Customer Service Advisor",
  "Customer Experience Agent",
  "Client Support Representative",
  "Contact Center Agent",

  "Telemarketing Specialist",
  "Appointment Setter",
  "Sales Support Agent",
  "Inside Sales Representative",
  "Lead Generation Specialist",
  "Business Development Representative",
  "Telesales Agent",
  "Sales Call Agent",
  "Customer Acquisition Specialist",
  "Outbound Sales Agent",

  "Help Desk Operator",
  "Help Desk Support Agent",
  "Support Desk Representative",
  "Technical Support Agent",
  "First Line Support Agent",
  "Service Desk Agent",
  "Customer Assistance Agent",
  "Remote Support Operator",
  "Client Assistance Representative",
  "Support Call Agent",

  "Call Handling Specialist",
  "Customer Relations Agent",
  "Customer Relations Officer",
  "Client Relations Representative",
  "Customer Engagement Agent",
  "Customer Interaction Specialist",
  "Client Communication Officer",
  "Customer Contact Specialist",
  "Customer Outreach Agent",
  "Customer Success Associate",

  "Call Center Associate",
  "Call Center Representative",
  "Virtual Call Center Agent",
  "Remote Call Center Operator",
  "Phone Support Agent",
  "Telephone Support Specialist",
  "Customer Phone Agent",
  "Call Support Agent",
  "Customer Hotline Operator",
  "Inbound Support Agent",

  "Appointment Scheduling Agent",
  "Interview Scheduling Assistant",
  "Recruitment Support Agent",
  "Hiring Support Assistant",
  "Candidate Outreach Specialist",
  "Recruitment Call Agent",
  "HR Support Call Agent",
  "Candidate Contact Representative",
  "Interview Coordination Agent",
  "Talent Outreach Assistant",

  "Customer Service Executive",
  "Customer Service Officer",
  "Client Service Representative",
  "Service Support Agent",
  "Customer Helpdesk Officer",
  "Customer Information Agent",
  "Service Call Representative",
  "Customer Query Specialist",
  "Customer Resolution Agent",
  "Customer Support Executive"
];


const DESCRIPTIONS = [
  "<p>Handle inbound calls and assist customers with scheduling interviews and appointments.</p>",
  "<p>Contact potential clients by phone to provide information and coordinate follow-up calls.</p>",
  "<p>Support customer communication activities by managing calls and booking appointments.</p>",
  "<p>Perform outbound calling to introduce services and arrange meetings with interested parties.</p>",
  "<p>Assist customers through phone support and ensure accurate appointment scheduling.</p>",

  "<p>Manage incoming and outgoing calls while maintaining clear and professional communication.</p>",
  "<p>Coordinate phone-based interactions to support customer engagement and interview setup.</p>",
  "<p>Provide telephone assistance to customers and guide them through the scheduling process.</p>",
  "<p>Handle call center activities focused on connecting clients with the appropriate contacts.</p>",
  "<p>Support daily call operations and ensure timely appointment confirmations.</p>",

  "<p>Engage with customers over the phone to share information and fix suitable meeting times.</p>",
  "<p>Conduct phone outreach activities to assist with interview coordination.</p>",
  "<p>Respond to customer inquiries via telephone and organize follow-up appointments.</p>",
  "<p>Carry out structured phone conversations to support client and candidate scheduling.</p>",
  "<p>Assist internal teams by managing customer calls and booking meeting slots.</p>",

  "<p>Handle customer calls efficiently while maintaining accurate records of appointments.</p>",
  "<p>Provide professional phone support and help users arrange suitable appointment times.</p>",
  "<p>Coordinate conversations between companies and candidates through scheduled calls.</p>",
  "<p>Support contact center operations by ensuring smooth phone communication.</p>",
  "<p>Assist with interview and meeting scheduling through structured phone interaction.</p>",

  "<p>Engage callers with a clear and polite approach, supporting appointment coordination.</p>",
  "<p>Manage call-based communication to connect clients and candidates effectively.</p>",
  "<p>Ensure high-quality phone interactions while organizing interview appointments.</p>",
  "<p>Support customer communication by handling calls and scheduling discussions.</p>",
  "<p>Act as a point of contact for phone-based appointment and interview coordination.</p>",

  "<p>Handle daily call activities aimed at facilitating meetings and interviews.</p>",
  "<p>Assist customers and candidates through clear phone communication.</p>",
  "<p>Manage outbound and inbound calls to help schedule discussions and follow-ups.</p>",
  "<p>Provide structured telephone support to coordinate appointments efficiently.</p>",

  "<p>Support phone-based communication by handling calls and coordinating appointment schedules.</p>",
  "<p>Engage with callers professionally and assist in arranging interviews and meetings.</p>",
  "<p>Carry out structured call activities focused on scheduling and customer coordination.</p>",
  "<p>Provide timely phone assistance to help clients and candidates connect efficiently.</p>",
  "<p>Manage call workflows to support accurate appointment booking and follow-ups.</p>",

  "<p>Handle customer calls with attention to detail and ensure proper scheduling of discussions.</p>",
  "<p>Assist in coordinating phone conversations between companies and interested candidates.</p>",
  "<p>Support outbound and inbound calling tasks related to appointment and interview setup.</p>",
  "<p>Maintain professional telephone communication while managing scheduling requests.</p>",
  "<p>Coordinate customer interactions by phone to facilitate meetings and interviews.</p>",

  "<p>Support call center operations focused on appointment confirmation and coordination.</p>",
  "<p>Engage in phone-based customer communication to manage interview scheduling.</p>",
  "<p>Assist clients through clear phone guidance and accurate appointment handling.</p>",
  "<p>Handle telephone interactions efficiently to ensure timely coordination of meetings.</p>",
  "<p>Support daily calling activities aimed at connecting customers and candidates.</p>",

  "<p>Provide structured phone support to manage interview and appointment requests.</p>",
  "<p>Conduct professional call interactions to support scheduling and follow-up actions.</p>",
  "<p>Assist with call coordination activities to ensure smooth communication.</p>",
  "<p>Handle phone conversations that focus on organizing meetings and interviews.</p>",
  "<p>Support business communication by managing appointment-related phone calls.</p>"
];

function normalizeSeed(n) {
  return String(n % 1_000_000).padStart(6, "0");
}

const COMPANIES = [];

for (let i = 0; i < 50; i++) {
  const seed2 = normalizeSeed(seed1 + i * 37);
  const companyName = generateCompanyNameJSON(seed2);
  COMPANIES.push(companyName);
}

const CITIES = [
    { city: "New York", region: "NY", cap: "10001", country: "US", currency: "USD", dialCode: "1" },
    { city: "Los Angeles", region: "CA", cap: "90001", country: "US", currency: "USD", dialCode: "1" },
    { city: "Chicago", region: "IL", cap: "60601", country: "US", currency: "USD", dialCode: "1" },
    { city: "Houston", region: "TX", cap: "77001", country: "US", currency: "USD", dialCode: "1" },
    { city: "Miami", region: "FL", cap: "33101", country: "US", currency: "USD", dialCode: "1" },
    { city: "San Francisco", region: "CA", cap: "94101", country: "US", currency: "USD", dialCode: "1" },
    { city: "Seattle", region: "WA", cap: "98101", country: "US", currency: "USD", dialCode: "1" },
    { city: "Boston", region: "MA", cap: "02101", country: "US", currency: "USD", dialCode: "1" },
    { city: "Washington", region: "DC", cap: "20001", country: "US", currency: "USD", dialCode: "1" },
    { city: "Atlanta", region: "GA", cap: "30301", country: "US", currency: "USD", dialCode: "1" },

    { city: "Toronto", region: "ON", cap: "M5H", country: "CA", currency: "CAD", dialCode: "1" },
    { city: "Vancouver", region: "BC", cap: "V5K", country: "CA", currency: "CAD", dialCode: "1" },
    { city: "Montreal", region: "QC", cap: "H1A", country: "CA", currency: "CAD", dialCode: "1" },
    { city: "Calgary", region: "AB", cap: "T1X", country: "CA", currency: "CAD", dialCode: "1" },
    { city: "Ottawa", region: "ON", cap: "K1A", country: "CA", currency: "CAD", dialCode: "1" },

    { city: "Mexico City", region: "CDMX", cap: "01000", country: "MX", currency: "MXN", dialCode: "52" },
    { city: "Guadalajara", region: "JAL", cap: "44100", country: "MX", currency: "MXN", dialCode: "52" },
    { city: "Monterrey", region: "NLE", cap: "64000", country: "MX", currency: "MXN", dialCode: "52" },
    { city: "BogotÃ¡", region: "DC", cap: "110111", country: "CO", currency: "COP", dialCode: "57" },
    { city: "MedellÃ­n", region: "ANT", cap: "050021", country: "CO", currency: "COP", dialCode: "57" },

    { city: "London", region: "ENG", cap: "EC1A", country: "GB", currency: "GBP", dialCode: "44" },
    { city: "Manchester", region: "ENG", cap: "M1", country: "GB", currency: "GBP", dialCode: "44" },
    { city: "Birmingham", region: "ENG", cap: "B1", country: "GB", currency: "GBP", dialCode: "44" },
    { city: "Liverpool", region: "ENG", cap: "L1", country: "GB", currency: "GBP", dialCode: "44" },
    { city: "Edinburgh", region: "SCT", cap: "EH1", country: "GB", currency: "GBP", dialCode: "44" },

    { city: "Dublin", region: "D", cap: "D01", country: "IE", currency: "EUR", dialCode: "353" },
    { city: "Paris", region: "IDF", cap: "75001", country: "FR", currency: "EUR", dialCode: "33" },
    { city: "Lyon", region: "ARA", cap: "69001", country: "FR", currency: "EUR", dialCode: "33" },
    { city: "Marseille", region: "PAC", cap: "13001", country: "FR", currency: "EUR", dialCode: "33" },
    { city: "Nice", region: "PAC", cap: "06000", country: "FR", currency: "EUR", dialCode: "33" },

    { city: "Berlin", region: "BE", cap: "10115", country: "DE", currency: "EUR", dialCode: "49" },
    { city: "Munich", region: "BY", cap: "80331", country: "DE", currency: "EUR", dialCode: "49" },
    { city: "Hamburg", region: "HH", cap: "20095", country: "DE", currency: "EUR", dialCode: "49" },
    { city: "Frankfurt", region: "HE", cap: "60311", country: "DE", currency: "EUR", dialCode: "49" },
    { city: "Cologne", region: "NW", cap: "50667", country: "DE", currency: "EUR", dialCode: "49" },

    { city: "Amsterdam", region: "NH", cap: "1011", country: "NL", currency: "EUR", dialCode: "31" },
    { city: "Rotterdam", region: "ZH", cap: "3011", country: "NL", currency: "EUR", dialCode: "31" },
    { city: "Utrecht", region: "UT", cap: "3511", country: "NL", currency: "EUR", dialCode: "31" },
    { city: "Brussels", region: "BRU", cap: "1000", country: "BE", currency: "EUR", dialCode: "32" },
    { city: "Antwerp", region: "VLG", cap: "2000", country: "BE", currency: "EUR", dialCode: "32" },

    { city: "Madrid", region: "MD", cap: "28001", country: "ES", currency: "EUR", dialCode: "34" },
    { city: "Barcelona", region: "CT", cap: "08001", country: "ES", currency: "EUR", dialCode: "34" },
    { city: "Valencia", region: "VC", cap: "46001", country: "ES", currency: "EUR", dialCode: "34" },
    { city: "Seville", region: "AN", cap: "41001", country: "ES", currency: "EUR", dialCode: "34" },
    { city: "Lisbon", region: "LIS", cap: "1100-001", country: "PT", currency: "EUR", dialCode: "351" },
    { city: "Porto", region: "POR", cap: "4000-001", country: "PT", currency: "EUR", dialCode: "351" },

    { city: "Rome", region: "RM", cap: "00118", country: "IT", currency: "EUR", dialCode: "39" },
    { city: "Milan", region: "MI", cap: "20121", country: "IT", currency: "EUR", dialCode: "39" },
    { city: "Naples", region: "NA", cap: "80100", country: "IT", currency: "EUR", dialCode: "39" },
    { city: "Turin", region: "TO", cap: "10121", country: "IT", currency: "EUR", dialCode: "39" },

    { city: "Zurich", region: "ZH", cap: "8001", country: "CH", currency: "CHF", dialCode: "41" },
    { city: "Geneva", region: "GE", cap: "1201", country: "CH", currency: "CHF", dialCode: "41" },
    { city: "Vienna", region: "W", cap: "1010", country: "AT", currency: "EUR", dialCode: "43" },
    { city: "Prague", region: "PR", cap: "11000", country: "CZ", currency: "CZK", dialCode: "420" },
    { city: "Budapest", region: "BU", cap: "1011", country: "HU", currency: "HUF", dialCode: "36" },
    { city: "Warsaw", region: "MZ", cap: "00-001", country: "PL", currency: "PLN", dialCode: "48" },
    { city: "Krakow", region: "MA", cap: "30-001", country: "PL", currency: "PLN", dialCode: "48" },
    { city: "Stockholm", region: "AB", cap: "10012", country: "SE", currency: "SEK", dialCode: "46" },
    { city: "Oslo", region: "03", cap: "0101", country: "NO", currency: "NOK", dialCode: "47" },
    { city: "Copenhagen", region: "84", cap: "1050", country: "DK", currency: "DKK", dialCode: "45" },

    { city: "Helsinki", region: "UUS", cap: "00100", country: "FI", currency: "EUR", dialCode: "358" },
    { city: "Tokyo", region: "13", cap: "100-0001", country: "JP", currency: "JPY", dialCode: "81" },
    { city: "Osaka", region: "27", cap: "530-0001", country: "JP", currency: "JPY", dialCode: "81" },
    { city: "Seoul", region: "11", cap: "04524", country: "KR", currency: "KRW", dialCode: "82" },
    { city: "Busan", region: "26", cap: "48900", country: "KR", currency: "KRW", dialCode: "82" },

    { city: "Beijing", region: "BJ", cap: "100000", country: "CN", currency: "CNY", dialCode: "86" },
    { city: "Shanghai", region: "SH", cap: "200000", country: "CN", currency: "CNY", dialCode: "86" },
    { city: "Shenzhen", region: "GD", cap: "518000", country: "CN", currency: "CNY", dialCode: "86" },
    { city: "Hong Kong", region: "HK", cap: "999077", country: "HK", currency: "HKD", dialCode: "852" },
    { city: "Singapore", region: "SG", cap: "018989", country: "SG", currency: "SGD", dialCode: "65" },

    { city: "Bangkok", region: "BK", cap: "10200", country: "TH", currency: "THB", dialCode: "66" },
    { city: "Jakarta", region: "JK", cap: "10110", country: "ID", currency: "IDR", dialCode: "62" },
    { city: "Manila", region: "NCR", cap: "1000", country: "PH", currency: "PHP", dialCode: "63" },
    { city: "Kuala Lumpur", region: "WP", cap: "50000", country: "MY", currency: "MYR", dialCode: "60" },
    { city: "Ho Chi Minh City", region: "SG", cap: "700000", country: "VN", currency: "VND", dialCode: "84" },
    { city: "Hanoi", region: "HN", cap: "100000", country: "VN", currency: "VND", dialCode: "84" },

    { city: "Delhi", region: "DL", cap: "110001", country: "IN", currency: "INR", dialCode: "91" },
    { city: "Mumbai", region: "MH", cap: "400001", country: "IN", currency: "INR", dialCode: "91" },
    { city: "Bangalore", region: "KA", cap: "560001", country: "IN", currency: "INR", dialCode: "91" },
    { city: "Chennai", region: "TN", cap: "600001", country: "IN", currency: "INR", dialCode: "91" },

    { city: "Dubai", region: "DU", cap: "00000", country: "AE", currency: "AED", dialCode: "971" },
    { city: "Abu Dhabi", region: "AZ", cap: "00000", country: "AE", currency: "AED", dialCode: "971" },
    { city: "Doha", region: "DA", cap: "00000", country: "QA", currency: "QAR", dialCode: "974" },
    { city: "Riyadh", region: "RD", cap: "11564", country: "SA", currency: "SAR", dialCode: "966" },
    { city: "Jeddah", region: "JD", cap: "21442", country: "SA", currency: "SAR", dialCode: "966" },

    { city: "Cairo", region: "C", cap: "11511", country: "EG", currency: "EGP", dialCode: "20" },
    { city: "Casablanca", region: "CA", cap: "20000", country: "MA", currency: "MAD", dialCode: "212" },
    { city: "Johannesburg", region: "GP", cap: "2000", country: "ZA", currency: "ZAR", dialCode: "27" },
    { city: "Cape Town", region: "WC", cap: "8000", country: "ZA", currency: "ZAR", dialCode: "27" },
    { city: "Nairobi", region: "110", cap: "00100", country: "KE", currency: "KES", dialCode: "254" },

    { city: "Sydney", region: "NSW", cap: "2000", country: "AU", currency: "AUD", dialCode: "61" },
    { city: "Melbourne", region: "VIC", cap: "3000", country: "AU", currency: "AUD", dialCode: "61" },
    { city: "Brisbane", region: "QLD", cap: "4000", country: "AU", currency: "AUD", dialCode: "61" },
    { city: "Perth", region: "WA", cap: "6000", country: "AU", currency: "AUD", dialCode: "61" },
    { city: "Auckland", region: "AUK", cap: "1010", country: "NZ", currency: "NZD", dialCode: "64" },
    { city: "Wellington", region: "WGN", cap: "6011", country: "NZ", currency: "NZD", dialCode: "64" },

    { city: "SÃ£o Paulo", region: "SP", cap: "01000-000", country: "BR", currency: "BRL", dialCode: "55" },
    { city: "Rio de Janeiro", region: "RJ", cap: "20000-000", country: "BR", currency: "BRL", dialCode: "55" },
    { city: "Buenos Aires", region: "C", cap: "1000", country: "AR", currency: "ARS", dialCode: "54" },
    { city: "Santiago", region: "RM", cap: "8320000", country: "CL", currency: "CLP", dialCode: "56" }
  ];





const SALARIES = [
  1000, 1050, 1100, 1150, 1200,
  1250, 1300, 1350, 1400, 1450,
  1500, 1550, 1600, 1650, 1700,
  1750, 1800, 1850, 1900, 1950,

  2000, 2050, 2100, 2150, 2200,
  2250, 2300, 2350, 2400, 2450,
  2500, 2550, 2600, 2650, 2700,
  2750, 2800, 2850, 2900, 2950,

  3000, 3050, 3100, 3150, 3200,
  3250, 3300, 3350, 3400, 3450,
  3500, 3550, 3600, 3650, 3700,
  3750, 3800, 3850, 3900, 3950,

  4000, 4050, 4100, 4150, 4200,
  4250, 4300, 4350, 4400, 4450,
  4500, 4600, 4700, 4800, 4900,
  5000, 5100, 5200, 5300, 5400,
  5500, 5600, 5700, 5800, 5900,
  6000
];

  const EMPLOYMENTS = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACTOR",
  "TEMPORARY"
];

  /* =====================================================
     ð¦ VALORI DERIVATI (DETERMINISTICI)
     ===================================================== */


  const description = pick(DESCRIPTIONS);

  // Remote flag (deterministic)
  const IS_REMOTE = (seed1 % 3) === 0;

  const company = pick(COMPANIES);

  const loc = pick(CITIES);

  const salary = pick(SALARIES);

  const employmentType = pick(EMPLOYMENTS);

  const jobId = "JOB-" + normalizeSeed(getSeed());

  const today = new Date().toISOString().split("T")[0];



/* =====================================================
     4) Phone generation using loc.dialCode (prefisso)
     ===================================================== */

  function generateLocalNumber(seed1) {
    // produce 9 digits (deterministic) -> avoid leading zeros issues
    const n = (Math.abs(seed1) * 2654435761) % 1_000_000_000; // 0..999,999,999
    return String(n).padStart(9, "0");
  }

  const localNumber = generateLocalNumber(seed1);
  const telE164 = `+${loc.dialCode}-${tel1Global.substring(0,9)}###`; // e.g. +14165551234 style (not formatted with spaces)

  const jobTitle = "("+telE164+"), " + pick(JOB_TITLES) + " - " + loc.city;

  /* =====================================================
     ð§¾ JSON-LD JobPosting
     ===================================================== */

  const jobPosting = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": jobTitle,
    "description": description,
    "datePosted": today,
    "validThrough": "2026-12-31T23:59:59+01:00",
    "employmentType": [employmentType],
    "hiringOrganization": {
      "@type": "Organization",
      "name": company,
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": telE164,
          "contactType": "recruitment"
        }
      ]
    },
    "identifier": {
      "@type": "PropertyValue",
      "name": company,
      "value": jobId
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": loc.currency || "EUR",
      "value": {
        "@type": "QuantitativeValue",
        "value": salary,
        "unitText": "MONTH"
      }
    },
    "directApply": true
  };

  // Remote vs onsite location fields
  if (IS_REMOTE) {
    jobPosting.jobLocationType = "TELECOMMUTE";
    jobPosting.applicantLocationRequirements = {
      "@type": "Country",
      "name": loc.country || "IT"
    };
  } else {
    jobPosting.jobLocation = {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": loc.city,
        "addressRegion": loc.region,
        "postalCode": loc.cap,
        "addressCountry": loc.country
      }
    };
  }

  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(jobPosting);
  /////////document.head.appendChild(s);

  document.title = jobTitle;
})();

}


```

## Synthetic Phone Generation

The `ext.js` file is responsible for generating the content that Googlebot sees. Its process is fairly simple once it is broken down.

First, the script creates a **six-digit seed**. If the URL already contains a six-digit number in the query string, it uses that number directly. If not, it takes the first part of the hostname, such as `d32pd4f1mpas2n`, hashes it using **FNV-1a**, and converts the result into a six-digit value. This means the same hostname will always generate the same starting seed.

The script then uses that seed together with the hostname to generate phone-like numbers. It does not simply choose random numbers. Instead, it uses deterministic mathematical operations, hashes, and permutations, so the output is reproducible. The same seed and hostname will always generate the same numbers.

The generator runs through **9,000 iterations**, and during each iteration it creates **10 different phone numbers**. This allows one seed to produce up to **90,000 phone-like values**.

At the same time, the script creates synthetic company names by combining words from predefined lists of industries, surnames, cities, and descriptive terms. It then associates those generated company names with the generated phone numbers, creating content that looks like real business or directory information.

A small percentage of those generated entries are also turned into internal links containing new six-digit seeds. This creates additional URLs that can generate different deterministic sets of phone numbers and company names , allowing the amount of synthetic content to grow far beyond the initial page.

The key point is that **these phone numbers are not being pulled from a real phone database**. They are generated mathematically. This explains how the number I was investigating appeared in Google: it was one of the numbers produced by the algorithm, rather than evidence that the website actually had information about the owner of that number.

> **At this point, it was still unclear why this infrastructure was generating such a large amount of synthetic content, or what the ultimate purpose of the operation was.**

## Redirect Behavior

The next important clue was the way human visitors were treated. While Googlebot was allowed to load the generated content through `ext.js`, a normal user arriving from Google was redirected to `wrdforwrd.com`.

This means the CloudFront page was not really designed to be consumed by normal visitors. Instead, it appears to function mainly as a **search-engine entry point**, while real users are sent to a separate destination after clicking the Google result.

That behavior makes the overall structure much clearer: the synthetic page appears designed to attract visibility in search results, while the actual visitor is moved elsewhere.

## Monetization

After following the redirect, the purpose of the operation became more apparent. The destination site, `wrdforwrd.com`, was configured with **Google AdSense** using the publisher identifier `ca-pub-3056536923122981`, meaning the redirected traffic could be monetized through advertising.

The site also used **Matomo analytics** hosted on `diamondslovers.org`, allowing the operator to track visits and identify the CloudFront page as the traffic source.

At this stage, the likely purpose of the infrastructure became much easier to understand: **generate large amounts of synthetic content, get that content indexed by Google, attract organic clicks from users searching for phone numbers or related information, redirect those users to an ad-supported site, and potentially generate advertising revenue from that traffic.**

In simple terms:

**Synthetic content → Google indexing → organic search traffic → redirect → advertising monetization.**

![Redirect and monetization investigation result](/images/research/reverse-phone-seo-cloaking/4.png)
