const API_URL = "http://localhost:3000/admin";

// 1. PROTECCIÓN DE RUTA
(function() {
    const user = JSON.parse(localStorage.getItem("usuario"));
    if (!user || user.rol !== 'admin') {
        window.location.href = "login.html"; 
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    cargarConfiguracion();
    cargarTurnos();
    cargarServiciosAdmin();
    cargarDiasEspeciales();

    document.getElementById("formNuevoServicio").addEventListener("submit", agregarServicio);
});

function getAdminHeaders() {
    const user = JSON.parse(localStorage.getItem("usuario"));
    return {
        "Content-Type": "application/json",
        "x-role": user ? user.rol : ""
    };
}

async function cargarTurnos() {
    const nom = document.getElementById("buscarNombre").value;
    const fec = document.getElementById("buscarFecha").value;
    
    try {
        const res = await fetch(`${API_URL}/turnos?nombre=${nom}&fecha=${fec}`, {
            headers: getAdminHeaders()
        });
        
        if (res.status === 403) return window.location.href = "login.html";

        const turnos = await res.json();
        
        // --- LLAMADA A ESTADÍSTICAS ---
        actualizarEstadisticas(turnos); 

        const tabla = document.getElementById("tablaTurnos");

        tabla.innerHTML = turnos.map(t => {
            let colorEstado = '#f59e0b'; // Naranja (Pendiente)
            if (t.estado === 'confirmado') colorEstado = '#22c55e'; // Verde
            if (t.estado === 'cancelado') colorEstado = '#ef4444';  // Rojo

            const botones = t.estado !== 'cancelado' 
                ? `<button onclick="cambiarEstado(${t.id}, 'confirmado')" title="Confirmar">✓</button>
                   <button onclick="cancelarTurno(${t.id})" title="Cancelar">✕</button>`
                : `<span style="color:gray; font-style:italic;">Cancelado</span>`;

            return `
                <tr>
                    <td>${t.id}</td>
                    <td>${t.nombre}</td>
                    <td>${t.fecha.split('T')[0]}</td>
                    <td>${t.hora.slice(0, 5)} hs</td>
                    <td><strong style="color: ${colorEstado}">${t.estado.toUpperCase()}</strong></td>
                    <td>${botones}</td>
                </tr>`;
        }).join('');
    } catch (e) { console.error("Error turnos:", e); }
}

function actualizarEstadisticas(turnos) {
    // Obtenemos la fecha de hoy en formato local YYYY-MM-DD
    const hoy = new Date();
    const hoyStr = hoy.getFullYear() + '-' + 
                   String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(hoy.getDate()).padStart(2, '0');
    
    console.log("Fecha de hoy para comparar:", hoyStr); 

    // Filtramos turnos de hoy que NO estén cancelados
    const turnosHoy = turnos.filter(t => {
        const fechaTurno = t.fecha.split('T')[0]; 
        return fechaTurno === hoyStr && t.estado !== 'cancelado';
    });
    
    const confirmados = turnosHoy.filter(t => t.estado === 'confirmado').length;
    const pendientes = turnosHoy.filter(t => t.estado === 'pendiente').length;

    // CAPTURAMOS LOS ELEMENTOS
    const elHoy = document.getElementById("statHoy");
    const elConf = document.getElementById("statConfirmados");
    const elPend = document.getElementById("statPendientes"); // <--- NOMBRE CORREGIDO

    // ASIGNAMOS LOS VALORES (Con nombres parejos)
    if(elHoy) elHoy.innerText = turnosHoy.length;
    if(elConf) elConf.innerText = confirmados;
    if(elPend) elPend.innerText = pendientes; // <--- AQUÍ ESTABA EL ERROR
}
async function cancelarTurno(id) {
    if (!confirm("¿Seguro que quieres cancelar este turno? La hora se liberará.")) return;
    const res = await fetch(`${API_URL}/turnos/${id}/estado`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify({ estado: 'cancelado' })
    });
    if (res.ok) {
        lanzarExito("Turno Cancelado");
        cargarTurnos();
    }
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

async function cargarConfiguracion() {
    try {
        const res = await fetch(`${API_URL}/config`, {
            headers: getAdminHeaders()
        });
        
        if (!res.ok) {
            console.error("Error al obtener la configuración del servidor");
            return;
        }

        const config = await res.json();
        
        // 🛡️ VALIDACIÓN: Solo intentamos poner valores si config existe
        if (config && config.hora_inicio && config.hora_fin) {
            document.getElementById("horaInicio").value = config.hora_inicio.slice(0, 5);
            document.getElementById("horaFin").value = config.hora_fin.slice(0, 5);
            
            const dias = JSON.parse(config.dias_laborales || "[]");
            document.querySelectorAll('.day-checkbox').forEach(cb => {
                cb.checked = dias.includes(parseInt(cb.value));
            });
        }
    } catch (e) { 
        console.error("Error config en admin:", e); 
    }
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
        </tr>`).join('');
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

async function cargarDiasEspeciales() {
    try {
        const res = await fetch(`${API_URL}/dias-especiales`, { headers: getAdminHeaders() });
        if (!res.ok) return;
        const dias = await res.json();
        const lista = document.getElementById("listaDiasEspeciales");
        lista.innerHTML = dias.map(d => `
            <tr>
                <td style="color:black; padding:10px;">${d.fecha.split('T')[0]}</td>
                <td style="color:black; padding:10px;">${d.descripcion}</td>
                <td><button onclick="eliminarDiaEspecial(${d.id})" style="background:none; border:none; cursor:pointer;">❌</button></td>
            </tr>`).join('');
    } catch (e) { console.error(e); }
}

async function agregarDiaEspecial() {
    const fecha = document.getElementById("fechaEspecial").value;
    const descripcion = document.getElementById("bloqueoMotivo").value; 
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
    const res = await fetch(`${API_URL}/dias-especiales/${id}`, { method: "DELETE", headers: getAdminHeaders() });
    if (res.ok) {
        lanzarExito("Día Desbloqueado");
        cargarDiasEspeciales();
    }
}

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