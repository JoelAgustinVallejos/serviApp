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

    cargarConfiguracion();
    cargarTurnos();
});

function mostrarFeedback(elementoId, texto, esExito) {
    const msg = document.getElementById(elementoId);
    msg.innerText = texto;
    msg.className = esExito ? "msg-success" : "msg-error";
    msg.style.display = "block";

    setTimeout(() => {
        msg.style.display = "none";
        msg.className = "";
    }, 4000);
}

async function cargarConfiguracion() {
    try {
        const res = await fetch("http://localhost:3000/admin/config");
        if (!res.ok) throw new Error("No se pudo obtener la configuración");
        
        const config = await res.json();
        
        if (config) {
            document.getElementById("horaInicio").value = config.hora_inicio.slice(0, 5);
            document.getElementById("horaFin").value = config.hora_fin.slice(0, 5);
        }
    } catch (error) {
        console.error("Error al cargar configuración:", error);
    }
}

async function guardarConfiguracion() {
    const hora_inicio = document.getElementById("horaInicio").value;
    const hora_fin = document.getElementById("horaFin").value;
    const btn = document.querySelector(".config-container button"); // Seleccionamos el botón

    if (!hora_inicio || !hora_fin) {
        mostrarFeedback("msgConfig", "⚠️ Completa ambos campos", false);
        return;
    }

    if (hora_inicio >= hora_fin) {
        mostrarFeedback("msgConfig", "⚠️ La apertura debe ser antes del cierre", false);
        return;
    }

    try {
        const textoOriginal = btn.innerText;
        btn.innerText = "⏳ Guardando...";
        btn.disabled = true;

        const res = await fetch("http://localhost:3000/admin/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hora_inicio, hora_fin })
        });

        const data = await res.json();

        if (res.ok) {
            mostrarFeedback("msgConfig", data.message || "✅ Horario actualizado", true);
        } else {
            mostrarFeedback("msgConfig", "❌ Error al guardar", false);
        }

        btn.innerText = textoOriginal;
        btn.disabled = false;

    } catch (error) {
        console.error("Error:", error);
        mostrarFeedback("msgConfig", "❌ Error de conexión con el servidor", false);
        btn.innerText = "Guardar Horario";
        btn.disabled = false;
    }
}

async function cargarTurnos() {
    try {
        const res = await fetch("http://localhost:3000/admin/all");
        const turnos = await res.json();
        const tabla = document.getElementById("tablaTurnos");
        tabla.innerHTML = "";

        if (turnos.length === 0) {
            tabla.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay turnos registrados</td></tr>`;
            return;
        }

        turnos.forEach(t => {
            const fechaFmt = t.fecha ? t.fecha.split("T")[0] : "---";
            const colorEstado = t.estado === 'confirmado' ? '#22c55e' : '#f59e0b';
            
            tabla.innerHTML += `
                <tr>
                    <td>${t.id}</td>
                    <td>${t.nombre}</td>
                    <td>${fechaFmt}</td>
                    <td>${t.hora.slice(0, 5)} hs</td>
                    <td><span style="color: ${colorEstado}; font-weight: bold;">${t.estado.toUpperCase()}</span></td>
                    <td>
                        <div style="display: flex; gap: 8px;">
                            ${t.estado !== 'confirmado' ? 
                                `<button onclick="cambiarEstado(${t.id}, 'confirmado')" style="padding: 8px; background: #22c55e;">Confirmar</button>` : 
                                ''}
                            <button onclick="eliminar(${t.id})" style="padding: 8px; background: #ef4444;">Eliminar</button>
                        </div>
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error("Error cargando turnos:", error);
    }
}

async function cambiarEstado(id, nuevoEstado) {
    try {
        const res = await fetch(`http://localhost:3000/admin/status/${id}`, {
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