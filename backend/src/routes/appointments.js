const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

// --- FUNCIONES DE APOYO ---
function validarFechaHora(fecha, hora) {
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!horaRegex.test(hora)) return "Formato de hora inválido (HH:mm)";
    const ahora = new Date();
    const fechaTurno = new Date(`${fecha}T${hora}:00`);
    if (isNaN(fechaTurno.getTime())) return "Fecha u hora inválida";
    if (fechaTurno <= ahora) return "El turno debe ser en una fecha y hora futura";
    return null;
}

// --- RUTAS DE ADMINISTRADOR (Van arriba para evitar conflictos) ---

// 🔵 Obtener TODOS los turnos (Para admin.js)
router.get("/admin/all", async (req, res) => {
    try {
        const db = getDB();
        // Traemos todos los turnos de la base de datos
        const [rows] = await db.execute("SELECT * FROM turnos ORDER BY fecha ASC, hora ASC");
        res.json(rows);
    } catch (error) {
        console.error("Error en admin/all:", error);
        res.status(500).json({ error: "Error al obtener la agenda completa" });
    }
});

// 🟠 Actualizar estado del turno (Confirmar/Cancelar desde Admin)
router.patch("/status/:id", async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado } = req.body; // Recibe 'confirmado' o 'cancelado'
    try {
        const db = getDB();
        await db.execute("UPDATE turnos SET estado = ? WHERE id = ?", [nuevoEstado, id]);
        res.json({ message: `✅ Turno actualizado a ${nuevoEstado}` });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar estado" });
    }
});

// --- RUTAS DE USUARIO ---

// 🟢 Obtener turnos de un usuario específico
router.get("/mis-turnos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDB();
    const [rows] = await db.execute("SELECT * FROM turnos WHERE usuario_id = ? ORDER BY fecha DESC", [id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener turnos" });
  }
});

// 🟡 Crear nuevo turno
router.post("/", async (req, res) => {
    const { nombre, fecha, hora, usuario_id } = req.body;
    if (!nombre || !fecha || !hora || !usuario_id) return res.status(400).json({ error: "Faltan datos" });
    
    const errorFH = validarFechaHora(fecha, hora);
    if (errorFH) return res.status(400).json({ error: errorFH });

    try {
        const db = getDB();
        await db.execute(
            "INSERT INTO turnos (nombre, fecha, hora, usuario_id, estado) VALUES (?, ?, ?, ?, 'pendiente')",
            [nombre, fecha, hora, usuario_id]
        );
        res.json({ message: "✅ Turno creado" });
    } catch (error) {
        res.status(500).json({ error: "Error al crear turno" });
    }
});

// 🔴 Eliminar/Cancelar turno (Funciona para ambos)
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDB();
        await db.execute("DELETE FROM turnos WHERE id = ?", [id]);
        res.json({ message: "🗑️ Turno eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

module.exports = router;