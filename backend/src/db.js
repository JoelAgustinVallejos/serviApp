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

// Función para probar la conexión al iniciar con reintentos para Docker
async function initDB() { 
    let retries = 5; 
    while (retries) {
        try {
            const connection = await pool.getConnection();
            console.log("✅ Conectado a MySQL exitosamente");
            connection.release();
            break; 
        } catch (error) {
            retries -= 1;
            console.log(`❌ Error de conexión (MySQL iniciando...). Reintentando en 5s... (${retries} intentos restantes)`);
            
            if (retries === 0) {
                console.error("❌ No se pudo conectar a la DB tras varios intentos. Revisa tu .env y que el contenedor 'db' esté corriendo.");
                throw error;
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

// ESTA ES LA FUNCIÓN QUE FALTABA
function getDB() {
    return pool;
}

module.exports = { initDB, getDB };