const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./kurstanla.db");

const courses = [
  ["IELTS Intensive", "Til", "Registon LC", 4.9, "320 talaba", "4 oy", "Seshanba", "14:00", 1200000, "IELTS imtihoniga tayyorlov kursi."],
  ["Frontend Dasturlash", "IT", "PDP Academy", 4.8, "280 talaba", "5 oy", "Dushanba", "16:00", 1500000, "HTML, CSS, JavaScript va React asoslari."],
  ["Grafik Dizayn Pro", "Dizayn", "Najot Ta’lim", 4.7, "190 talaba", "3 oy", "Payshanba", "15:00", 950000, "Photoshop, Illustrator va brending asoslari."],
  ["Matematika Abituriyent", "Fan", "Everest", 4.8, "210 talaba", "6 oy", "Dushanba", "09:00", 800000, "Abituriyentlar uchun matematika kursi."],
  ["SMM Professional", "IT", "IT Live", 4.6, "160 talaba", "2 oy", "Payshanba", "18:00", 700000, "SMM, reklama va kontent reja."],
  ["Arab Tili Asoslari", "Til", "Hilol Education", 4.9, "145 talaba", "5 oy", "Chorshanba", "10:00", 850000, "Arab tili alifbo va grammatika asoslari."],
  ["Python Dasturlash", "IT", "Najot Ta’lim", 4.9, "350 talaba", "5 oy", "Juma", "10:00", 1300000, "Python asoslari, OOP va amaliy loyihalar."],
  ["Backend NodeJS", "IT", "PDP Academy", 4.8, "200 talaba", "4 oy", "Chorshanba", "17:00", 1400000, "NodeJS, Express, API va database."],
  ["Java Dasturlash", "IT", "IT Center", 4.7, "170 talaba", "5 oy", "Seshanba", "11:00", 1350000, "Java Core, OOP va backend asoslari."],
  ["C++ Foundation", "IT", "Sam IT School", 4.6, "140 talaba", "4 oy", "Payshanba", "12:00", 1100000, "C++ sintaksisi va algoritmlar."],
  ["Flutter Mobil Ilovalar", "IT", "PDP Academy", 4.8, "190 talaba", "5 oy", "Dushanba", "17:30", 1500000, "Android va iOS ilovalar yaratish."],
  ["Kiberxavfsizlik Asoslari", "IT", "IT Live", 4.7, "120 talaba", "3 oy", "Juma", "15:00", 1250000, "Tarmoq xavfsizligi va himoya usullari."],
  ["Data Analyst", "IT", "Najot Ta’lim", 4.8, "160 talaba", "4 oy", "Shanba", "10:30", 1450000, "Excel, SQL, Power BI va tahlil."],
  ["Sun’iy Intellekt Asoslari", "IT", "AI Academy", 4.9, "130 talaba", "6 oy", "Payshanba", "16:30", 1800000, "AI va machine learning tushunchalari."],
  ["Kompyuter Savodxonligi", "IT", "Digital Start", 4.5, "260 talaba", "2 oy", "Dushanba", "08:30", 500000, "Word, Excel va internet asoslari."],

  ["Rus Tili Boshlang‘ich", "Til", "Cambridge LC", 4.6, "180 talaba", "3 oy", "Seshanba", "09:00", 650000, "Rus tilini 0 dan o‘rganish."],
  ["Ingliz Tili Beginner", "Til", "Everest", 4.7, "240 talaba", "4 oy", "Dushanba", "10:00", 750000, "Ingliz tilini boshlang‘ich darajadan o‘rganish."],
  ["Koreys Tili", "Til", "Korea Study", 4.8, "120 talaba", "5 oy", "Chorshanba", "14:00", 900000, "TOPIK imtihoniga tayyorlov."],
  ["Turk Tili", "Til", "Istanbul Academy", 4.6, "95 talaba", "3 oy", "Juma", "11:00", 700000, "Turk tili so‘zlashuv va grammatika."],
  ["Mental Arifmetika", "Fan", "Smart Kids", 4.7, "150 talaba", "4 oy", "Shanba", "09:30", 600000, "Bolalar uchun tez hisoblash kursi."],
  ["Fizika Abituriyent", "Fan", "Registon LC", 4.6, "130 talaba", "6 oy", "Seshanba", "16:00", 850000, "DTM va testlarga tayyorlov."],
  ["Kimyo Abituriyent", "Fan", "Everest", 4.6, "110 talaba", "6 oy", "Payshanba", "14:30", 850000, "Kimyo nazariya va masalalar."],
  ["Biologiya Abituriyent", "Fan", "BioMed Academy", 4.7, "125 talaba", "6 oy", "Juma", "15:30", 800000, "Biologiyadan imtihonga tayyorlov."],
  ["3D Max Dizayn", "Dizayn", "Design School", 4.8, "90 talaba", "4 oy", "Dushanba", "18:00", 1300000, "Interyer va 3D modellashtirish."],
  ["UI/UX Dizayn", "Dizayn", "Najot Ta’lim", 4.9, "180 talaba", "4 oy", "Chorshanba", "18:30", 1400000, "Figma, prototip va mobil/web dizayn."]
];

db.serialize(() => {
  const stmt = db.prepare(`
    INSERT INTO courses 
    (title, category, center, rating, students, duration, day, time, price, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  courses.forEach(course => {
    stmt.run(course);
  });

  stmt.finalize();
});

db.close(() => {
  console.log("25 ta kurs databasega qo‘shildi ✅");
});