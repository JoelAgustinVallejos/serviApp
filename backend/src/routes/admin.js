const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

// OBTENER TURNOS
router.get("/turnos", async (req, res) => {
    try {
        const db = getDB();
        const { nombre, fecha } = req.query;
        let query = "SELECT * FROM turnos WHERE 1=1";
        let params = [];
        if (nombre) { query += " AND nombre LIKE ?"; params.push(`%${nombre}%`); }
        if (fecha) { query += " AND fecha = ?"; params.push(fecha); }
        const [rows] = await db.execute(query + " ORDER BY fecha ASC", params);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// SERVICIOS: GET, POST Y DELETE (Corregido)
router.get("/servicios", async (req, res) => {
    try {
        const db = getDB();
        const [rows] = await db.execute("SELECT * FROM servicios ORDER BY nombre ASC");
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post("/servicios", async (req, res) => {
    try {
        const db = getDB();
        const { nombre, precio } = req.body;
        await db.execute("INSERT INTO servicios (nombre, precio) VALUES (?, ?)", [nombre, precio]);
        res.json({ status: "ok" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete("/servicios/:id", async (req, res) => {
    try {
        const db = getDB();
        await db.execute("DELETE FROM servicios WHERE id = ?", [req.params.id]);
        res.json({ status: "ok" });
    } catch (error) { res.status(500).json({ error: "Error al eliminar servicio" }); }
});

// CONFIGURACIÓN (Corregido)
router.get("/config", async (req, res) => {
    try {
        const db = getDB();
        const [rows] = await db.execute("SELECT * FROM configuracion WHERE id = 1");
        res.json(rows[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post("/config", async (req, res) => {
    try {
        const db = getDB();
        const { hora_inicio, hora_fin, dias_laborales } = req.body;
        await db.execute("UPDATE configuracion SET hora_inicio=?, hora_fin=?, dias_laborales=? WHERE id=1", 
        [hora_inicio, hora_fin, dias_laborales]);
        res.json({ status: "ok" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// DÍAS ESPECIALES
router.get("/dias-especiales", async (req, res) => {
    try {
        const db = getDB();
        const [rows] = await db.execute("SELECT * FROM dias_especiales ORDER BY fecha ASC");
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post("/dias-especiales", async (req, res) => {
    try {
        const db = getDB();
        await db.execute("INSERT INTO dias_especiales (fecha, descripcion) VALUES (?, ?)", [req.body.fecha, req.body.descripcion]);
        res.json({ status: "ok" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete("/dias-especiales/:id", async (req, res) => {
    try {
        const db = getDB();
        await db.execute("DELETE FROM dias_especiales WHERE id = ?", [req.params.id]);
        res.json({ status: "ok" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ACTUALIZAR ESTADO
router.put("/turnos/:id/estado", async (req, res) => {
    try {
        const db = getDB();
        await db.execute("UPDATE turnos SET estado = ? WHERE id = ?", [req.body.estado, req.params.id]);
        res.json({ status: "ok" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;