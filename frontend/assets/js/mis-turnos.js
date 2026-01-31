const form = document.getElementById("formTurno");
const mensaje = document.getElementById("mensaje");
if (!localStorage.getItem("usuario")) {
    window.location.href = "login.html";
}
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userStorage = JSON.parse(localStorage.getItem("usuario"));

  if (!userStorage || !userStorage.id) {
    alert("Sesión inválida. Inicia sesión nuevamente.");
    window.location.href = "login.html";
    return;
  }

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
    mensaje.textContent = data.message;
    form.reset();

  } catch (error) {
    mensaje.style.color = "red";
    mensaje.textContent = "❌ Error de conexión con el servidor";
  }
});