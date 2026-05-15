# 🛡️ DataShield AI - Prompt de Desarrollo Completo (v2.0)

## 🎯 CONTEXTO DEL PROYECTO
Estás desarrollando **DataShield AI**, un middleware de sanitización DLP (Data Loss Prevention) que actúa como capa de seguridad entre empleados y APIs de LLM (OpenAI, etc.).

**Stack Técnico Obligatorio:**
- Java 17 + Spring Boot 3.2+
- MongoDB 6.0+ con Spring Data MongoDB (índices optimizados para agregaciones)
- Spring Security + JWT + RBAC + OIDC/LDAP ready
- REST API con validación Bean Validation
- OpenFeign o RestTemplate para integración LLM con fallback
- BCrypt (cost≥12) o Argon2id para hashing de contraseñas
- Regex engine optimizado + Caffeine cache para sanitización (<200ms)
- Lombok, MapStruct (opcional), JUnit 5 + Mockito + Testcontainers para tests
- Resilience4j para circuit breaker y reintentos

## 🔐 REQUISITOS DE SEGURIDAD CRÍTICOS (RNF004-RNF006)
1. **Sanitización síncrona previa al LLM** (RNF005): Nunca se almacena ni transmite texto crudo con datos sensibles detectados
2. **Regex para detectar**: emails, tarjetas de crédito (validación Luhn), DNI, teléfonos, patrones custom
3. **Tiempo máximo de sanitización**: <200ms (usar cache de patrones compilados + profiling)
4. **Autenticación**: JWT con algoritmo **RS256** + refresh tokens + soporte OIDC/LDAP para integración corporativa
5. **RBAC estricto**: Roles `ROLE_EMPLOYEE` y `ROLE_ADMIN` con validación en CADA endpoint (RNF004)
6. **Logging de auditoría inmutable** (RNF009): cada interacción se guarda con usuario, timestamp, prompt original (hash SHA-256), prompt sanitizado, decisión, IP, user-agent
7. **OWASP Top 10 mitigation** (RNF006): protección específica contra Prompt Injection, XSS en renderizado, SQL/NoSQL injection. CSRF protection habilitado.
8. **HTTPS/TLS 1.3** en producción, HTTP/2, headers de seguridad (CORS, CSP, HSTS, X-Content-Type-Options)
9. **Rate limiting**: 30 requests/minuto por IP (implementar con bucket4j o similar)
10. **Cumplimiento GDPR** y normativas locales de protección de datos

## ⚡ REQUISITOS DE RENDIMIENTO (RNF001-RNF002, EC-001-EC-002)
| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Latencia total (sanitización + LLM) | **< 3 segundos** para 95% de requests | Percentil 95 en logs de performance |
| Sanitización pura | **< 200ms** para 99% de prompts | @Around con PerformanceMonitor |
| Dashboard de auditoría (50k registros + 3 filtros) | **< 1.5-2 segundos** render | Frontend Performance API + backend query time |
| Concurrencia soportada | **>100 usuarios simultáneos** sin degradación | Load testing con Gatling/JMeter |
| Disponibilidad | **99.5%** en horario laboral | Uptime monitoring + health checks |

## 🎯 OBJETIVOS DE NEGOCIO (contexto para decisiones de diseño)
| ID | Objetivo | Plazo | Métrica de éxito |
|----|----------|-------|-----------------|
| OBJ-01 | Prevenir fugas de datos sensibles en interacciones LLM mediante sanitización automática | 3 meses | 95% reducción de exposición accidental |
| OBJ-02 | Auditoría de seguridad centralizada en dashboard unificado | 4 meses | 70% más rápido en investigación de incidentes |
| OBJ-03 | Habilitar uso de IA sin interrumpir flujo de trabajo | 3 meses | 40% mejora de productividad |
| OBJ-04 | Trazabilidad completa para cumplimiento de privacidad | Inmediato | 100% cobertura para evitar penalizaciones por manejo de datos |

## 🌐 ENDPOINTS REST (v1) - Con validación RBAC
```
POST   /api/v1/auth/login          → {email, password} → {accessToken, refreshToken} [PUBLIC]
POST   /api/v1/auth/refresh        → {refreshToken} → {accessToken} [PUBLIC]
POST   /api/v1/prompt              → {prompt} → {sanitizedPrompt, blocked: boolean, reasons: [], latencyMs} [ROLE_EMPLOYEE]
GET    /api/v1/audit               → Page<Interaction> con filtros [ROLE_ADMIN]
GET    /api/v1/audit/{id}          → Interaction detail [ROLE_ADMIN]
GET    /api/v1/audit/stats         → {totalInteractions, blockedCount, avgLatency} [ROLE_ADMIN]
GET    /api/v1/policies            → List<Policy> [ROLE_ADMIN]
POST   /api/v1/policies            → Create policy [ROLE_ADMIN]
PUT    /api/v1/policies/{id}       → Update policy (zero-downtime) [ROLE_ADMIN]
DELETE /api/v1/policies/{id}       → Delete policy [ROLE_ADMIN]
GET    /api/v1/users               → Page<User> [ROLE_ADMIN]
POST   /api/v1/notifications/test  → Send test email [ROLE_ADMIN]
GET    /api/v1/health              → {status: "UP", db: "UP", llm: "UP"} [PUBLIC]
```

## 🖥️ PANTALLAS FRONTEND (5 vistas requeridas)
1. **Login** — autenticación unificada (Employee y Admin comparten pantalla)
2. **Chat** (ROLE_EMPLOYEE) — interfaz conversacional con LLM; la sanitización es transparente al usuario
3. **Audit Panel** (ROLE_ADMIN) — tabla de interacciones con filtros por fecha, tipo de dato, usuario, keyword; exportación PDF
4. **Policy Config** (ROLE_ADMIN) — CRUD de patrones DLP con test en vivo
5. **Dashboard / Reports** (ROLE_ADMIN) — analytics: total detecciones, tasa de bloqueo, patrones más activados

**UI/UX**: estética moderna con azules profundos e iconografía de escudo; resolución mínima 1024×768; WCAG 2.1 AA obligatorio.

## 📦 MODELOS DE DATOS (MongoDB Collections) - Con índices

### User
```json
{
  "_id": "ObjectId",
  "email": "String (unique, indexed, lowercase)",
  "passwordHash": "String (BCrypt/Argon2id, cost≥12)",
  "roles": ["ROLE_EMPLOYEE", "ROLE_ADMIN"],
  "externalId": "String (optional, para LDAP/OIDC)",
  "createdAt": "Instant (indexed)",
  "lastLogin": "Instant",
  "active": "boolean (indexed)"
}
```

### Policy
```json
{
  "_id": "ObjectId",
  "name": "String (indexed)",
  "description": "String",
  "regexPatterns": [
    {
      "name": "String",
      "pattern": "String (validado)",
      "action": "BLOCK|MASK|WARN",
      "priority": "int",
      "enabled": "boolean",
      "falsePositiveRate": "double (monitoreado)"
    }
  ],
  "enabled": "boolean (indexed)",
  "createdAt": "Instant",
  "updatedAt": "Instant (indexed)",
  "createdBy": "UserId"
}
```

### Interaction (Audit Log - INMUTABLE, append-only)
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: User, indexed)",
  "originalPromptHash": "String (SHA-256, indexed)",
  "sanitizedPrompt": "String",
  "llmResponse": "String (optional, masked if contains PII)",
  "blocked": "boolean (indexed)",
  "blockedReasons": ["String"],
  "processingTimeMs": "int",
  "timestamp": "Instant (indexed, TTL opcional)",
  "ipAddress": "String",
  "userAgent": "String",
  "policyVersion": "String"
}
// Índices compuestos recomendados:
// { userId: 1, timestamp: -1 }, { blocked: 1, timestamp: -1 }, { originalPromptHash: 1 }
```

## ⚙️ SERVICIO DE SANITIZACIÓN (Core Business - RNF001, RNF005)
```java
public interface SanitizationService {
    /**
     * Sanitiza un prompt aplicando patrones regex de una política.
     * @param prompt texto original del usuario
     * @param policy política de sanitización activa
     * @return resultado con prompt sanitizado, coincidencias, decisión y métricas
     * @throws SanitizationException si el procesamiento excede 200ms (configurable)
     */
    SanitizationResult sanitize(String prompt, Policy policy);
    
    // Requisitos NO FUNCIONALES:
    // - Usar patrones regex precompilados + cache L1/L2 (Caffeine)
    // - Cumplir <200ms en el 99% de casos (monitorear con micrometer)
    // - Ser thread-safe, stateless y sin efectos secundarios
    // - Registrar métricas: hits/misses de cache, tiempo por patrón, tasa de falsos positivos
    // - Nunca lanzar excepciones no controladas; usar Result/Either pattern
}
```

## 🧪 CRITERIOS DE ACEPTACIÓN TÉCNICOS (Sprint 1 - Medibles)
- [ ] Proyecto Spring Boot compila, corre en puerto 8080 y pasa `mvn verify`
- [ ] Conexión a MongoDB configurada (docker-compose o Testcontainers)
- [ ] Endpoint POST /api/v1/prompt:
  - ✅ Detecta y bloquea: email, tarjeta (Luhn), DNI, teléfono
  - ✅ Retorna `{blocked: true, reasons: [...]}` en <3s total (mock LLM)
  - ✅ Guarda auditoría inmutable en MongoDB
- [ ] JWT auth funcional: login → token → acceso protegido → refresh
- [ ] RBAC: usuario con ROLE_EMPLOYEE recibe 403 en `/api/v1/admin/*`
- [ ] SanitizationServiceTest:
  - ✅ Cobertura >85% en lógica de regex
  - ✅ Test de performance: 95% de ejecuciones <200ms (con JMH o similar)
  - ✅ Test de falsos positivos: código legítimo NO es bloqueado
- [ ] Health endpoint: `/api/v1/health` retorna estado de dependencias
- [ ] Logs estructurados (JSON) con correlation ID para trazabilidad

## 🚫 LO QUE NO DEBES HACER (Restricciones de Negocio y Tecnología)
- ❌ No hardcodear secrets (usar application.yml + environment variables + Vault ready)
- ❌ No loggear prompts originales completos (usar hash SHA-256 + masking)
- ❌ No bloquear el hilo principal con I/O (usar @Async, WebFlux o virtual threads si es necesario)
- ❌ No ignorar la restricción de 200ms (perf tests obligatorios en CI)
- ❌ No permitir falsos positivos que bloqueen código legítimo (validar con tests de regresión)
- ❌ No actualizar políticas con downtime (usar hot-reload o feature flags)
- ❌ No usar TLS <1.2 en comunicaciones externas (LLM API, SMTP, OAuth)

## 📧 NOTIFICACIONES (RNF requerido)
- SMTP con **STARTTLS** para alertas de detección de datos sensibles
- Templates HTML con **Thymeleaf**
- Endpoint `POST /api/v1/notifications/test` para validar configuración SMTP
- Alerta automática al admin cuando se bloquea un prompt

## 🔌 INTEGRACIÓN LLM
- Provider configurable vía `application.yml` (default: OpenAI)
- **Mock LLM service obligatorio** para ambiente de testing/dev (no gastar tokens en tests)
- Soporte opcional **WebSocket** (`wss://`) para streaming de respuestas LLM en tiempo real
- OpenFeign con Resilience4j circuit breaker para llamadas externas

## 🌍 INTEGRACIÓN CORPORATIVA (Restricción de Negocio)
- El sistema debe ser compatible con LDAP/Active Directory/OIDC para autenticación
- Implementar `AuthenticationProvider` configurable que soporte:
  - Modo local (BD interna) para desarrollo/testing
  - Modo OIDC (Keycloak, Azure AD, Okta) para producción
- Mapeo de grupos externos → roles internos (`ROLE_EMPLOYEE`, `ROLE_ADMIN`)

## ♿ ACCESIBILIDAD Y USABILIDAD (RNF007, EC-005-EC-006)
- Frontend debe cumplir **WCAG 2.1 AA**: contraste, navegación por teclado, ARIA labels
- Flujos críticos (enviar prompt, revisar auditoría) deben requerir **máximo 3 clics**
- Feedback visual inmediato: estados de carga, errores claros, confirmaciones de acción
- Tasa de error de UI <2% (medir con analytics o tests de usabilidad)

## 🔄 RESILIENCIA Y DISPONIBILIDAD (RNF008, EC-007-EC-008)
- Implementar circuit breaker (Resilience4j) para llamadas al LLM:
  - Fallback: respuesta segura tipo "Servicio de IA no disponible, intenta más tarde"
  - Reintentos exponenciales con jitter para errores transitorios (503, timeout)
- Cola de tareas (in-memory o Redis) para prompts en espera si el LLM está caído
- Zero pérdida de prompts: persistir en BD antes de enviar al LLM
- Graceful degradation: si MongoDB está lento, permitir lectura de cache de políticas

## 📤 FORMATO DE RESPUESTA ESPERADO
1. **Estructura de proyecto completa** (árbol de archivos con rutas relativas)
2. **Código de cada archivo clave** con comentarios Javadoc y anotaciones de rendimiento
3. **Configuraciones**: application.yml (dev/prod), Dockerfile multi-stage, docker-compose.yml, .github/workflows/ci.yml
4. **Tests de ejemplo** para el servicio crítico (SanitizationServiceTest con JMH para performance)
5. **Instrucciones de ejecución**: `./mvnw spring-boot:run`, variables de entorno en .env.example, comandos de docker
6. **Métricas de validación**: cómo medir <200ms, <3s, cobertura de tests, tasa de falsos positivos

