# Etapa 1: build del frontend
FROM node:18-alpine AS build

WORKDIR /app

# Copiar archivos para instalar dependencias
COPY package*.json ./

# Instalar dependencias con npm
RUN npm install
RUN npm install react-apexcharts apexcharts --legacy-peer-deps


# Copiar el resto del proyecto
COPY . .

# Crear el build de producción
RUN npm run build

# Etapa 2: servir el build con 'serve'
FROM node:18-alpine

# Instalar 'serve' globalmente
RUN npm install -g serve

WORKDIR /app

# Copiar el build desde la etapa anterior
COPY --from=build /app/build ./build

# Exponer puerto
EXPOSE 3001

# Comando para servir la app
CMD ["serve", "-s", "build", "-l", "3001"]
