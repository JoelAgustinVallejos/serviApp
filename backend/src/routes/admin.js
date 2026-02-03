const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

router.get("/all", async (req, res) => {
    try {
        const db = getDB();
        const [rows] = await db.execute("SELECT * FROM turnos ORDER BY fecha ASC, hora ASC");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener la agenda completa" });
    }
});

router.patch("/status/:id", async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado } = req.body;
    try {
        const db = getDB();
        await db.execute("UPDATE turnos SET estado = ? WHERE id = ?", [nuevoEstado, id]);
        res.json({ message: `✅ Turno actualizado a ${nuevoEstado}` });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar estado" });
    }
});

router.get("/config", async (req, res) => {
    try {
        const db = getDB();
        const [rows] = await db.execute("SELECT hora_inicio, hora_fin FROM configuracion WHERE id = 1");
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener configuración" });
    }
});

router.post("/config", async (req, res) => {
    const { hora_inicio, hora_fin } = req.body;
    try {
        const db = getDB();
        await db.execute("UPDATE configuracion SET hora_inicio = ?, hora_fin = ? WHERE id = 1", [hora_inicio, hora_fin]);
        res.json({ message: "✅ Horario de trabajo actualizado" });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar configuración" });
    }
});

module.exports = router;