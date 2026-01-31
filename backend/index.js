const express = require("express");
const path = require("path");
const cors = require("cors");
const { initDB } = require("./src/db");

const userRoutes = require("./src/routes/users");
const appointmentRoutes = require("./src/routes/appointments");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/users", userRoutes); 
app.use("/appointments", appointmentRoutes);

app.use("/assets", express.static(path.join(__dirname, "..", "frontend", "assets")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "views", "index.html"));
});

app.get("/:page.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "views", `${req.params.page}.html`));
});

const PORT = 3000;
initDB().then(() => {
    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
});