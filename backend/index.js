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

// 2. RUTAS DE LA API (Deben ir ANTES que las de archivos para evitar el error 404/JSON)
app.use("/users", userRoutes); 
app.use("/appointments", appointmentRoutes);
app.use("/admin", adminRoutes); 

app.use(express.static('public')); // O la carpeta donde tengas tus archivos HTML/JS

// 3. ARCHIVOS ESTÁTICOS
// Aseguramos que los JS y CSS se carguen correctamente
app.use("/assets", express.static(path.join(__dirname, "..", "frontend", "assets")));

// 4. RUTAS PARA SERVIR EL FRONTEND (VIEWS)
// Ruta principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "views", "index.html"));
});

// Ruta comodín para archivos .html (Mantenla al final de todo)
app.get("/:page.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "views", `${req.params.page}.html`));
});

// 5. INICIO DEL SERVIDOR
const PORT = 3000;
initDB().then(() => {
    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
});