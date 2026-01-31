FROM node:18
WORKDIR /app

# Copiamos los archivos de configuración (ahora están en backend/)
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Volvemos a la raíz para copiar el resto del código
WORKDIR /app
COPY . .

EXPOSE 3000
CMD ["node", "backend/index.js"]