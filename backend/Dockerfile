FROM node:18

WORKDIR /app

# Copiamos dependencias primero para optimizar velocidad de construcción
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copiamos TODO el proyecto (frontend y backend) para que Express vea ambos
COPY . .

EXPOSE 3000

# Nos posicionamos en backend para ejecutar el servidor
WORKDIR /app/backend
CMD ["npm", "start"]