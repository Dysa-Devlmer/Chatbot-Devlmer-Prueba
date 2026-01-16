# E2E Testing Suite - Phase 2 Step 2

Esta carpeta contiene la suite completa de pruebas End-to-End para validar la implementación de Phase 2 Step 2 del chatbot PITHY.

## 📁 Estructura

```
e2e/
├─ fixtures/              # Archivos de datos de prueba
│  ├─ valid-webhook-payload.json
│  ├─ invalid-hmac-payload.json
│  ├─ audio-message-payload.json
│  └─ rate-limit-payloads.json
├─ helpers/               # Funciones auxiliares para pruebas
│  ├─ webhook.ts         # Generación de requests y HMAC
│  ├─ database.ts        # Consultas a la base de datos
│  └─ logging.ts         # Validación de logs
├─ scenarios/             # Pruebas E2E organizadas por escenario
│  ├─ 01-valid-text-flow.e2e.ts
│  ├─ 02-audio-flow.e2e.ts
│  ├─ 03-hmac-validation.e2e.ts
│  ├─ 04-rate-limiting.e2e.ts
│  ├─ 05-error-handling.e2e.ts
│  ├─ 06-complete-integration.e2e.ts
│  ├─ 07-payload-malformed.e2e.ts
│  ├─ 08-dashboard-updates.e2e.ts
│  ├─ 09-command-special.e2e.ts
│  └─ 10-manual-mode.e2e.ts
└─ README.md             # Documentación (este archivo)
```

## 🧪 Escenarios de Prueba

### 1. Flujo Válido de Texto (`01-valid-text-flow.e2e.ts`)
- Procesamiento completo de mensajes de texto
- Validación de HMAC y rate limiting
- Persistencia en base de datos
- Generación de respuesta de IA

### 2. Flujo de Audio (`02-audio-flow.e2e.ts`)
- Procesamiento de mensajes de audio
- Transcripción con Whisper
- Procesamiento con IA
- Generación de respuesta TTS

### 3. Validación HMAC (`03-hmac-validation.e2e.ts`)
- Rechazo de solicitudes con HMAC inválido
- Aceptación de solicitudes con HMAC válido
- Registro de intentos de seguridad

### 4. Rate Limiting (`04-rate-limiting.e2e.ts`)
- Aceptación de solicitudes dentro del límite
- Rechazo de solicitudes que exceden el límite
- Bloqueos temporales de 15 minutos
- Auto-limpieza cada 5 minutos

### 5. Manejo de Errores (`05-error-handling.e2e.ts`)
- Fallback de Perplexity a Claude
- Respuesta genérica cuando fallan todas las IAs
- Manejo de errores de transcripción y TTS
- Degradación elegante

### 6. Integración Completa (`06-complete-integration.e2e.ts`)
- Validación de timeout de sesión (24 horas)
- Cierre de conversaciones antiguas
- Creación de nuevas conversaciones
- Actualización de timestamps

### 7. Payload Malformado (`07-payload-malformed.e2e.ts`)
- Rechazo de payloads sin campos requeridos
- Manejo de tipos de datos incorrectos
- Prevención de crashes por payloads maliciosos

### 8. Actualizaciones de Dashboard (`08-dashboard-updates.e2e.ts`)
- Actualización del estado del sistema
- Reflejo del proveedor de IA actual
- Actualización de métricas de rendimiento

### 9. Comandos Especiales (`09-command-special.e2e.ts`)
- Reconocimiento de comandos que empiezan con "/"
- Ejecución de acciones específicas
- Respuesta a comandos sin procesamiento de IA

### 10. Modo Manual (`10-manual-mode.e2e.ts`)
- Procesamiento sin IA automática
- Registro de mensajes sin respuesta automática
- Manejo de modo manual en conversaciones

## 🚀 Cómo Ejecutar las Pruebas

### Ejecutar todas las pruebas E2E:
```bash
npm run test:e2e
```

### Ejecutar un escenario específico:
```bash
npm run test:e2e -- --testPathPattern="01-valid-text-flow"
```

### Ejecutar con cobertura:
```bash
npm run test:e2e -- --coverage
```

### Ejecutar en modo watch:
```bash
npm run test:e2e -- --watch
```

## 📊 Métricas de Calidad

- **Cobertura de código**: Objetivo >85% en servicios críticos
- **Tiempo de respuesta**: <5 segundos en el 99% de los casos
- **Disponibilidad**: Todas las pruebas deben pasar
- **Seguridad**: Validación HMAC y rate limiting funcionando

## 🔧 Configuración Requerida

Asegúrate de tener las siguientes variables de entorno configuradas:

```env
WHATSAPP_WEBHOOK_SECRET=your_test_secret
WHATSAPP_TOKEN=your_test_token
WHATSAPP_PHONE_NUMBER_ID=your_test_phone_number_id
WHATSAPP_WEBHOOK_TOKEN=your_test_webhook_token
WHATSAPP_APP_SECRET=your_test_app_secret
```

## 🤝 Contribución

Cuando se agreguen nuevas funcionalidades:

1. Crear un nuevo archivo de escenario en `scenarios/`
2. Seguir el patrón de nomenclatura: `NN-descripcion.e2e.ts`
3. Incluir validaciones para todos los aspectos críticos
4. Asegurar que las pruebas pasen localmente antes de commitear

## 📞 Soporte

Para consultas sobre las pruebas E2E, contactar al equipo QA o referirse a la documentación de Phase 2 Step 2.