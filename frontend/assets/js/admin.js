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

    // Inicializar datos del panel
    cargarConfiguracion();
    cargarTurnos();
});

// --- GESTIÓN DE CONFIGURACIÓN DE HORARIOS ---

async function cargarConfiguracion() {
    try {
        const res = await fetch("http://localhost:3000/appointments/config");
        if (!res.ok) throw new Error("No se pudo obtener la configuración");
        
        const config = await res.json();
        
        // El input type="time" espera formato HH:mm
        document.getElementById("horaInicio").value = config.hora_inicio.slice(0, 5);
        document.getElementById("horaFin").value = config.hora_fin.slice(0, 5);
    } catch (error) {
        console.error("Error al cargar configuración:", error);
    }
}

async function guardarConfiguracion() {
    const hora_inicio = document.getElementById("horaInicio").value;
    const hora_fin = document.getElementById("horaFin").value;
    const msg = document.getElementById("msgConfig");

    if (!hora_inicio || !hora_fin) {
        alert("Debes completar ambos horarios");
        return;
    }

    // Validación lógica simple: inicio no puede ser mayor o igual al fin
    if (hora_inicio >= hora_fin) {
        alert("La hora de inicio debe ser menor a la hora de cierre.");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/appointments/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hora_inicio, hora_fin })
        });

        if (res.ok) {
            msg.innerText = "✅ Horario guardado correctamente";
            msg.style.color = "green";
            setTimeout(() => msg.innerText = "", 3000);
        } else {
            msg.innerText = "❌ Error al guardar";
            msg.style.color = "red";
        }
    } catch (error) {
        console.error("Error:", error);
        msg.innerText = "❌ Error de conexión";
    }
}

// --- GESTIÓN DE TURNOS ---

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
                    <td>${t.hora.slice(0, 5)} hs</td>
                    <td><b style="color: ${color}">${t.estado.toUpperCase()}</b></td>
                    <td>
                        <button onclick="cambiarEstado(${t.id}, 'confirmado')">✅ Confirmar</button>
                        <button onclick="eliminar(${t.id})">🗑️ Eliminar</button>
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error("Error cargando turnos:", error);
    }
}

async function cambiarEstado(id, nuevoEstado) {
    try {
        const res = await fetch(`http://localhost:3000/appointments/status/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nuevoEstado })
        });
        if (res.ok) cargarTurnos();
    } catch (error) {
        console.error("Error al actualizar estado:", error);
    }
}

async function eliminar(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este turno?")) return;
    
    try {
        const res = await fetch(`http://localhost:3000/appointments/${id}`, {
            method: "DELETE"
        });
        if (res.ok) cargarTurnos();
    } catch (error) {
        console.error("Error al eliminar:", error);
    }
}