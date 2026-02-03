const form = document.getElementById("formTurno");
const mensaje = document.getElementById("mensaje");

document.addEventListener("DOMContentLoaded", cargarMisTurnos);

async function cargarMisTurnos() {
    const userStorage = JSON.parse(localStorage.getItem("usuario"));
    if (!userStorage || !userStorage.id) return;

    try {
        const res = await fetch(`http://localhost:3000/appointments/mis-turnos/${userStorage.id}`);
        const turnos = await res.json();

        const tabla = document.getElementById("tablaMisTurnos");
        if (!tabla) return; 

        tabla.innerHTML = ""; 

        if (turnos.length === 0) {
            tabla.innerHTML = "<tr><td colspan='5'>No tienes turnos registrados.</td></tr>";
            return;
        }

        turnos.forEach(t => {
            const fechaFmt = t.fecha ? t.fecha.split("T")[0] : "---";
            tabla.innerHTML += `
                <tr>
                    <td>${t.nombre}</td>
                    <td>${fechaFmt}</td>
                    <td>${t.hora.slice(0, 5)} hs</td>
                    <td><strong style="color: ${t.estado === 'confirmado' ? 'green' : 'orange'}">${t.estado.toUpperCase()}</strong></td>
                    <td>
                        <button onclick="eliminarTurno(${t.id})" style="border:none; background:none; cursor:pointer;">❌</button>
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error("Error al cargar turnos:", error);
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userStorage = JSON.parse(localStorage.getItem("usuario"));

    const nombre = document.getElementById("nombre").value;
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;

    mensaje.textContent = "Enviando...";
    mensaje.style.color = "blue";

    try {
        const response = await fetch("http://localhost:3000/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                nombre, 
                fecha, 
                hora, 
                usuario_id: userStorage.id 
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            mensaje.style.color = "red";
            mensaje.textContent = data.error;
            return;
        }

        mensaje.style.color = "green";
        mensaje.textContent = "✅ Turno pedido con éxito";
        form.reset();

        cargarMisTurnos();

    } catch (error) {
        mensaje.style.color = "red";
        mensaje.textContent = "❌ Error de conexión";
    }
});

async function eliminarTurno(id) {
    if (!confirm("¿Deseas cancelar este turno?")) return;
    try {
        const res = await fetch(`http://localhost:3000/appointments/${id}`, {
            method: "DELETE"
        });
        if (res.ok) {
            cargarMisTurnos();
        }
    } catch (error) {
        alert("Error al eliminar");
    }
}