const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const db = new sqlite3.Database("./kurstanla.db");

async function createAdmin() {
  const hashedPassword = await bcrypt.hash("12345", 10);

  db.run(
    `INSERT INTO users (firstName, email, password, role)
     VALUES (?, ?, ?, ?)`,
    ["Admin", "admin@gmail.com", hashedPassword, "admin"],
    function (err) {
      if (err) {
        console.log("Admin mavjud bo‘lishi mumkin ❗");
      } else {
        console.log("Admin yaratildi ✅");
      }
    }
  );
}

createAdmin();