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

router.get("/disponibilidad/:fecha", async (req, res) => {
    const { fecha } = req.params;
    try {
        const db = getDB();
        const [config] = await db.execute("SELECT hora_inicio, hora_fin FROM configuracion WHERE id = 1");
        const [ocupados] = await db.execute("SELECT hora FROM turnos WHERE fecha = ? AND estado != 'cancelado'", [fecha]);
        
        res.json({
            rango: config[0],
            ocupados: ocupados.map(o => o.hora.slice(0, 5))
        });
    } catch (error) {
        res.status(500).json({ error: "Error al consultar disponibilidad" });
    }
});

router.get("/servicios/lista", async (req, res) => {
    try {
        const db = getDB();
        const [rows] = await db.execute("SELECT * FROM servicios");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener servicios" });
    }
});

router.get("/mis-turnos/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDB();
        const [rows] = await db.execute(`
            SELECT t.*, s.nombre as servicio_nombre 
            FROM turnos t 
            LEFT JOIN servicios s ON t.servicio_id = s.id 
            WHERE t.usuario_id = ? 
            ORDER BY t.fecha DESC`, [id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener turnos" });
    }
});

router.post("/", async (req, res) => {
    const { nombre, fecha, hora, usuario_id, servicio_id } = req.body;
    if (!nombre || !fecha || !hora || !usuario_id || !servicio_id) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    const errorBasico = validarFormatoFechaHora(fecha, hora);
    if (errorBasico) return res.status(400).json({ error: errorBasico });

    try {
        const db = getDB();
        const [ocupado] = await db.execute("SELECT id FROM turnos WHERE fecha = ? AND hora = ? AND estado != 'cancelado'", [fecha, hora]);
        if (ocupado.length > 0) return res.status(409).json({ error: "Este horario ya se reservó." });

        await db.execute(
            "INSERT INTO turnos (nombre, fecha, hora, usuario_id, servicio_id, estado) VALUES (?, ?, ?, ?, ?, 'pendiente')",
            [nombre, fecha, hora, usuario_id, servicio_id]
        );
        res.json({ message: "✅ Turno creado" });
    } catch (error) {
        res.status(500).json({ error: "Error al crear turno" });
    }
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { fecha, hora, servicio_id } = req.body;
    try {
        const db = getDB();
        const [ocupado] = await db.execute("SELECT id FROM turnos WHERE fecha = ? AND hora = ? AND id != ? AND estado != 'cancelado'", [fecha, hora, id]);
        if (ocupado.length > 0) return res.status(409).json({ error: "El nuevo horario ya está ocupado." });

        await db.execute("UPDATE turnos SET fecha = ?, hora = ?, servicio_id = ? WHERE id = ?", [fecha, hora, servicio_id, id]);
        res.json({ message: "✅ Turno actualizado" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar turno" });
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDB();
        await db.execute("DELETE FROM turnos WHERE id = ?", [id]);
        res.json({ message: "🗑️ Turno eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

module.exports = router;