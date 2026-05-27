# DataShield AI — Guía de Revisión

**Repositorio:** https://github.com/nik129linux/Diseno-de-sw

---

## ¿Qué es?

Middleware de **Data Loss Prevention (DLP)** que se sitúa entre el empleado y un LLM externo. Antes de enviar cualquier prompt, el sistema detecta y enmascara datos sensibles (emails, tarjetas, DNI, teléfonos…). Todo queda registrado en un log de auditoría inmutable.

```
Empleado → [DataShield API] → Sanitización → Ollama (LLM local)
                ↓
           MongoDB (audit log)
```

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Java 17 + Spring Boot 3.2.5 |
| API | REST (Spring MVC) |
| Seguridad | Spring Security + JWT RS256 |
| Base de datos | MongoDB 6 (Spring Data + MongoTemplate) |
| LLM | Ollama local — `gemma4:31b-cloud` |
| Frontend | React 19 + TypeScript + Vite |
| Cache | Caffeine (patrones regex compilados) |
| Resiliencia | Resilience4j (circuit breaker + retry) |

---

## 1. Arrancar el proyecto

```bash
cd ~/Documents/U/Co/U/3S/Diseño/proyecto-final/Diseno-de-sw
bash run.sh
```

El script hace en orden:
1. Mata procesos anteriores en `:8080` y `:5173`
2. Detecta si MongoDB corre en el host (puerto 27017) → lo usa directo; si no, levanta el contenedor Docker
3. Arranca Spring Boot con `./mvnw spring-boot:run`
4. Arranca el frontend Vite

Resultado esperado:
```
=========================================
  DataShield AI is running!
=========================================
  Frontend : http://localhost:5173
  Backend  : http://localhost:8080
  Admin    : admin@datashield.ai / Admin@123!
  Employee : employee@datashield.ai / Admin@123!
```

---

## 2. Estructura del proyecto Java

```
src/main/java/com/datashield/ai/
├── config/
│   ├── SecurityConfig.java       ← RBAC, JWT filter, CORS
│   ├── DataInitializer.java      ← Seed inicial (usuarios + política DLP)
│   ├── RateLimitingFilter.java   ← 30 req/min por IP
│   └── OpenApiConfig.java        ← Swagger UI con Bearer auth
├── controller/
│   ├── AuthController.java       ← /auth/login, /auth/logout, /auth/refresh
│   ├── PromptController.java     ← /chat/prompt  (flujo principal)
│   ├── ChatController.java       ← /chat/history
│   ├── AuditController.java      ← /audit, /audit/stats
│   ├── ExportController.java     ← /audit/export (CSV)
│   ├── PolicyController.java     ← /policies, /policies/llm-config
│   └── UserController.java       ← /users (CRUD)
├── service/
│   ├── SanitizationService.java  ← Motor DLP (regex + cache Caffeine)
│   └── TokenBlacklistService.java← Revocación de JWT
├── model/
│   ├── Interaction.java          ← Documento MongoDB (audit log)
│   ├── Policy.java               ← Documento MongoDB (reglas DLP)
│   ├── User.java                 ← Documento MongoDB
│   └── TokenBlacklist.java       ← TTL index para tokens revocados
├── repository/
│   ├── InteractionRepository.java
│   ├── InteractionRepositoryImpl.java ← MongoTemplate (filtros dinámicos + agregaciones)
│   └── PolicyRepository.java
├── security/
│   ├── JwtTokenProvider.java     ← Genera/valida tokens RS256
│   └── JwtAuthenticationFilter.java ← Intercepta cada request
└── integration/
    └── LlmService.java           ← Llama a Ollama (OpenAI-compatible API)
```

---

## 3. API REST — Endpoints

### Autenticación
```
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
```

**Login — request:**
```json
{ "email": "admin@datashield.ai", "password": "Admin@123!" }
```
**Login — response:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "tokenType": "Bearer",
  "expiresIn": 900000
}
```

Todos los demás endpoints requieren header:
```
Authorization: Bearer <accessToken>
```

---

### Chat (empleados y admins)
```
POST /api/v1/chat/prompt
GET  /api/v1/chat/history?page=0&size=20
```

**POST /chat/prompt — request:**
```json
{
  "prompt": "mi email es test@gmail.com y mi DNI es 12345678",
  "conversationId": "uuid-del-cliente"
}
```
**Response:**
```json
{
  "sanitizedPrompt": "mi email es [REDACTED_EMAIL] y mi DNI es [REDACTED_DNI]",
  "blocked": false,
  "detectedPatterns": ["EMAIL", "DNI"],
  "llmResponse": "Hola, ¿en qué puedo ayudarte?",
  "latencyMs": 14
}
```

---

### Auditoría (solo ADMIN)
```
GET /api/v1/audit?page=0&size=20&userId=X&blocked=true&keyword=X
GET /api/v1/audit/stats
GET /api/v1/audit/export?format=csv
GET /api/v1/audit/{id}
```

**Stats — response:**
```json
{
  "totalInteractions": 42,
  "blockedCount": 7,
  "blockRate": "16.67%",
  "avgLatency": 12,
  "topPatterns": [
    { "pattern": "EMAIL", "count": 10 },
    { "pattern": "CREDIT_CARD", "count": 4 }
  ]
}
```

---

### Políticas DLP (solo ADMIN)
```
GET    /api/v1/policies
POST   /api/v1/policies
PUT    /api/v1/policies/{id}
DELETE /api/v1/policies/{id}
GET    /api/v1/policies/llm-config
PUT    /api/v1/policies/llm-config
```

---

### Usuarios (solo ADMIN)
```
GET    /api/v1/users
POST   /api/v1/users
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}
```

---

## 4. MongoDB — Colecciones

```
datashield (base de datos)
├── interactions    ← audit log (append-only, inmutable)
├── policies        ← reglas DLP con patrones regex
├── users           ← credenciales + roles
├── token_blacklist ← tokens revocados (TTL index = auto-expiry)
├── llm_configs     ← configuración Ollama (singleton)
└── notification_configs ← reglas de alerta email
```

**Documento `interactions` (ejemplo real):**
```json
{
  "_id": "6a1265c2...",
  "userId": "employee@datashield.ai",
  "conversationId": "b1e9f751-...",
  "originalPromptHash": "sha256:a3f9...",
  "sanitizedPrompt": "mi tarjeta es [REDACTED_CREDIT_CARD]",
  "blocked": true,
  "blockedReasons": ["CREDIT_CARD_DETECTED"],
  "detectedPatterns": ["CREDIT_CARD"],
  "processingTimeMs": 6,
  "timestamp": "2026-05-24T02:43:14.664Z",
  "ipAddress": "127.0.0.1"
}
```

Índices compuestos definidos en `Interaction.java`:
```java
@CompoundIndex(name = "user_timestamp_idx", def = "{'userId': 1, 'timestamp': -1}")
@CompoundIndex(name = "blocked_timestamp_idx", def = "{'blocked': 1, 'timestamp': -1}")
```

Ver datos en MongoDB directamente:
```bash
mongosh "mongodb://localhost:27017/datashield"
db.interactions.find().limit(5).pretty()
db.policies.findOne()
db.users.find({}, {email:1, roles:1})
```

---

## 5. Motor DLP — SanitizationService

Flujo al recibir un prompt:

```
1. Cargar política activa de MongoDB
2. Por cada RegexPattern habilitado:
   a. Compilar regex (o leer del cache Caffeine)
   b. Buscar matches en el prompt
   c. Según la acción:
      - MASK  → reemplazar con [REDACTED_NOMBRE]
      - BLOCK → marcar como bloqueado
      - WARN  → loguear sin modificar
3. Si blocked=true → no llama al LLM
4. Si blocked=false → enviar prompt sanitizado a Ollama
5. Guardar Interaction en MongoDB
```

Patrones por defecto (sembrados por `DataInitializer`):

| Nombre | Ejemplo que detecta | Acción |
|--------|-------------------|--------|
| EMAIL | `test@gmail.com` | MASK |
| CREDIT_CARD | `4111-1111-1111-1111` | BLOCK |
| DNI | `12345678` o `12345678Z` | MASK |
| PHONE | `+34 612 345 678` | MASK |
| IP_ADDRESS | `192.168.1.1` | MASK |
| CREDENTIAL | `api_key=abc123` | BLOCK |

---

## 6. Seguridad — JWT RS256

- Se genera un par de claves RSA al arrancar (modo dev)
- El `accessToken` dura **15 minutos**
- El `refreshToken` dura **7 días**
- Al hacer logout, el token se guarda en `token_blacklist` con TTL index → MongoDB lo borra solo al expirar

```java
// JwtAuthenticationFilter — revisa cada request
String jwt = extractToken(request);
if (tokenBlacklistService.isRevoked(jwt)) {
    response.sendError(401, "Token revoked");
    return;
}
```

RBAC definido en `SecurityConfig.java`:
```java
.requestMatchers("/api/v1/chat/**").hasAnyRole("EMPLOYEE", "ADMIN")
.requestMatchers("/api/v1/audit/**").hasRole("ADMIN")
.requestMatchers("/api/v1/policies/**").hasRole("ADMIN")
.requestMatchers("/api/v1/users/**").hasRole("ADMIN")
```

---

## 7. Swagger UI

Con el backend corriendo, abrir:
```
http://localhost:8080/swagger-ui/index.html
```

1. Hacer login con el endpoint `/auth/login`
2. Copiar el `accessToken`
3. Clic en "Authorize" (candado arriba a la derecha)
4. Pegar `Bearer <token>`
5. Explorar y ejecutar cualquier endpoint directamente

---

## 8. Demo en vivo — secuencia recomendada

### Como Empleado
1. Login con `employee@datashield.ai / Admin@123!`
2. Ir a **Chat**
3. Enviar: `Hola, ¿cómo estás?` → respuesta normal del LLM
4. Enviar: `mi email es test@gmail.com y mi DNI es 12345678`
   - Ver badges `EMAIL` y `DNI` bajo el mensaje
   - Ver "Sent as: mi email es [REDACTED_EMAIL] y mi DNI es [REDACTED_DNI]"
5. Enviar: `mi tarjeta es 4111111111111111`
   - Ver banner rojo "Prompt blocked" → no llega al LLM

### Como Admin
1. Logout → Login con `admin@datashield.ai / Admin@123!`
2. **Dashboard** → KPIs + gráfico de barras + donut de patrones detectados
3. **Audit** → tabla con todos los logs
   - Filtrar por fecha o keyword
   - Clic en el ícono de documento → modal con detalle
   - Botón **Export CSV** → descarga archivo
4. **Policies** → ver/editar las reglas DLP en vivo

---

## 9. Logs en tiempo real

```bash
tail -f /tmp/datashield-backend.log
```

Cada request muestra:
```
Prompt processed for user=employee@datashield.ai: blocked=false, latency=14ms
CSV export by=admin@datashield.ai records=15 filters=userId:null,blocked:null
```

---

## 10. Resumen de archivos clave

| Archivo | Por qué es importante |
|---------|----------------------|
| `SanitizationService.java` | Motor central DLP — regex + cache + métricas |
| `PromptController.java` | Orquesta sanitización → LLM → audit log |
| `SecurityConfig.java` | RBAC completo + JWT filter chain |
| `Interaction.java` | Modelo MongoDB con índices y GDPR compliance |
| `InteractionRepositoryImpl.java` | MongoTemplate con filtros dinámicos + agregaciones |
| `DataInitializer.java` | Siembra usuarios y política por defecto al arrancar |
| `LlmService.java` | Integración Ollama con circuit breaker Resilience4j |
| `run.sh` | Script de arranque inteligente (detecta MongoDB del host) |
