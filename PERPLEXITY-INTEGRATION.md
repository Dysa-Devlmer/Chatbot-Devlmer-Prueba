# Integración de Perplexity AI en PITHY Chatbot

## Descripción

Esta documentación explica cómo se ha integrado la API de Perplexity AI en el sistema PITHY Chatbot, permitiendo a los usuarios alternar entre Ollama (modelo local) y Perplexity (modelo en la nube) como proveedores de inteligencia artificial.

## Características

- **Selección de proveedor de IA**: El sistema permite elegir entre Ollama (local) y Perplexity (en la nube)
- **Configuración flexible**: Parámetros configurables para ambos proveedores
- **Fallback automático**: Si Perplexity falla, el sistema se revierte automáticamente a Ollama
- **Interfaz de administración**: Configuración accesible desde el panel de administración
- **Compatibilidad con RAG**: El sistema de recuperación aumentada de contexto funciona con ambos proveedores

## Configuración

### Variables de entorno

Agregue la siguiente variable de entorno a su archivo `.env.local`:

```
PERPLEXITY_API_KEY=su_api_key_aqui
```

### Desde el panel de administración

1. Acceda al panel de administración en `/admin`
2. Vaya a la pestaña "IA" en la sección de configuración
3. Seleccione "Perplexity AI" como proveedor de IA
4. Ingrese su API Key de Perplexity
5. Configure los parámetros adicionales:
   - Modelo (por defecto: `llama-3.1-sonar-large-128k-chat`)
   - Temperatura (por defecto: `0.7`)
   - Máximo de tokens (por defecto: `1024`)

## Funcionamiento interno

### Selección de proveedor

El sistema determina qué proveedor de IA usar mediante la siguiente lógica:

1. Consulta la configuración `ai_provider` en la base de datos
2. Si está configurado como `perplexity`, verifica que la API key sea válida
3. Si la API key es válida, usa Perplexity
4. Si no está configurado como `perplexity` o la API key no es válida, usa Ollama

### Procesamiento de mensajes

Cuando un mensaje necesita procesamiento de IA:

1. El sistema determina qué proveedor usar según la configuración
2. Formatea el mensaje y el contexto según las especificaciones del proveedor
3. Envía la solicitud al proveedor seleccionado
4. Si Perplexity falla, el sistema se revierte automáticamente a Ollama
5. Procesa y devuelve la respuesta

## API de Perplexity

La integración utiliza la API de chat de Perplexity:

- **Endpoint**: `https://api.perplexity.ai/chat/completions`
- **Método**: POST
- **Headers**: 
  - `Authorization: Bearer {api_key}`
  - `Content-Type: application/json`

### Parámetros soportados

- `model`: El modelo de IA a usar
- `messages`: Array de mensajes de conversación
- `temperature`: Aleatoriedad de la respuesta (0.0 - 2.0)
- `max_tokens`: Máximo número de tokens en la respuesta

## Beneficios de usar Perplexity

- **Respuestas más precisas**: Modelos de vanguardia entrenados con datos recientes
- **Capacidad de razonamiento**: Mejor comprensión del contexto y razonamiento lógico
- **Menor latencia**: Procesamiento en servidores optimizados
- **Soporte multilingüe**: Excelente rendimiento en múltiples idiomas
- **Acceso a conocimientos recientes**: Datos de entrenamiento más actualizados

## Comparación con Ollama

| Característica | Ollama (Local) | Perplexity (Nube) |
|----------------|----------------|-------------------|
| Costo | Gratuito | Pago por uso |
| Privacidad | Máxima | Depende de la API |
| Latencia | Variable | Generalmente menor |
| Conocimiento | Limitado por modelo | Actualizado regularmente |
| Dependencia de internet | No | Sí |

## Solución de problemas

### Problemas comunes

1. **"API key no válida"**: Verifique que haya ingresado correctamente su API key de Perplexity
2. **Errores de conexión**: Asegúrese de tener conexión a internet cuando use Perplexity
3. **Respuestas lentas**: Puede deberse a congestión en la API de Perplexity o limitaciones de tasa

### Verificación de estado

Puede verificar el estado de la conexión a Perplexity usando:

```typescript
import { PerplexityService } from './src/lib/perplexity';

const status = await PerplexityService.checkConnection();
console.log(status);
```

## Seguridad

- Las API keys se almacenan en la base de datos de forma segura
- Las API keys no se exponen en el cliente
- Se aplican prácticas de seguridad estándar para proteger las credenciales

## Consideraciones de uso

- **Costos**: El uso de Perplexity implica costos asociados a la API
- **Límites de tasa**: La API de Perplexity puede tener límites de tasa
- **Fiabilidad**: Depende de la disponibilidad del servicio de Perplexity

## Migración

Para migrar de Ollama a Perplexity:

1. Obtenga una API key válida de Perplexity
2. Actualice la configuración en el panel de administración
3. Pruebe la funcionalidad antes de cambiar completamente
4. Monitoree el rendimiento y los costos

## Recursos adicionales

- [Documentación oficial de Perplexity API](https://docs.perplexity.ai/)
- [Sitio web de Perplexity](https://www.perplexity.ai/)
- [Precios de la API](https://docs.perplexity.ai/docs/pricing)

---
**Nota**: Esta integración mantiene la compatibilidad con el sistema existente, permitiendo a los usuarios elegir el proveedor de IA que mejor se adapte a sus necesidades.