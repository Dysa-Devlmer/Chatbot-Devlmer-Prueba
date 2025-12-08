import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';

/**
 * Sistema de cache para audio (TTS y transcripciones)
 * Evita regenerar/retranscribir contenido repetido
 */

interface CacheEntry {
  hash: string;
  result: string;
  timestamp: number;
}

// Cache en memoria para transcripciones (expira en 1 hora)
const transcriptionCache = new Map<string, { text: string; timestamp: number }>();
const TRANSCRIPTION_CACHE_TTL = 60 * 60 * 1000; // 1 hora

// Directorio para cache de TTS
const TTS_CACHE_DIR = path.join(os.tmpdir(), 'pithy-tts-cache');

// Asegurar que el directorio de cache existe
if (!fs.existsSync(TTS_CACHE_DIR)) {
  fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });
}

/**
 * Genera un hash MD5 del contenido
 */
function generateHash(content: string | Buffer): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Cache para transcripciones de audio
 */
export class TranscriptionCache {
  /**
   * Genera hash de un archivo de audio
   */
  static getAudioHash(audioPath: string): string {
    const buffer = fs.readFileSync(audioPath);
    return generateHash(buffer);
  }

  /**
   * Busca transcripción en cache
   */
  static get(audioPath: string): string | null {
    const hash = this.getAudioHash(audioPath);
    const cached = transcriptionCache.get(hash);

    if (cached) {
      // Verificar si no ha expirado
      if (Date.now() - cached.timestamp < TRANSCRIPTION_CACHE_TTL) {
        console.log(`📦 Cache HIT: Transcripción encontrada en cache`);
        return cached.text;
      } else {
        // Expirado, eliminar
        transcriptionCache.delete(hash);
      }
    }

    console.log(`📦 Cache MISS: Transcripción no encontrada`);
    return null;
  }

  /**
   * Guarda transcripción en cache
   */
  static set(audioPath: string, text: string): void {
    const hash = this.getAudioHash(audioPath);
    transcriptionCache.set(hash, {
      text,
      timestamp: Date.now(),
    });
    console.log(`📦 Cache SET: Transcripción guardada (${transcriptionCache.size} entradas)`);
  }

  /**
   * Limpia entradas expiradas
   */
  static cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [hash, entry] of transcriptionCache.entries()) {
      if (now - entry.timestamp > TRANSCRIPTION_CACHE_TTL) {
        transcriptionCache.delete(hash);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🗑️ Cache cleanup: ${cleaned} transcripciones expiradas eliminadas`);
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  static getStats(): { size: number; entries: number } {
    return {
      size: transcriptionCache.size,
      entries: transcriptionCache.size,
    };
  }
}

/**
 * Cache para TTS (Text-to-Speech)
 */
export class TTSCache {
  /**
   * Genera hash del texto para TTS
   */
  static getTextHash(text: string, voice: string): string {
    return generateHash(`${voice}:${text}`);
  }

  /**
   * Busca audio TTS en cache
   */
  static get(text: string, voice: string): string | null {
    const hash = this.getTextHash(text, voice);
    const cachedPath = path.join(TTS_CACHE_DIR, `${hash}.mp3`);

    if (fs.existsSync(cachedPath)) {
      // Verificar que el archivo no sea muy viejo (24 horas)
      const stats = fs.statSync(cachedPath);
      const ageMs = Date.now() - stats.mtimeMs;
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas

      if (ageMs < maxAge) {
        console.log(`📦 TTS Cache HIT: Audio encontrado en cache`);
        return cachedPath;
      } else {
        // Muy viejo, eliminar
        fs.unlinkSync(cachedPath);
      }
    }

    console.log(`📦 TTS Cache MISS: Audio no encontrado`);
    return null;
  }

  /**
   * Guarda audio TTS en cache
   * @returns Ruta al archivo en cache
   */
  static set(text: string, voice: string, audioPath: string): string {
    const hash = this.getTextHash(text, voice);
    const cachedPath = path.join(TTS_CACHE_DIR, `${hash}.mp3`);

    // Copiar archivo al cache
    fs.copyFileSync(audioPath, cachedPath);
    console.log(`📦 TTS Cache SET: Audio guardado en cache`);

    return cachedPath;
  }

  /**
   * Limpia cache de TTS (archivos viejos)
   */
  static cleanup(): void {
    if (!fs.existsSync(TTS_CACHE_DIR)) return;

    const files = fs.readdirSync(TTS_CACHE_DIR);
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    let cleaned = 0;

    for (const file of files) {
      const filePath = path.join(TTS_CACHE_DIR, file);
      try {
        const stats = fs.statSync(filePath);
        if (Date.now() - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      } catch (e) {
        // Ignorar errores
      }
    }

    if (cleaned > 0) {
      console.log(`🗑️ TTS Cache cleanup: ${cleaned} archivos viejos eliminados`);
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  static getStats(): { files: number; sizeBytes: number } {
    if (!fs.existsSync(TTS_CACHE_DIR)) {
      return { files: 0, sizeBytes: 0 };
    }

    const files = fs.readdirSync(TTS_CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      try {
        const stats = fs.statSync(path.join(TTS_CACHE_DIR, file));
        totalSize += stats.size;
      } catch (e) {
        // Ignorar
      }
    }

    return {
      files: files.length,
      sizeBytes: totalSize,
    };
  }
}

// Limpiar caches periódicamente (cada 30 minutos)
setInterval(() => {
  TranscriptionCache.cleanup();
  TTSCache.cleanup();
}, 30 * 60 * 1000);
