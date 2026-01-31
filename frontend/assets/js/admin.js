document.addEventListener("DOMContentLoaded", () => {
    const datosRaw = localStorage.getItem("usuario");
    if (!datosRaw) {
        window.location.href = "login.html";
        return;
    }
    const userStorage = JSON.parse(datosRaw);
    const rol = userStorage.rol ? userStorage.rol.trim().toLowerCase() : "";

    if (rol !== "admin") {
        alert("Acceso denegado");
        window.location.href = "login.html";
        return;
    }
    cargarTurnos();
});

async function cargarTurnos() {
    try {
        const res = await fetch("http://localhost:3000/appointments/admin/all");
        const turnos = await res.json();
        const tabla = document.getElementById("tablaTurnos");
        tabla.innerHTML = "";

        turnos.forEach(t => {
            const fechaFmt = t.fecha ? t.fecha.split("T")[0] : "---";
            const color = t.estado === 'confirmado' ? 'green' : 'orange';
            tabla.innerHTML += `
                <tr>
                    <td>${t.id}</td>
                    <td>${t.nombre}</td>
                    <td>${fechaFmt}</td>
                    <td>${t.hora} hs</td>
                    <td><b style="color: ${color}">${t.estado}</b></td>
                    <td>
                        <button onclick="cambiarEstado(${t.id}, 'confirmado')">✅</button>
                        <button onclick="eliminar(${t.id})">🗑️</button>
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

async function cambiarEstado(id, nuevoEstado) {
    await fetch(`http://localhost:3000/appointments/status/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nuevoEstado })
    });
    cargarTurnos();
}

async function eliminar(id) {
    if (!confirm("¿Eliminar?")) return;
    const user = JSON.parse(localStorage.getItem("usuario"));
    await fetch(`http://localhost:3000/appointments/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: user.id })
    });
    cargarTurnos();
}