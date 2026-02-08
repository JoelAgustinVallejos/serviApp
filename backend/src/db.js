require('dotenv').config();
const mysql = require('mysql2/promise');

// Creamos el pool usando las variables del .env
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Función para probar la conexión al iniciar
async function initDB() { 
  try {
    // Intentamos obtener una conexión para validar que los datos del .env son correctos
    const connection = await pool.getConnection();
    console.log("✅ Conectado a MySQL exitosamente");
    connection.release();
  } catch (error) {
    console.error("❌ Error al conectar a la DB. Revisa tu archivo .env:", error.message);
    throw error;
  }
}

function getDB() {
  return pool;
}

module.exports = { initDB, getDB };