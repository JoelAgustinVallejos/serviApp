const mysql = require("mysql2/promise");

let pool;

async function connectDB() {
  try {
    pool = mysql.createPool({
      host: "db",
      user: "root",
      password: "root",
      database: "turnos",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log("✅ Conectado a MySQL");
  } catch (error) {
    console.error("❌ Error conectando a MySQL", error);
    throw error;
  }
}

function getDB() {
  if (!pool) {
    throw new Error("❌ DB no inicializada");
  }
  return pool;
}

module.exports = { connectDB, getDB };
