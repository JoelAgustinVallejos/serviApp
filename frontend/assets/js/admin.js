const API_URL = "http://localhost:3000/admin";

// Verificar rol apenas carga la página para seguridad visual
document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("usuario"));
    if (!user || user.rol !== 'admin') {
        alert("Acceso restringido: Inicia sesión como administrador");
        window.location.href = "login.html";
        return;
    }

    // Si es admin, cargar todo
    cargarConfiguracion();
    cargarTurnos();
    cargarServiciosAdmin();
    cargarDiasEspeciales();

    document.getElementById("formNuevoServicio").addEventListener("submit", agregarServicio);
});

// --- FUNCIÓN CLAVE: Genera los headers con el ROL ---
function getAdminHeaders() {
    const user = JSON.parse(localStorage.getItem("usuario"));
    return {
        "Content-Type": "application/json",
        "x-role": user ? user.rol : ""
    };
}

// --- GESTIÓN DE TURNOS ---
async function cargarTurnos() {
    const nom = document.getElementById("buscarNombre").value;
    const fec = document.getElementById("buscarFecha").value;
    
    try {
        const res = await fetch(`${API_URL}/turnos?nombre=${nom}&fecha=${fec}`, {
            headers: getAdminHeaders() //
        });
        
        if (res.status === 403) return window.location.href = "login.html";

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
    } catch (e) { console.error("Error turnos:", e); }
}

async function cambiarEstado(id, estado) {
    const res = await fetch(`${API_URL}/turnos/${id}/estado`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify({ estado })
    });
    if (res.ok) {
        lanzarExito("Estado Actualizado");
        cargarTurnos();
    }
}

async function eliminarTurno(id) {
    if(!confirm("¿Deseas eliminar este turno?")) return;
    const res = await fetch(`${API_URL}/turnos/${id}`, { 
        method: "DELETE",
        headers: getAdminHeaders() 
    });
    if (res.ok) {
        lanzarExito("Turno Eliminado");
        cargarTurnos();
    }
}

// --- CONFIGURACIÓN ---
async function cargarConfiguracion() {
    try {
        const res = await fetch(`${API_URL}/config`, { headers: getAdminHeaders() });
        if (res.status === 403) return;

        const config = await res.json();
        if (config) {
            document.getElementById("horaInicio").value = config.hora_inicio.slice(0, 5);
            document.getElementById("horaFin").value = config.hora_fin.slice(0, 5);
            const dias = JSON.parse(config.dias_laborales || "[]");
            document.querySelectorAll('.day-checkbox').forEach(cb => {
                cb.checked = dias.includes(parseInt(cb.value));
            });
        }
    } catch (e) { console.error("Error config:", e); }
}

async function guardarConfiguracion() {
    const hora_inicio = document.getElementById("horaInicio").value;
    const hora_fin = document.getElementById("horaFin").value;
    const dias_laborales = Array.from(document.querySelectorAll('.day-checkbox:checked')).map(cb => parseInt(cb.value));

    const res = await fetch(`${API_URL}/config`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ hora_inicio, hora_fin, dias_laborales: JSON.stringify(dias_laborales) })
    });
    if (res.ok) lanzarExito("Configuración Guardada");
}

// --- SERVICIOS ---
async function cargarServiciosAdmin() {
    const res = await fetch(`${API_URL}/servicios`, { headers: getAdminHeaders() });
    if (!res.ok) return;
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
        headers: getAdminHeaders(),
        body: JSON.stringify({ nombre, precio })
    });

    if (res.ok) {
        lanzarExito("Servicio Creado");
        e.target.reset();
        cargarServiciosAdmin();
    }
}

async function eliminarServicio(id) {
    const res = await fetch(`${API_URL}/servicios/${id}`, { 
        method: "DELETE",
        headers: getAdminHeaders() 
    });
    if (res.ok) {
        lanzarExito("Servicio Eliminado");
        cargarServiciosAdmin();
    }
}

// --- DÍAS ESPECIALES (BLOQUEOS) ---
async function cargarDiasEspeciales() {
    try {
        const res = await fetch(`${API_URL}/dias-especiales`, { headers: getAdminHeaders() });
        
        // Si hay error de permisos, detenemos la ejecución
        if (!res.ok) throw new Error("No autorizado");

        const dias = await res.json();
        const lista = document.getElementById("listaDiasEspeciales");
        
        // Ahora dias será un array válido y map funcionará
        lista.innerHTML = dias.map(d => `
            <tr>
                <td style="color:black; padding:10px;">${d.fecha.split('T')[0]}</td>
                <td style="color:black; padding:10px;">${d.descripcion}</td>
                <td><button onclick="eliminarDiaEspecial(${d.id})" style="background:none; border:none; cursor:pointer;">❌</button></td>
            </tr>
        `).join('');
    } catch (e) { 
        console.error("Error días especiales:", e);
        document.getElementById("listaDiasEspeciales").innerHTML = "";
    }
}

async function agregarDiaEspecial() {
    const fecha = document.getElementById("fechaEspecial").value;
    const descripcion = document.getElementById("bloqueoMotivo").value; // Nombre corregido según admin.html
    
    if(!fecha || !descripcion) return; 

    const res = await fetch(`${API_URL}/dias-especiales`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ fecha, descripcion })
    });
    
    if (res.ok) {
        lanzarExito("Día Bloqueado");
        document.getElementById("fechaEspecial").value = "";
        document.getElementById("bloqueoMotivo").value = "";
        cargarDiasEspeciales();
    }
}

async function eliminarDiaEspecial(id) {
    const res = await fetch(`${API_URL}/dias-especiales/${id}`, { 
        method: "DELETE", 
        headers: getAdminHeaders() 
    });
    if (res.ok) {
        lanzarExito("Día Desbloqueado");
        cargarDiasEspeciales();
    }
}

// --- UTILIDADES ---
function lanzarExito(t) {
    const modal = document.getElementById("modalExito");
    const txt = document.getElementById("modalTxt");
    const video = document.getElementById("videoCheck");
    if (txt) txt.innerText = t;
    if (modal) modal.style.display = "flex";
    if (video) {
        video.currentTime = 0;
        video.play().catch(e => console.log("Error video"));
    }
    setTimeout(() => { if (modal) modal.style.display = "none"; }, 2500);
}