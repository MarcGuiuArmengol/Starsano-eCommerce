# Starsano - MVP Migration

Proyecto de migración de Starsano a una arquitectura autocontenida y dockerizada.

## Requisitos Previos

- [Docker](https://www.docker.com/products/docker-desktop/) instalado.
- [Docker Compose](https://docs.docker.com/compose/install/) instalado.

## Cómo Ejecutar el Proyecto

La forma más sencilla de poner en marcha todo el ecosistema (Frontend, Backend y Base de Datos) es utilizando Docker Compose.

1. **Clonar el repositorio** (si no lo has hecho ya).
2. **Ejecutar con Docker Compose**:
   ```bash
   docker compose up --build
   ```
3. **Acceder a la aplicación**:
   - **Frontend**: [http://localhost:8080](http://localhost:8080)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)

## Estructura del Proyecto

- `/frontend`: Aplicación React + Vite + Tailwind CSS.
- `/server`: Servidor Node.js + Express.
- `docker-compose.yml`: Orquestación de contenedores.

## Notas de Desarrollo

- Si realizas cambios en el `frontend` o `server` que requieran actualizar dependencias, recuerda usar el flag `--build`.
- El chatbot de IA es un MVP visual; la integración funcional se realizará en fases posteriores.
