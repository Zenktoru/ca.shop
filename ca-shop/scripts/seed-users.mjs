import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const users = [
  { nama: "Admin ca.shop", username: "admin", password: "admin123", role: "admin" },
  { nama: "Kasir Satu", username: "kasir1", password: "kasir123", role: "kasir" },
];

for (const u of users) {
  const hash = await bcrypt.hash(u.password, 10);
  await db.query(
    "INSERT IGNORE INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)",
    [u.nama, u.username, hash, u.role]
  );
}

console.log("Seed user selesai.");
await db.end();