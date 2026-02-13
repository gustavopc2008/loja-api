// Suporta MySQL (Hostinger) e PostgreSQL (Neon)
const mysql = require("mysql2/promise");

const DATABASE_URL = process.env.DATABASE_URL;
const isPostgres = DATABASE_URL && DATABASE_URL.startsWith("postgres");

function toPgParams(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

let pool;

if (isPostgres) {
  const { Pool } = require("pg");
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: true } });
} else {
  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "loja_criancasecia",
    waitForConnections: true,
    connectionLimit: 10,
    charset: "utf8mb4",
  };
  if (process.env.DB_HOST && process.env.DB_HOST.includes("psdb.cloud")) {
    dbConfig.ssl = { rejectUnauthorized: true };
  }
  pool = mysql.createPool(dbConfig);
}

async function execute(sql, params = []) {
  if (isPostgres) {
    const pgSql = toPgParams(sql);
    const result = await pool.query(pgSql, params);
    return [result.rows];
  }
  return pool.execute(sql, params);
}

module.exports = { execute, isPostgres };
