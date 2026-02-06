document.addEventListener("DOMContentLoaded", cargarMisTurnos);

function lanzarExito(texto) {
    const modal = document.getElementById("modalExito");
    const video = document.getElementById("videoCheck");
    if (!modal) return;
    document.getElementById("modalTxt").innerText = texto;
    modal.style.display = "flex";
    video.currentTime = 0;
    video.play();
    setTimeout(() => { modal.style.display = "none"; }, 2500);
}

async function cargarMisTurnos() {
    const userStorage = JSON.parse(localStorage.getItem("usuario"));
    if (!userStorage) return;

    try {
        const res = await fetch(`http://localhost:3000/appointments/mis-turnos/${userStorage.id}`);
        const turnos = await res.json();
        const tabla = document.getElementById("tablaMisTurnos");
        if (!tabla) return; 

        tabla.innerHTML = turnos.map(t => `
            <tr>
                <td>${t.nombre}</td>
                <td>${t.fecha.split("T")[0]}</td>
                <td>${t.hora.slice(0, 5)} hs</td>
                <td><strong style="color: ${t.estado === 'confirmado' ? 'green' : 'orange'}">${t.estado.toUpperCase()}</strong></td>
                <td>
                    <button onclick="eliminarTurno(${t.id})" style="border:none; background:none; cursor:pointer; font-size: 1.2rem;">❌</button>
                </td>
            </tr>`).join('');
    } catch (error) { 
        console.error("Error cargando mis turnos:", error); 
    }
}

async function eliminarTurno(id) {
    // Sin alert ni confirm, acción directa
    try {
        const res = await fetch(`http://localhost:3000/appointments/${id}`, { method: "DELETE" });
        if (res.ok) {
            lanzarExito("Turno cancelado");
            cargarMisTurnos();
            // Si la función existe en la misma página (turnos.html), recargamos disponibilidad
            if (typeof cargarDisponibilidad === 'function') {
                const fecha = document.getElementById("fecha").value;
                if (fecha) cargarDisponibilidad(fecha);
            }
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
    }
}