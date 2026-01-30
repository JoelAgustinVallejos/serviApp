const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

// --- FUNCIONES DE APOYO (Helpers) ---

function validarFechaHora(fecha, hora) {
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!horaRegex.test(hora)) return "Formato de hora inválido (HH:mm)";

    const ahora = new Date();
    const fechaTurno = new Date(`${fecha}T${hora}:00`);

    if (isNaN(fechaTurno.getTime())) return "Fecha u hora inválida";
    if (fechaTurno <= ahora) return "El turno debe ser en una fecha y hora futura";

    const [h, m] = hora.split(":").map(Number);
    const minutos = h * 60 + m;
    const inicio = 8 * 60; // 08:00
    const fin = 18 * 60;   // 18:00

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

// --- RUTAS ---

// 1. ADMIN: VER TODO (Debe ir arriba para que no se confunda con /:id)
router.get("/admin/all", async (req, res) => {
    try {
        const db = getDB();
        const [rows] = await db.execute(
            "SELECT id, nombre, fecha, hora, estado, usuario_id FROM turnos ORDER BY fecha ASC, hora ASC"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener la agenda global" });
    }
});

// 2. MIS TURNOS (Usuario específico)
router.get("/mis-turnos/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDB();
        const [rows] = await db.execute(
            "SELECT id, nombre, fecha, hora, estado FROM turnos WHERE usuario_id = ? ORDER BY fecha, hora",
            [id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener tus turnos" });
    }
});

// 3. CREAR TURNO (POST)
router.post("/", async (req, res) => {
    const { nombre, fecha, hora, usuario_id } = req.body;

    if (!nombre || !fecha || !hora || !usuario_id) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const errorFH = validarFechaHora(fecha, hora);
    if (errorFH) return res.status(400).json({ error: errorFH });

    try {
        const db = getDB();

        if (await existeTurnoDuplicado(db, fecha, hora)) {
            return res.status(409).json({ error: "Ya existe un turno en esa fecha y hora" });
        }

        const [cantidad] = await db.execute("SELECT COUNT(*) as total FROM turnos WHERE fecha = ?", [fecha]);
        if (cantidad[0].total >= 10) {
            return res.status(409).json({ error: "No hay más turnos disponibles para ese día" });
        }

        await db.execute(
            "INSERT INTO turnos (nombre, fecha, hora, usuario_id, estado) VALUES (?, ?, ?, ?, 'pendiente')",
            [nombre, fecha, hora, usuario_id]
        );

        res.json({ message: "✅ Turno creado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al crear turno" });
    }
});

// 4. ACTUALIZAR ESTADO (PATCH - ADMIN)
router.patch("/status/:id", async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado } = req.body;
    try {
        const db = getDB();
        await db.execute("UPDATE turnos SET estado = ? WHERE id = ?", [nuevoEstado, id]);
        res.json({ message: `✅ Turno ${nuevoEstado} con éxito` });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar el estado" });
    }
});

// 5. CANCELAR/ELIMINAR (DELETE)
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const { usuario_id } = req.body;
    try {
        const db = getDB();
        const [turno] = await db.execute("SELECT * FROM turnos WHERE id = ? AND usuario_id = ?", [id, usuario_id]);
        
        if (turno.length === 0) {
            return res.status(403).json({ error: "No tienes permiso para cancelar este turno" });
        }

        await db.execute("DELETE FROM turnos WHERE id = ?", [id]);
        res.json({ message: "🗑️ Turno cancelado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al cancelar el turno" });
    }
});

module.exports = router;