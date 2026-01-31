# serviApp📅 Sistema de Gestión de Turnos Dinámico
Este es un sistema Full Stack diseñado para la reserva y administración de turnos de manera eficiente. Permite a los usuarios registrarse y solicitar turnos, mientras que el administrador tiene control total sobre la agenda y la configuración horaria del negocio.

🚀 Características Principales
Autenticación Segura: Registro e inicio de sesión con contraseñas protegidas mediante BCrypt.

Gestión de Turnos: Los usuarios pueden solicitar turnos y ver su estado.

Panel de Administración: El administrador puede confirmar o eliminar turnos de cualquier usuario.

Horarios Dinámicos: Configuración de hora de apertura y cierre modificable desde la base de datos sin tocar el código.

Dockerizado: Despliegue inmediato con un solo comando gracias a Docker y Docker Compose.

🛠️ Tecnologías Utilizadas
Backend: Node.js con Express.

Frontend: HTML5, CSS3 (Bootstrap) y JavaScript Vanilla.

Base de Datos: MySQL 8.0.

Contenedores: Docker & Docker Compose.

📦 Instalación y Configuración
Para que el sistema funcione exactamente igual que en el entorno de desarrollo, sigue estos pasos:

1. Requisitos Previos
Tener instalado Docker.

Tener instalado Git.

2. Clonar el Repositorio
Bash
git clone <URL_DE_TU_REPOSITORIO>
cd "Sistemas de turnos"
3. Levantar el Sistema
Ejecuta el siguiente comando en la terminal (raíz del proyecto):

Bash
docker compose up -d
Este comando descargará las imágenes, configurará la red y ejecutará automáticamente el script database.sql para crear las tablas y el usuario administrador.

4. Acceso al Sistema
Frontend: Abre tu navegador en http://localhost:8080 (o el puerto que hayas definido para tu frontend).

API / Backend: Funcionando en http://localhost:3000.

👤 Datos de Acceso por Defecto (Pruebas)
Al iniciar por primera vez, el sistema cuenta con un administrador precargado para que puedas gestionar los turnos de inmediato:

Usuario: admin@test.com

Contraseña: admin123

⚙️ Funcionamiento de la Base de Datos
El sistema utiliza un volumen persistente para no perder los datos. Si necesitas resetear el sistema a su estado original (borrar todos los turnos y usuarios nuevos), ejecuta:

Bash
docker compose down -v
docker compose up -d
📝 Notas de Desarrollo
Este proyecto fue diseñado con un enfoque en la portabilidad. La base de datos se inicializa automáticamente mediante el punto de montaje en /docker-entrypoint-initdb.d/, asegurando que la estructura de tablas y el usuario admin estén disponibles desde el primer segundo.