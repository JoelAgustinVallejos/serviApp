const mysql = require("mysql2/promise");
let pool;

async function initDB() { 
  try {
    pool = await mysql.createPool({
      host: "db",
      user: "root",
      password: "root",
      database: "turnos"
    });
    console.log("✅ Conectado a MySQL");
  } catch (error) {
    console.error("❌ Error en DB:", error);
    throw error;
  }
}

function getDB() {
  if (!pool) throw new Error("❌ DB no inicializada");
  return pool;
}

module.exports = { initDB, getDB };