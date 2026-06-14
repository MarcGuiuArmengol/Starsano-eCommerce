# 🚀 GUÍA DE CONFIGURACIÓN INICIAL - STARSANO

## Prerequisitos

- Docker y Docker Compose instalados
- OpenAI API key (para LLM features)
- (Opcional) Credenciales SMTP para alertas por email

---

## Paso 1: Generar Variables de Entorno Seguras

### 1.1 Crear archivo `.env` desde la plantilla

```bash
cp .env.example .env
```

### 1.2 Generar JWT_SECRET seguro

```bash
openssl rand -base64 32
```

Copia el resultado y pégalo en `.env` como valor de `JWT_SECRET`.

### 1.3 Generar ADMIN_PASSWORD seguro

Genera una contraseña fuerte con:
- Mínimo 12 caracteres
- Mayúsculas y minúsculas
- Números
- Símbolos especiales

Ejemplo: `P@ssw0rd!Secure2026`

### 1.4 Configurar POSTGRES_PASSWORD

Genera otra contraseña segura para PostgreSQL (diferente a la de admin):

```bash
openssl rand -base64 24
```

---

## Paso 2: Configurar Variables en `.env`

Edita el archivo `.env` y asegúrate de llenar:

**REQUERIDAS (el app no funcionará sin estas):**
```env
JWT_SECRET=<resultado-de-openssl-arriba>
ADMIN_PASSWORD=<tu-password-seguro>
POSTGRES_PASSWORD=<contraseña-postgres>
OPENAI_API_KEY=sk-your-actual-key-here
```

**RECOMENDADAS (para email alerts):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=noreply@tudominio.com
ALERT_EMAIL_TO=admin@tudominio.com
```

**PRODUCCIÓN (cambiar estos):**
```env
ALLOWED_ORIGINS=http://localhost:8080,https://starsano.com.mx
FRONTEND_URL=http://localhost:8080/
```

---

## Paso 3: Validar Configuración

Antes de arrancar, verifica que `.env` contenga valores válidos:

```bash
# Ver variables (sin mostrar valores sensibles)
grep -E '^[A-Z_]+=' .env | head -20
```

---

## Paso 4: Arrancar con Docker Compose

```bash
# Construcción e inicio de todos los servicios
docker compose up --build

# Si quieres ejecutar en background:
docker compose up --build -d

# Ver logs en tiempo real:
docker compose logs -f
```

**Servicios que deberían arrancar:**
- ✅ `db` (PostgreSQL) - Puerto 5432
- ✅ `backend` (Node.js) - Puerto 3000 → expuesto en 3000
- ✅ `frontend` (React/Vite) - Puerto 8080
- ✅ `chatbot` (FastAPI) - Puerto 8000
- ✅ `seo-writer` (FastAPI) - Puerto 8001

---

## Paso 5: Verificar que Todo Funciona

### Acceso a la aplicación
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000/api
- **ChatBot API:** http://localhost:8000/docs (Swagger)
- **SEO Writer API:** http://localhost:8001/docs

### Credenciales por defecto
- **Email:** admin@starsano.com.mx
- **Password:** (el que configuraste en ADMIN_PASSWORD)

### Test rápido de APIs
```bash
# Health check del backend
curl http://localhost:3000/api/health

# Health check del chatbot
curl http://localhost:8000/health

# Ver documentación Swagger del chatbot
open http://localhost:8000/docs
```

---

## Solución de Problemas

### "JWT_SECRET variable is not set"
**Solución:** Asegúrate de que `.env` existe en la raíz del proyecto y contiene `JWT_SECRET=<tu-valor>`

### "ADMIN_PASSWORD variable is not set"
**Solución:** Llenar ADMIN_PASSWORD en `.env`

### "unable to get image 'postgres:15-alpine'"
**Solución:** Verificar que Docker daemon está corriendo:
```bash
docker ps  # Si falla, inicia Docker Desktop
```

### Backend falla con "Missing required environment variables"
**Solución:** Revisar `.env` tiene todas las vars requeridas. Ejecutar:
```bash
docker compose logs backend  # Ver logs de error
```

### PostgreSQL no inicia
**Solución:** Eliminar volumen anterior y reintentar:
```bash
docker compose down -v  # Elimina volúmenes
docker compose up --build  # Reinicia
```

---

## Variables Importantes Explicadas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `JWT_SECRET` | Clave para firmar tokens JWT (mín. 32 chars) | `openssl rand -base64 32` |
| `ADMIN_PASSWORD` | Contraseña del usuario admin inicial | `P@ssw0rd!Secure2026` |
| `POSTGRES_PASSWORD` | Contraseña de la BD PostgreSQL | `dbP@ss123` |
| `OPENAI_API_KEY` | Clave de OpenAI para LLM/embeddings | `sk-...` |
| `ALLOWED_ORIGINS` | Dominios permitidos para CORS | `http://localhost:8080` |
| `SMTP_*` | Credenciales para envío de emails | Gmail, SendGrid, etc. |

---

## ⚠️ SEGURIDAD - CHECKLIST

- [ ] ✅ No hacer commit de `.env` a git (está en `.gitignore`)
- [ ] ✅ JWT_SECRET es único y seguro (mín. 32 caracteres)
- [ ] ✅ ADMIN_PASSWORD es fuerte (mín. 12 caracteres, mixto)
- [ ] ✅ POSTGRES_PASSWORD es diferente del admin password
- [ ] ✅ OPENAI_API_KEY es válida (empieza con `sk-`)
- [ ] ✅ En producción: cambiar ALLOWED_ORIGINS a dominio real
- [ ] ✅ En producción: habilitar HTTPS/SSL

---

## Próximos Pasos

1. **Primera login:** Entra con admin@starsano.com.mx / (tu ADMIN_PASSWORD)
2. **Cambiar contraseña:** Por seguridad, cámbiala después del primer login
3. **Configurar productos:** Importar CSV o crear manualmente via admin
4. **Probar chatbot:** Envía mensajes de prueba
5. **Revisar logs:** `docker compose logs -f` para ver actividad

---

## Comandos Útiles

```bash
# Ver estado de servicios
docker compose ps

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f chatbot

# Detener servicios sin eliminar datos
docker compose stop

# Reiniciar servicios
docker compose restart

# Eliminar todo (¡atención: borra BD!)
docker compose down -v

# Ejecutar comando en contenedor
docker compose exec backend npm run build

# Inspeccionar BD PostgreSQL
docker compose exec db psql -U postgres -d starsano -c "SELECT * FROM users;"

# Backup BD SQLite del chatbot
docker compose exec chatbot sqlite3 /app/data/chatbot.db ".backup /app/data/chatbot-backup.db"
```