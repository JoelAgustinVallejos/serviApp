const form = document.getElementById("formTurno");
const mensaje = document.getElementById("mensaje");
const fechaInput = document.getElementById("fecha");
const horaSelect = document.getElementById("hora"); // Cambiado de input a select en tu HTML
let editandoTurnoId = null; // Para saber si estamos creando o editando

document.addEventListener("DOMContentLoaded", () => {
    cargarServicios();
    cargarMisTurnos();
    
    // Escuchar cuando el usuario cambia la fecha para actualizar horas
    fechaInput.addEventListener("change", (e) => {
        if (e.target.value) cargarDisponibilidad(e.target.value);
    });
});

async function cargarServicios() {
    const select = document.getElementById("servicio_id");
    try {
        const res = await fetch("http://localhost:3000/appointments/servicios/lista");
        const servicios = await res.json();
        select.innerHTML = '<option value="">-- Elige un servicio --</option>';
        servicios.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.nombre} ($${s.precio})</option>`;
        });
    } catch (error) { console.error(error); }
}

async function cargarDisponibilidad(fecha) {
    const horaSelect = document.getElementById("hora");
    try {
        horaSelect.innerHTML = '<option value="">⏳ Cargando horarios...</option>';
        
        const res = await fetch(`http://localhost:3000/appointments/disponibilidad/${fecha}`);
        const data = await res.json();
        
        // Extraemos el rango y las horas ocupadas
        const { rango, ocupados } = data;
        
        if (!rango || !rango.hora_inicio || !rango.hora_fin) {
            horaSelect.innerHTML = '<option value="">⚠️ Error en configuración</option>';
            return;
        }

        // Limpiamos las horas ocupadas por si vienen con segundos (09:00:00 -> 09:00)
        const ocupadasLimpias = ocupados.map(h => h.slice(0, 5));

        const inicio = parseInt(rango.hora_inicio.split(":")[0]);
        const fin = parseInt(rango.hora_fin.split(":")[0]);
        
        horaSelect.innerHTML = '<option value="">-- Selecciona hora --</option>';
        
        let hayHorasDisponibles = false;

        for (let h = inicio; h < fin; h++) {
            const horaStr = `${h.toString().padStart(2, '0')}:00`;
            
            // Verificamos si la hora NO está en la lista de ocupadas
            if (!ocupadasLimpias.includes(horaStr)) {
                const opt = document.createElement("option");
                opt.value = horaStr;
                opt.innerText = `${horaStr} hs`;
                horaSelect.appendChild(opt);
                hayHorasDisponibles = true;
            }
        }

        if (!hayHorasDisponibles) {
            horaSelect.innerHTML = '<option value="">❌ No hay turnos libres este día</option>';
        }

    } catch (error) {
        console.error("Error al cargar disponibilidad:", error);
        horaSelect.innerHTML = '<option value="">❌ Error al conectar</option>';
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
        tabla.innerHTML = ""; 

        turnos.forEach(t => {
            const fechaFmt = t.fecha ? t.fecha.split("T")[0] : "---";
            tabla.innerHTML += `
                <tr>
                    <td>${t.nombre}</td>
                    <td><b>${t.servicio_nombre}</b></td>
                    <td>${fechaFmt}</td>
                    <td>${t.hora.slice(0, 5)} hs</td>
                    <td><strong style="color: ${t.estado === 'confirmado' ? 'green' : 'orange'}">${t.estado.toUpperCase()}</strong></td>
                    <td>
                        <button onclick='prepararEdicion(${JSON.stringify(t)})' style="cursor:pointer; margin-right:10px;">✏️</button>
                        <button onclick="eliminarTurno(${t.id})" style="cursor:pointer;">❌</button>
                    </td>
                </tr>`;
        });
    } catch (error) { console.error(error); }
}

// NUEVO: Cargar datos del turno en el formulario para editar
function prepararEdicion(turno) {
    editandoTurnoId = turno.id;
    document.getElementById("nombre").value = turno.nombre;
    document.getElementById("servicio_id").value = turno.servicio_id;
    document.getElementById("fecha").value = turno.fecha.split("T")[0];
    
    // Cargamos disponibilidad de esa fecha y luego seteamos la hora
    cargarDisponibilidad(turno.fecha.split("T")[0]).then(() => {
        // Añadimos la hora actual del turno por si el usuario quiere mantenerla
        const horaActual = turno.hora.slice(0, 5);
        if (![...horaSelect.options].some(o => o.value === horaActual)) {
            const opt = document.createElement("option");
            opt.value = horaActual;
            opt.innerText = `${horaActual} hs (Actual)`;
            horaSelect.appendChild(opt);
        }
        horaSelect.value = horaActual;
    });
    
    mensaje.textContent = "Editando turno...";
    mensaje.style.color = "orange";
    window.scrollTo(0, 0); // Sube al formulario
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userStorage = JSON.parse(localStorage.getItem("usuario"));
    const body = {
        nombre: document.getElementById("nombre").value,
        servicio_id: document.getElementById("servicio_id").value,
        fecha: document.getElementById("fecha").value,
        hora: document.getElementById("hora").value,
        usuario_id: userStorage.id 
    };

    const url = editandoTurnoId 
        ? `http://localhost:3000/appointments/${editandoTurnoId}` 
        : "http://localhost:3000/appointments";
    
    const method = editandoTurnoId ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            mensaje.style.color = "green";
            mensaje.textContent = editandoTurnoId ? "✅ Actualizado con éxito" : "✅ Turno creado";
            editandoTurnoId = null;
            form.reset();
            cargarMisTurnos();
        } else {
            const data = await response.json();
            mensaje.textContent = data.error;
        }
    } catch (error) { mensaje.textContent = "❌ Error conexión"; }
});