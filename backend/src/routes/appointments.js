const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

function validarFormatoFechaHora(fecha, hora) {
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!horaRegex.test(hora)) return "Formato de hora inválido (HH:mm)";
    
    const ahora = new Date();
    const fechaTurno = new Date(`${fecha}T${hora}:00`);
    if (isNaN(fechaTurno.getTime())) return "Fecha u hora inválida";
    if (fechaTurno <= ahora) return "El turno debe ser en una fecha y hora futura";
    
    return null;
}


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

router.post("/", async (req, res) => {
    const { nombre, fecha, hora, usuario_id } = req.body;
    if (!nombre || !fecha || !hora || !usuario_id) return res.status(400).json({ error: "Faltan datos" });
    
    const errorBasico = validarFormatoFechaHora(fecha, hora);
    if (errorBasico) return res.status(400).json({ error: errorBasico });

    try {
        const db = getDB();

        const [config] = await db.execute("SELECT hora_inicio, hora_fin FROM configuracion WHERE id = 1");
        const { hora_inicio, hora_fin } = config[0];

        if (hora < hora_inicio || hora >= hora_fin) {
            return res.status(400).json({ 
                error: `Horario no disponible. Atendemos de ${hora_inicio.slice(0, 5)} a ${hora_fin.slice(0, 5)} hs.` 
            });
        }

        const [ocupado] = await db.execute("SELECT id FROM turnos WHERE fecha = ? AND hora = ?", [fecha, hora]);
        if (ocupado.length > 0) {
            return res.status(409).json({ error: "Este horario ya se encuentra reservado." });
        }

        const [repetido] = await db.execute(
            "SELECT id FROM turnos WHERE usuario_id = ? AND fecha = ? AND hora = ?",
            [usuario_id, fecha, hora]
        );
        if (repetido.length > 0) {
            return res.status(409).json({ error: "Ya tienes registrado este turno exactamente." });
        }

        await db.execute(
            "INSERT INTO turnos (nombre, fecha, hora, usuario_id, estado) VALUES (?, ?, ?, ?, 'pendiente')",
            [nombre, fecha, hora, usuario_id]
        );
        res.json({ message: "✅ Turno creado" });
    } catch (error) {
        console.error("Error al crear turno:", error);
        res.status(500).json({ error: "Error al crear turno" });
    }
});

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