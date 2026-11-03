# Etapa 1: Compilacion del Frontend (React + Vite)
FROM node:20-alpine AS build

WORKDIR /app

# Copiar definiciones de paquetes e instalar dependencias
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copiar el codigo fuente del frontend y compilar
COPY frontend/ ./
RUN npm run build

# Etapa 2: Servidor Web de Produccion (Nginx)
FROM nginx:alpine

# Copiar configuracion optimizada para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los artefactos compilados desde la etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
