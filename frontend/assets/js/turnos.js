const form = document.getElementById("formTurno");
const mensaje = document.getElementById("mensaje");

document.addEventListener("DOMContentLoaded", cargarMisTurnos);

async function cargarMisTurnos() {
    const userStorage = JSON.parse(localStorage.getItem("usuario"));
    if (!userStorage) return;

    try {
        const res = await fetch(`http://localhost:3000/appointments/mis-turnos/${userStorage.id}`);
        const turnos = await res.json();

        const tabla = document.getElementById("tablaMisTurnos");
        if (!tabla) return; 

        tabla.innerHTML = ""; 

        turnos.forEach(t => {
            tabla.innerHTML += `
                <tr>
                    <td>${t.nombre}</td>
                    <td>${t.fecha.split("T")[0]}</td>
                    <td>${t.hora} hs</td>
                    <td><strong style="color: ${t.estado === 'confirmado' ? 'green' : 'orange'}">${t.estado}</strong></td>
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
        mensaje.textContent = "❌ Error al conectar con el servidor";
    }
});

async function eliminarTurno(id) {
    if (!confirm("¿Deseas cancelar este turno?")) return;
    const userStorage = JSON.parse(localStorage.getItem("usuario"));

    try {
        const res = await fetch(`http://localhost:3000/appointments/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario_id: userStorage.id })
        });

        if (res.ok) {
            cargarMisTurnos();
        } else {
            const data = await res.json();
            alert(data.error);
        }
    } catch (error) {
        alert("Error al intentar cancelar");
    }
}