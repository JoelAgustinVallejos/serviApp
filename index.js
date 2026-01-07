const express = require("express");
const cors = require("cors");
const path = require("path");

const { connectDB } = require("./src/db");
const appointmentsRoutes = require("./src/routes/appointments");
const usersRoutes = require("./src/routes/users");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ SERVIR FRONTEND
app.use(express.static(path.join(__dirname, "frontend")));

// ✅ RUTAS API
app.use("/appointments", appointmentsRoutes);
app.use("/users", usersRoutes);

// ✅ RAÍZ → HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// DB
(async () => {
  try {
    await connectDB();
    console.log("🚀 Backend listo");
  } catch {
    console.error("❌ Error de DB");
    process.exit(1);
  }
})();

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
