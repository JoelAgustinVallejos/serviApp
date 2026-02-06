const API_URL = "http://localhost:3000/admin";

document.addEventListener("DOMContentLoaded", () => {
    cargarConfiguracion();
    cargarTurnos();
    cargarServiciosAdmin();
    cargarDiasEspeciales();

    document.getElementById("formNuevoServicio").addEventListener("submit", agregarServicio);
});

// --- FUNCIONES DE CARGA ---
async function cargarServiciosAdmin() {
    const res = await fetch(`${API_URL}/servicios`);
    const servicios = await res.json();
    const lista = document.getElementById("listaServiciosAdmin");
    lista.innerHTML = servicios.map(s => `
        <tr>
            <td style="color:black; padding:10px;">${s.nombre}</td>
            <td style="color:black; padding:10px;">$${s.precio}</td>
            <td><button onclick="eliminarServicio(${s.id})" style="background:none; border:none; cursor:pointer;">❌</button></td>
        </tr>
    `).join('');
}

async function agregarServicio(e) {
    e.preventDefault();
    const nombre = document.getElementById("servNombre").value;
    const precio = document.getElementById("servPrecio").value;

    const res = await fetch(`${API_URL}/servicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio })
    });

    if (res.ok) {
        lanzarExito("Servicio Creado");
        e.target.reset();
        cargarServiciosAdmin();
    }
}

// ELIMINADO confirm() - Ahora es directo con tu carta flotante
async function eliminarServicio(id) {
    const res = await fetch(`${API_URL}/servicios/${id}`, { method: "DELETE" });
    if (res.ok) {
        lanzarExito("Servicio Eliminado");
        cargarServiciosAdmin();
    }
}

// --- CONFIGURACIÓN ---
async function cargarConfiguracion() {
    const res = await fetch(`${API_URL}/config`);
    const config = await res.json();
    if (config) {
        document.getElementById("horaInicio").value = config.hora_inicio.slice(0, 5);
        document.getElementById("horaFin").value = config.hora_fin.slice(0, 5);
        const dias = JSON.parse(config.dias_laborales || "[]");
        document.querySelectorAll('.day-checkbox').forEach(cb => {
            cb.checked = dias.includes(parseInt(cb.value));
        });
    }
}

async function guardarConfiguracion() {
    const hora_inicio = document.getElementById("horaInicio").value;
    const hora_fin = document.getElementById("horaFin").value;
    const dias_laborales = Array.from(document.querySelectorAll('.day-checkbox:checked')).map(cb => parseInt(cb.value));

    const res = await fetch(`${API_URL}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hora_inicio, hora_fin, dias_laborales: JSON.stringify(dias_laborales) })
    });
    if (res.ok) lanzarExito("Configuración Guardada");
}

// --- DÍAS ESPECIALES ---
async function cargarDiasEspeciales() {
    const res = await fetch(`${API_URL}/dias-especiales`);
    const dias = await res.json();
    const lista = document.getElementById("listaDiasEspeciales");
    lista.innerHTML = dias.map(d => `
        <tr>
            <td style="color:black; padding:10px;">${d.fecha.split('T')[0]}</td>
            <td style="color:black; padding:10px;">${d.descripcion}</td>
            <td><button onclick="eliminarDiaEspecial(${d.id})" style="background:none; border:none; cursor:pointer;">❌</button></td>
        </tr>
    `).join('');
}

async function agregarDiaEspecial() {
    const fecha = document.getElementById("fechaEspecial").value;
    const descripcion = document.getElementById("descEspecial").value;
    if(!fecha) return; // Validación silenciosa sin alert

    const res = await fetch(`${API_URL}/dias-especiales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, descripcion })
    });
    if (res.ok) {
        lanzarExito("Día Bloqueado");
        cargarDiasEspeciales();
    }
}

async function eliminarDiaEspecial(id) {
    const res = await fetch(`${API_URL}/dias-especiales/${id}`, { method: "DELETE" });
    if (res.ok) {
        lanzarExito("Día Desbloqueado");
        cargarDiasEspeciales();
    }
}

// --- TURNOS ---
async function cargarTurnos() {
    const nom = document.getElementById("buscarNombre").value;
    const fec = document.getElementById("buscarFecha").value;
    const res = await fetch(`${API_URL}/turnos?nombre=${nom}&fecha=${fec}`);
    const turnos = await res.json();
    const tabla = document.getElementById("tablaTurnos");
    tabla.innerHTML = turnos.map(t => `
        <tr>
            <td>${t.id}</td>
            <td>${t.nombre}</td>
            <td>${t.fecha.split('T')[0]}</td>
            <td>${t.hora.slice(0, 5)} hs</td>
            <td>${t.estado.toUpperCase()}</td>
            <td>
                <button onclick="cambiarEstado(${t.id}, 'confirmado')" style="cursor:pointer;">✓</button>
                <button onclick="eliminarTurno(${t.id})" style="cursor:pointer;">✕</button>
            </td>
        </tr>
    `).join('');
}

async function cambiarEstado(id, estado) {
    const res = await fetch(`${API_URL}/turnos/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado })
    });
    if (res.ok) {
        lanzarExito("Estado Actualizado");
        cargarTurnos();
    }
}

// ELIMINADO confirm() - Ahora es directo
async function eliminarTurno(id) {
    const res = await fetch(`${API_URL}/turnos/${id}`, { method: "DELETE" });
    if (res.ok) {
        lanzarExito("Turno Eliminado");
        cargarTurnos();
    }
}

// --- TU CARTA FLOTANTE ---
function lanzarExito(t) {
    document.getElementById("modalTxt").innerText = t;
    const m = document.getElementById("modalExito");
    m.style.display = "flex";
    const v = document.getElementById("videoCheck");
    v.currentTime = 0;
    v.play().catch(e => console.log("Esperando interacción para video"));
    
    setTimeout(() => {
        m.style.display = "none";
    }, 2500);
}