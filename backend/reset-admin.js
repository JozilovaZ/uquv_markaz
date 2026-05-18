const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const db = new sqlite3.Database("./kurstanla.db");

async function resetAdmin() {
  const hashedPassword = await bcrypt.hash("12345", 10);

  db.run(
    `UPDATE users SET password = ?, role = ? WHERE email = ?`,
    [hashedPassword, "admin", "admin@gmail.com"],
    function (err) {
      if (err) {
        console.log("Xatolik:", err.message);
      } else if (this.changes === 0) {
        console.log("Admin topilmadi. Avval seed-admin.js ishlating.");
      } else {
        console.log("Admin paroli yangilandi ✅");
      }

      db.close();
    }
  );
}

resetAdmin();