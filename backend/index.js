const express = require("express");
const path = require("path");
const cors = require("cors");
const { initDB } = require("./src/db");

const userRoutes = require("./src/routes/users");
const appointmentRoutes = require("./src/routes/appointments");
const adminRoutes = require("./src/routes/admin"); 

const app = express();

// 1. Middlewares globales
app.use(cors());
app.use(express.json());

// Middleware para evitar errores de seguridad (CSP) en el navegador
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:3000;");
    next();
});

// 2. RUTAS DE LA API
app.use("/users", userRoutes); 
app.use("/appointments", appointmentRoutes);
app.use("/admin", adminRoutes); 

// 3. CONFIGURACIÓN DE RUTAS ESTÁTICAS
// Definimos la ruta base del frontend de forma absoluta
const frontendPath = path.join(process.cwd(), "..", "frontend");

// Servir la carpeta de assets (CSS, JS, Imágenes)
app.use("/assets", express.static(path.join(frontendPath, "assets")));

// 4. RUTAS PARA SERVIR EL FRONTEND (VIEWS)
// Ruta principal: sirve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "views", "index.html"));
});

// Ruta dinámica para cualquier página .html
app.get("/:page.html", (req, res) => {
    const page = req.params.page;
    const filePath = path.join(frontendPath, "views", `${page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Error sirviendo página:", filePath);
            res.status(404).send("Página no encontrada");
        }
    });
});

// 5. INICIO DEL SERVIDOR
const PORT = 3000;
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("❌ No se pudo iniciar el servidor debido a fallos en la DB.");
});