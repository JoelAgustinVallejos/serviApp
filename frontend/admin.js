document.addEventListener("DOMContentLoaded", () => {
    // 🛡️ 1. Seguridad: Verificar que el usuario sea admin
    const datosRaw = localStorage.getItem("usuario");
    
    if (!datosRaw) {
        window.location.href = "login.html";
        return;
    }

    const userStorage = JSON.parse(datosRaw);
    // Usamos trim() para limpiar espacios invisibles
    const rol = userStorage.rol ? userStorage.rol.trim().toLowerCase() : "";

    if (rol !== "admin") {
        alert("Acceso denegado: Se requiere rol admin");
        window.location.href = "login.html";
        return;
    }

    // Si pasó la seguridad, llamamos a la función de carga
    cargarTurnos();
});

// 2. Función para cargar la tabla desde el servidor
async function cargarTurnos() {
    try {
        // --- EL CONSEJO APLICADO ---
        // Asegúrate de que el puerto (3000) coincida con tu servidor Node.js
        const res = await fetch("http://localhost:3000/appointments/admin/all");
        
        if (!res.ok) {
            throw new Error(`Error en el servidor: ${res.status}`);
        }

        const turnos = await res.json();
        const tabla = document.getElementById("tablaTurnos");
        
        // Limpiamos la tabla antes de llenarla
        tabla.innerHTML = "";

        if (turnos.length === 0) {
            tabla.innerHTML = "<tr><td colspan='6'>No hay turnos registrados</td></tr>";
            return;
        }

        turnos.forEach(t => {
            // Formateamos la fecha para que no se vea el "T00:00:00"
            const fechaFormateada = t.fecha ? t.fecha.split("T")[0] : "Sin fecha";
            
            // Elegimos un color según el estado
            const colorEstado = t.estado === 'confirmado' ? 'green' : 'orange';

            tabla.innerHTML += `
                <tr>
                    <td>${t.id}</td>
                    <td>${t.nombre}</td>
                    <td>${fechaFormateada}</td>
                    <td>${t.hora} hs</td>
                    <td><b style="color: ${colorEstado}">${t.estado}</b></td>
                    <td>
                        <button onclick="cambiarEstado(${t.id}, 'confirmado')" title="Confirmar">✅</button>
                        <button onclick="eliminar(${t.id})" title="Eliminar">🗑️</button>
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error("❌ Error al cargar la agenda de admin:", error);
        alert("No se pudieron cargar los turnos. Revisa la consola.");
    }
}

// 3. Función para cambiar el estado a 'confirmado'
async function cambiarEstado(id, nuevoEstado) {
    try {
        const res = await fetch(`http://localhost:3000/appointments/status/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nuevoEstado })
        });

        if (res.ok) {
            cargarTurnos(); // Recargamos la lista para ver el cambio
        }
    } catch (error) {
        console.error("Error al actualizar estado:", error);
    }
}

// 4. Función para eliminar/cancelar un turno
async function eliminar(id) {
    if (!confirm("¿Seguro que quieres eliminar este turno?")) return;

    try {
        // Como eres Admin, enviamos tu ID para que el backend permita borrarlo
        const user = JSON.parse(localStorage.getItem("usuario"));
        
        const res = await fetch(`http://localhost:3000/appointments/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario_id: user.id })
        });

        if (res.ok) {
            cargarTurnos();
        } else {
            const errorData = await res.json();
            alert(errorData.error);
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
    }
}