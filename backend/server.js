const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
const JWT_SECRET = "kurs_tanla_secret_key";

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./kurstanla.db", (err) => {
  if (err) console.log("Database xato:", err.message);
  else console.log("SQLite database ulandi ✅");
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      category TEXT,
      center TEXT,
      rating REAL,
      students TEXT,
      duration TEXT,
      day TEXT,
      time TEXT,
      price INTEGER,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId INTEGER,
      name TEXT,
      experience TEXT,
      students TEXT,
      rating REAL,
      FOREIGN KEY(courseId) REFERENCES courses(id)
    )
  `);
});

app.get("/", (req, res) => {
  res.send("KursTanla backend ishlayapti 🚀");
});

/* AUTH */
app.post("/api/register", async (req, res) => {
  const { firstName, email, password } = req.body;

  if (!firstName || !email || !password) {
    return res.status(400).json({ message: "Barcha maydonlarni to‘ldiring" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (firstName, email, password, role) VALUES (?, ?, ?, ?)`,
    [firstName, email, hashedPassword, "user"],
    function (err) {
      if (err) return res.status(400).json({ message: "Bu email allaqachon mavjud" });
      res.json({ message: "Ro‘yxatdan o‘tildi" });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ message: "Server xatosi" });

    if (!user) {
      return res.status(400).json({ message: "Email yoki parol noto‘g‘ri" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Email yoki parol noto‘g‘ri" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Tizimga kirildi",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        role: user.role
      }
    });
  });
});

/* COURSES */
app.get("/api/courses", (req, res) => {
  db.all(`SELECT * FROM courses ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Kurslarni olishda xatolik" });
    res.json(rows);
  });
});

app.post("/api/courses", (req, res) => {
  const { title, category, center, rating, students, duration, day, time, price, description } = req.body;

  db.run(
    `INSERT INTO courses 
    (title, category, center, rating, students, duration, day, time, price, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, category, center, rating, students, duration, day, time, price, description],
    function (err) {
      if (err) return res.status(500).json({ message: "Kurs qo‘shishda xatolik" });
      res.json({ message: "Kurs qo‘shildi", id: this.lastID });
    }
  );
});

app.put("/api/courses/:id", (req, res) => {
  const { id } = req.params;
  const { title, category, center, rating, students, duration, day, time, price, description } = req.body;

  db.run(
    `UPDATE courses SET
      title=?, category=?, center=?, rating=?, students=?, duration=?, day=?, time=?, price=?, description=?
     WHERE id=?`,
    [title, category, center, rating, students, duration, day, time, price, description, id],
    function (err) {
      if (err) return res.status(500).json({ message: "Kursni tahrirlashda xatolik" });
      res.json({ message: "Kurs yangilandi" });
    }
  );
});

app.delete("/api/courses/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM courses WHERE id=?`, [id], function (err) {
    if (err) return res.status(500).json({ message: "Kursni o‘chirishda xatolik" });
    res.json({ message: "Kurs o‘chirildi" });
  });
});

/* TEACHERS */
app.get("/api/teachers", (req, res) => {
  db.all(
    `SELECT teachers.*, courses.title AS courseTitle
     FROM teachers
     LEFT JOIN courses ON teachers.courseId = courses.id
     ORDER BY teachers.id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "O‘qituvchilarni olishda xatolik" });
      res.json(rows);
    }
  );
});

app.post("/api/teachers", (req, res) => {
  const { courseId, name, experience, students, rating } = req.body;

  db.run(
    `INSERT INTO teachers (courseId, name, experience, students, rating)
     VALUES (?, ?, ?, ?, ?)`,
    [courseId, name, experience, students, rating],
    function (err) {
      if (err) return res.status(500).json({ message: "O‘qituvchi qo‘shishda xatolik" });
      res.json({ message: "O‘qituvchi qo‘shildi", id: this.lastID });
    }
  );
});

app.put("/api/teachers/:id", (req, res) => {
  const { id } = req.params;
  const { courseId, name, experience, students, rating } = req.body;

  db.run(
    `UPDATE teachers SET courseId=?, name=?, experience=?, students=?, rating=? WHERE id=?`,
    [courseId, name, experience, students, rating, id],
    function (err) {
      if (err) return res.status(500).json({ message: "O‘qituvchini tahrirlashda xatolik" });
      res.json({ message: "O‘qituvchi yangilandi" });
    }
  );
});

app.delete("/api/teachers/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM teachers WHERE id=?`, [id], function (err) {
    if (err) return res.status(500).json({ message: "O‘qituvchini o‘chirishda xatolik" });
    res.json({ message: "O‘qituvchi o‘chirildi" });
  });
});

app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishlayapti ✅`);
});