const form = document.getElementById("formTurno");
const fechaInput = document.getElementById("fecha");
const contenedorHoras = document.getElementById("contenedorHoras");
const horaInputHidden = document.getElementById("hora"); 

let editandoTurnoId = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarServicios();
    cargarMisTurnos(); 
    if (fechaInput) {
        fechaInput.addEventListener("change", (e) => {
            if (e.target.value) cargarDisponibilidad(e.target.value);
        });
    }
});

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

async function cargarServicios() {
    const select = document.getElementById("servicio_id");
    if(!select) return;
    try {
        const res = await fetch("http://localhost:3000/appointments/servicios/lista");
        const servicios = await res.json();
        select.innerHTML = '<option value="">-- Elige un servicio --</option>' + 
            servicios.map(s => `<option value="${s.id}">${s.nombre} ($${s.precio})</option>`).join('');
    } catch (e) { console.error(e); }
}

async function cargarDisponibilidad(fecha) {
    try {
        const res = await fetch(`http://localhost:3000/appointments/disponibilidad?fecha=${fecha}`);
        const data = await res.json();
        const contenedor = document.getElementById("contenedorHoras");
        const inputHora = document.getElementById("hora");
        
        contenedor.innerHTML = ""; 

        if (data.length === 0) {
            contenedor.innerHTML = "<p>Cerrado o sin turnos para esta fecha.</p>";
            return;
        }

        data.forEach(item => {
            const div = document.createElement("div");
            div.className = "hora-item";
            div.innerText = item.hora;

            if (item.disponible) {
                // Forzamos el estilo de cursor para que sepa que es cliqueable
                div.style.cursor = "pointer";

                div.onclick = function() {
                    console.log("Hora seleccionada:", item.hora); // Para debug
                    
                    // 1. Quitar clase 'selected' de todos
                    const todos = document.querySelectorAll(".hora-item");
                    todos.forEach(el => el.classList.remove("selected"));
                    
                    // 2. Agregar clase al actual
                    this.classList.add("selected");
                    
                    // 3. Guardar en el input hidden
                    inputHora.value = item.hora;
                };
            } else {
                div.classList.add("ocupado");
                div.style.opacity = "0.4";
                div.style.cursor = "not-allowed";
            }
            contenedor.appendChild(div);
        });
    } catch (e) {
        console.error("Error disponibilidad:", e);
    }
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
                <td>${t.nombre_servicio || 'Servicio'}</td>
                <td>${t.fecha.split("T")[0]}</td>
                <td>${t.hora.slice(0, 5)} hs</td>
                <td><strong style="color: ${t.estado === 'confirmado' ? 'green' : 'orange'}">${t.estado.toUpperCase()}</strong></td>
                <td>
                    <button onclick="prepararEdicion(${t.id}, '${t.nombre}', '${t.fecha}', ${t.servicio_id}, '${t.hora}')" style="border:none; background:none; cursor:pointer; margin-right:10px;">✏️</button>
                    <button onclick="eliminarTurno(${t.id})" style="border:none; background:none; cursor:pointer;">❌</button>
                </td>
            </tr>`).join('');
    } catch (e) { console.error(e); }
}

async function eliminarTurno(id) {
    const res = await fetch(`http://localhost:3000/appointments/${id}`, { method: "DELETE" });
    if (res.ok) {
        lanzarExito("Turno Cancelado");
        cargarMis_Turnos();
    }
}

function prepararEdicion(id, nombre, fecha, servicio_id, hora) {
    editandoTurnoId = id;
    document.getElementById("nombre").value = nombre;
    document.getElementById("fecha").value = fecha.split("T")[0];
    document.getElementById("servicio_id").value = servicio_id;
    horaInputHidden.value = hora;
    form.querySelector("button").innerText = "ACTUALIZAR TURNO";
    window.scrollTo({ top: 0, behavior: 'smooth' });
    cargarDisponibilidad(fecha.split("T")[0]);
}

form.onsubmit = async (e) => {
    e.preventDefault();
    const userStorage = JSON.parse(localStorage.getItem("usuario"));
    const body = {
        nombre: document.getElementById("nombre").value,
        servicio_id: document.getElementById("servicio_id").value,
        fecha: document.getElementById("fecha").value,
        hora: horaInputHidden.value,
        usuario_id: userStorage.id 
    };

    const url = editandoTurnoId ? `http://localhost:3000/appointments/${editandoTurnoId}` : "http://localhost:3000/appointments";
    const res = await fetch(url, {
        method: editandoTurnoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (res.ok) {
        lanzarExito(editandoTurnoId ? "Actualizado" : "Reservado");
        editandoTurnoId = null;
        form.reset();
        form.querySelector("button").innerText = "RESERVAR TURNO";
        cargarMisTurnos();
    }
};