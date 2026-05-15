# 🛡️ DataShield AI - DLP Middleware for LLM APIs

[![Java 17](https://img.shields.io/badge/Java-17-blue.svg)](https://openjdk.java.net/)
[![Spring Boot 3.2](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![MongoDB 6.0](https://img.shields.io/badge/MongoDB-6.0-green.svg)](https://www.mongodb.com/)

Middleware de sanitización DLP (Data Loss Prevention) que actúa como capa de seguridad entre empleados y APIs de LLM (OpenAI, etc.).

## 🚀 Características Principales

- **Sanitización en tiempo real** (<200ms) de prompts antes de enviar al LLM
- **Detección de datos sensibles**: emails, tarjetas de crédito (Luhn), DNI, teléfonos, patrones custom
- **Autenticación JWT** con RS256 + refresh tokens + soporte OIDC/LDAP
- **RBAC estricto**: Roles `ROLE_EMPLOYEE` y `ROLE_ADMIN`
- **Auditoría inmutable** de todas las interacciones
- **Circuit breaker** para integración LLM con Resilience4j
- **Dashboard de auditoría** con filtros y exportación
- **Notificaciones email** para alertas de seguridad

## 📋 Requisitos

- Java 17+
- Maven 3.8+
- MongoDB 6.0+
- Docker & Docker Compose (opcional, para desarrollo)

## 🔧 Configuración Rápida

### 1. Clonar y configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

### 2. Iniciar MongoDB con Docker

```bash
docker-compose up mongodb mongo-express
```

### 3. Ejecutar la aplicación

```bash
./mvnw spring-boot:run
```

La API estará disponible en `http://localhost:8080`

## 📡 Endpoints REST (v1)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/login` | Login | Público |
| POST | `/api/v1/auth/refresh` | Refresh token | Público |
| POST | `/api/v1/prompt` | Enviar prompt para sanitización | EMPLOYEE |
| GET | `/api/v1/audit` | Listar logs de auditoría | ADMIN |
| GET | `/api/v1/audit/{id}` | Detalle de interacción | ADMIN |
| GET | `/api/v1/audit/stats` | Estadísticas de auditoría | ADMIN |
| GET | `/api/v1/policies` | Listar políticas DLP | ADMIN |
| POST | `/api/v1/policies` | Crear política | ADMIN |
| PUT | `/api/v1/policies/{id}` | Actualizar política | ADMIN |
| DELETE | `/api/v1/policies/{id}` | Eliminar política | ADMIN |
| GET | `/api/v1/users` | Listar usuarios | ADMIN |
| POST | `/api/v1/notifications/test` | Enviar email de test | ADMIN |
| GET | `/api/v1/health` | Health check | Público |

## 🧪 Ejecutar Tests

```bash
./mvnw verify
```

## 📊 Métricas de Rendimiento

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Latencia sanitización | <200ms (99%) | Timer en SanitizationService |
| Latencia total (sanitización + LLM) | <3s (95%) | PromptController |
| Dashboard (50k registros + 3 filtros) | <2s | Query optimizada con índices |
| Concurrencia soportada | >100 usuarios | Load testing con Gatling |

## 🔐 Seguridad

- BCrypt con cost≥12 para hashing de contraseñas
- JWT con algoritmo RS256
- HTTPS/TLS 1.3 en producción
- Headers de seguridad (CORS, CSP, HSTS)
- Rate limiting: 30 requests/minuto por IP
- Logging sin datos sensibles (hash SHA-256)

## 🏗️ Arquitectura

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Empleado   │────▶│  DataShield AI   │────▶│   LLM API   │
│  (Browser)  │     │  (Sanitización)  │     │  (OpenAI)   │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  MongoDB    │
                    │  (Audit)    │
                    └─────────────┘
```

## 📁 Estructura del Proyecto

```
src/main/java/com/datashield/ai/
├── config/          # Configuración de seguridad, cache, etc.
├── controller/      # Controladores REST
├── dto/             # Objetos de transferencia de datos
├── exception/       # Excepciones personalizadas
├── integration/     # Integración con LLM y servicios externos
├── model/           # Entidades de MongoDB
├── repository/      # Repositorios de datos
├── security/        # JWT, UserDetailsService, filtros
└── service/         # Lógica de negocio (sanitización, políticas)
```

## 🎯 Próximos Pasos

- [ ] Implementar integración real con OpenAI
- [ ] Frontend React/Vue para las 5 vistas requeridas
- [ ] Servicio de notificaciones email con Spring Mail
- [ ] Servicio de gestión de usuarios completo
- [ ] WebSocket para streaming de respuestas LLM
- [ ] CI/CD con GitHub Actions
- [ ] Documentación OpenAPI/Swagger

## 📄 Licencia

MIT License - ver LICENSE para detalles.

---

**DataShield AI** - Previniendo fugas de datos en interacciones con IA.
