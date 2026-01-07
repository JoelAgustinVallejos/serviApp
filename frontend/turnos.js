const form = document.getElementById("formTurno");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;

  try {
    const response = await fetch("http://localhost:3000/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombre, fecha, hora }),
    });

    const data = await response.json();

    if (!response.ok) {
      mensaje.style.color = "red";
      mensaje.textContent = data.error;
      return;
    }

    mensaje.style.color = "green";
    mensaje.textContent = data.message;
    form.reset();

  } catch (error) {
    mensaje.style.color = "red";
    mensaje.textContent = "❌ Error de conexión con el servidor";
  }
});
