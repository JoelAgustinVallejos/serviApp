const express = require("express");
const router = express.Router();
const { getDB } = require("../db");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

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
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await db.execute(
      "INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, 'user', true)",
      [nombre, email, hashedPassword]
    );

    res.json({ message: "✅ Usuario registrado correctamente" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "El usuario ya existe" });
    }
    console.error("Error en registro:", error);
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
      "SELECT id, email, password, rol FROM usuarios WHERE email = ? AND activo = true",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const usuario = rows[0];
    const passwordCorrecta = await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecta) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    res.json({
      message: "✅ Login correcto",
      user: {
        id: usuario.id,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

module.exports = router;