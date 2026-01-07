async function cargarTurnos() {
  const res = await fetch("http://localhost:3000/appointments");
  const turnos = await res.json();

  const tabla = document.getElementById("tablaTurnos");
  tabla.innerHTML = "";

  turnos.forEach(t => {
    tabla.innerHTML += `
      <tr>
        <td>${t.id}</td>
        <td>${t.nombre}</td>
        <td>${t.fecha.split("T")[0]}</td>
        <td>${t.hora}</td>
        <td>
          <button onclick="eliminar(${t.id})">🗑️</button>
        </td>
      </tr>
    `;
  });
}

async function eliminar(id) {
  await fetch(`http://localhost:3000/appointments/${id}`, {
    method: "DELETE"
  });
  cargarTurnos();
}

cargarTurnos();
