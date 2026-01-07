const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

function validarFechaHora(fecha, hora) {
  // formato hora HH:mm
  const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!horaRegex.test(hora)) {
    return "Formato de hora inválido (HH:mm)";
  }

  const ahora = new Date();
  const fechaTurno = new Date(`${fecha}T${hora}:00`);

  if (isNaN(fechaTurno.getTime())) {
    return "Fecha u hora inválida";
  }

  if (fechaTurno <= ahora) {
    return "El turno debe ser en una fecha y hora futura";
  }

  // 🕗 HORARIO LABORAL
  const [h, m] = hora.split(":").map(Number);
  const minutos = h * 60 + m;

  const inicio = 8 * 60;   // 08:00
  const fin = 18 * 60;     // 18:00

  if (minutos < inicio || minutos > fin) {
    return "Los turnos solo pueden ser entre 08:00 y 18:00";
  }

  return null;
}

async function existeTurnoDuplicado(db, fecha, hora, idExcluir = null) {
  let query = "SELECT id FROM turnos WHERE fecha = ? AND hora = ?";
  let params = [fecha, hora];

  if (idExcluir) {
    query += " AND id != ?";
    params.push(idExcluir);
  }

  const [rows] = await db.execute(query, params);
  return rows.length > 0;
}

/* =========================
   LISTAR TURNOS (GET)
========================= */
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const [rows] = await db.execute("SELECT * FROM turnos");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener turnos" });
  }
});

/* =========================
   CREAR TURNO (POST)
========================= */
router.post("/", async (req, res) => {
  const { nombre, fecha, hora } = req.body;

  if (!nombre || !fecha || !hora) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  // 🔎 validar fecha y hora
  const errorFH = validarFechaHora(fecha, hora);
  if (errorFH) {
    return res.status(400).json({ error: errorFH });
  }

  try {
    const db = getDB();

    // 🔁 VALIDAR DUPLICADO
    const duplicado = await existeTurnoDuplicado(db, fecha, hora);
    if (duplicado) {
      return res.status(409).json({
        error: "Ya existe un turno en esa fecha y hora",
      });
    }

    // 🔢 LIMITE DE TURNOS POR DÍA
    const [cantidad] = await db.execute(
      "SELECT COUNT(*) as total FROM turnos WHERE fecha = ?",
      [fecha]
    );

    if (cantidad[0].total >= 10) {
      return res.status(409).json({
        error: "No hay más turnos disponibles para ese día",
      });
    }

    await db.execute(
      "INSERT INTO turnos (nombre, fecha, hora) VALUES (?, ?, ?)",
      [nombre, fecha, hora]
    );

    res.json({ message: "✅ Turno creado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear turno" });
  }
});

/* =========================
   ELIMINAR TURNO (DELETE)
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const [result] = await db.execute(
      "DELETE FROM turnos WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }

    res.json({ message: "🗑️ Turno eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar turno" });
  }
});

// 🔹 ACTUALIZAR TURNO

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, fecha, hora } = req.body;

  if (!nombre || !fecha || !hora) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  // 🔎 validar fecha y hora
  const errorFH = validarFechaHora(fecha, hora);
  if (errorFH) {
    return res.status(400).json({ error: errorFH });
  }

  try {
    const db = getDB();

    // 🔁 VALIDAR DUPLICADO (excluyendo este turno)
    const duplicado = await existeTurnoDuplicado(db, fecha, hora, id);
    if (duplicado) {
      return res.status(409).json({
        error: "Ya existe otro turno en esa fecha y hora",
      });
    }

    // 🔢 LIMITE DE TURNOS POR DÍA (excluyendo este turno)
    const [cantidad] = await db.execute(
      "SELECT COUNT(*) as total FROM turnos WHERE fecha = ? AND id <> ?",
      [fecha, id]
    );

    if (cantidad[0].total >= 10) {
      return res.status(409).json({
        error: "No hay más turnos disponibles para ese día",
      });
    }

    // ✅ ACTUALIZAR
    const [result] = await db.execute(
      "UPDATE turnos SET nombre = ?, fecha = ?, hora = ? WHERE id = ?",
      [nombre, fecha, hora, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }

    res.json({ message: "✅ Turno actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar turno" });
  }
});

module.exports = router;
