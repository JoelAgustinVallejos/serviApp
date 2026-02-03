document.addEventListener("DOMContentLoaded", cargarMisTurnos);

async function cargarMisTurnos() {
    const userStorage = JSON.parse(localStorage.getItem("usuario"));
    if (!userStorage) {
        window.location.href = "login.html";
        return;
    }

    try {
        // URL corregida apuntando a /appointments/mis-turnos/id
        const res = await fetch(`http://localhost:3000/appointments/mis-turnos/${userStorage.id}`);
        const turnos = await res.json();

        const tabla = document.getElementById("tablaMisTurnos");
        if (!tabla) return; 

        tabla.innerHTML = ""; 

        turnos.forEach(t => {
            const fechaFmt = t.fecha ? t.fecha.split("T")[0] : "---";
            tabla.innerHTML += `
                <tr>
                    <td>${t.nombre}</td>
                    <td>${fechaFmt}</td>
                    <td>${t.hora.slice(0, 5)} hs</td>
                    <td><strong style="color: ${t.estado === 'confirmado' ? 'green' : 'orange'}">${t.estado.toUpperCase()}</strong></td>
                    <td>
                        <button onclick="eliminarTurno(${t.id})" style="border:none; background:none; cursor:pointer; font-size: 1.2rem;">❌</button>
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error("Error al cargar turnos:", error);
    }
}

async function eliminarTurno(id) {
    if (!confirm("¿Deseas cancelar este turno?")) return;

    try {
        // URL corregida apuntando a /appointments/id
        const res = await fetch(`http://localhost:3000/appointments/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            cargarMisTurnos(); // Recargamos la tabla
        } else {
            const data = await res.json();
            alert(data.error || "Error al eliminar");
        }
    } catch (error) {
        console.error("Error al intentar cancelar:", error);
        alert("Error al intentar cancelar");
    }
}