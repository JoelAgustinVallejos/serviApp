const express = require("express");
const path = require("path");
const cors = require("cors");
const { initDB } = require("./src/db"); // Ajusta según tu nueva ruta

const userRoutes = require("./src/routes/users");
const appointmentRoutes = require("./src/routes/appointments");

const app = express();
app.use(cors());
app.use(express.json());

// --- IMPORTANTE: ORDEN DE LAS RUTAS ---

// 1. Primero las rutas de la API (Las que usas en tus fetch)
app.use("/users", userRoutes); 
app.use("/appointments", appointmentRoutes);

// 2. Servir los archivos estáticos (CSS, JS del frontend)
// Si index.js está en /backend, para ir a /frontend hay que subir un nivel (..)
app.use("/assets", express.static(path.join(__dirname, "..", "frontend", "assets")));

// 3. Servir los archivos HTML
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "views", "index.html"));
});

// Esta ruta permite que login.html, register.html, etc., funcionen
app.get("/:page.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "views", `${req.params.page}.html`));
});

const PORT = 3000;
initDB().then(() => {
    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
});