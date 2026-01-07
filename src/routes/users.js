const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

/* =========================
   REGISTRO
========================= */
router.post("/register", async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const db = getDB();

    await db.execute(
      "INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, 'user', true)",
      [nombre, email, password]
    );

    res.json({ message: "✅ Usuario registrado correctamente" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "El usuario ya existe" });
    }
    console.error(error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});


/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const db = getDB();

    const [rows] = await db.execute(
      "SELECT id, email, rol FROM usuarios WHERE email = ? AND password = ? AND activo = true",
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    res.json({
  message: "✅ Login correcto",
  rol: rows[0].rol,
});

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

module.exports = router;
