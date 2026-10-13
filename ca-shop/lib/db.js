import mysql from "mysql2/promise";

const globalForDb = globalThis;

const pool =
  globalForDb.mysqlPool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 5000, // gagal dalam 5 detik kalau database tidak merespons
  });

if (process.env.NODE_ENV !== "production") globalForDb.mysqlPool = pool;

export default pool;