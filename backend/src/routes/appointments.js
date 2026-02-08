const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

// 1. LISTA DE SERVICIOS
router.get("/servicios/lista", async (req, res) => {
    try {
        const db = getDB();
        const [servicios] = await db.execute("SELECT * FROM servicios");
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar servicios" });
    }
});

// 2. DISPONIBILIDAD (Con filtro de horas pasadas para el día de hoy)
router.get("/disponibilidad", async (req, res) => {
    const { fecha } = req.query; 
    try {
        const db = getDB();
        const [especial] = await db.execute("SELECT descripcion FROM dias_especiales WHERE fecha = ?", [fecha]);
        if (especial.length > 0) return res.json([]); 

        const [config] = await db.execute("SELECT * FROM configuracion LIMIT 1");
        const [ocupados] = await db.execute(
         "SELECT hora FROM turnos WHERE fecha = ? AND estado != 'cancelado'", //
         [fecha]
);
        const horasOcupadas = ocupados.map(t => t.hora.slice(0, 5));

        const ahora = new Date();
        const hoyStr = ahora.toISOString().split('T')[0];
        const horaActual = ahora.getHours();
        const minActual = ahora.getMinutes();

        const horarios = [];
        let actual = config[0].hora_inicio;
        while (actual < config[0].hora_fin) {
            const horaSimple = actual.slice(0, 5);
            let [h, m] = horaSimple.split(":").map(Number);

            // 🛡️ VALIDACIÓN: No mostrar horas que ya pasaron si es HOY
            let disponible = !horasOcupadas.includes(horaSimple);
            if (fecha === hoyStr) {
                if (h < horaActual || (h === horaActual && m <= minActual)) {
                    disponible = false; // Forzamos no disponible si ya pasó
                }
            }

            horarios.push({
                hora: horaSimple,
                disponible: disponible
            });

            m += 30;
            if (m >= 60) { h++; m = 0; }
            actual = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
        }
        res.json(horarios);
    } catch (error) {
        res.status(500).json({ error: "Error de servidor" });
    }
});

// 3. OBTENER TURNOS DE UN USUARIO
router.get("/mis-turnos/:usuario_id", async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const db = getDB();
        const [turnos] = await db.execute(
            `SELECT t.id, t.nombre, t.fecha, t.hora, t.estado, t.servicio_id, s.nombre as nombre_servicio 
             FROM turnos t 
             LEFT JOIN servicios s ON t.servicio_id = s.id 
             WHERE t.usuario_id = ? AND t.estado != 'cancelado' 
             ORDER BY t.fecha DESC, t.hora DESC`,
            [usuario_id]
        );
        res.json(turnos);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar turnos" });
    }
});

// 4. RESERVAR TURNO (CON VALIDACIÓN DE TIEMPO REAL)
router.post("/", async (req, res) => {
    const { nombre, fecha, hora, servicio_id, usuario_id } = req.body;
    
    // 🛡️ BLOQUEO DE SEGURIDAD: No permitir reservas en el pasado
    const ahora = new Date();
    const fechaTurno = new Date(`${fecha}T${hora}`);

    if (fechaTurno < ahora) {
        return res.status(400).json({ error: "No puedes reservar en una hora que ya pasó" });
    }

    try {
        const db = getDB();
        await db.execute(
            "INSERT INTO turnos (nombre, fecha, hora, servicio_id, usuario_id, estado) VALUES (?, ?, ?, ?, ?, 'pendiente')",
            [nombre, fecha, hora, servicio_id, usuario_id]
        );
        res.json({ message: "Turno reservado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al crear turno" });
    }
});

router.put("/:id", async (req, res) => {
    const { nombre, fecha, hora, servicio_id } = req.body;
    try {
        const db = getDB();
        await db.execute(
            "UPDATE turnos SET nombre = ?, fecha = ?, hora = ?, servicio_id = ? WHERE id = ?",
            [nombre, fecha, hora, servicio_id, req.params.id]
        );
        res.json({ message: "Turno actualizado" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const db = getDB();
        await db.execute("DELETE FROM turnos WHERE id = ?", [req.params.id]);
        res.json({ message: "Turno eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

module.exports = router;