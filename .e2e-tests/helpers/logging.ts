import { Logger } from 'winston';
import {
  whatsappLogger,
  aiLogger,
  perplexityLogger,
  messageProcessorLogger,
  dbLogger,
  authLogger,
  learningLogger,
  ttsLogger,
  apiLogger
} from '@/lib/logger';

// Almacenamiento temporal de logs para pruebas
const logStorage: Record<string, any[]> = {};

/**
 * Helper para capturar logs de un logger específico
 */
export function captureLogs(loggerName: string) {
  if (!logStorage[loggerName]) {
    logStorage[loggerName] = [];
  }

  // Obtener el logger específico según el nombre
  const loggerMap: Record<string, Logger> = {
    'whatsapp': whatsappLogger,
    'ai': aiLogger,
    'perplexity': perplexityLogger,
    'message-processor': messageProcessorLogger,
    'database': dbLogger,
    'auth': authLogger,
    'learning': learningLogger,
    'tts': ttsLogger,
    'api': apiLogger,
  };

  const loggerInstance = loggerMap[loggerName as keyof typeof loggerMap];
  if (!loggerInstance) {
    throw new Error(`Logger ${loggerName} no encontrado`);
  }

  const originalLog = (loggerInstance as any).log;

  (loggerInstance as any).log = function(level: string, msg: string, meta?: any) {
    logStorage[loggerName].push({
      level,
      message: msg,
      meta,
      timestamp: new Date()
    });

    // Llamar al logger original para que siga funcionando normalmente
    originalLog.call(this, level, msg, meta);
  };

  return () => {
    // Función para restaurar el logger original
    (loggerInstance as any).log = originalLog;
  };
}

/**
 * Helper para obtener logs capturados de un logger específico
 */
export function getCapturedLogs(loggerName: string): any[] {
  return logStorage[loggerName] || [];
}

/**
 * Helper para limpiar logs capturados
 */
export function clearCapturedLogs(loggerName?: string) {
  if (loggerName) {
    logStorage[loggerName] = [];
  } else {
    Object.keys(logStorage).forEach(key => {
      logStorage[key] = [];
    });
  }
}

/**
 * Helper para verificar si un logger específico tiene un mensaje específico
 */
export function hasLogWithMessage(loggerName: string, message: string, level?: string): boolean {
  const logs = getCapturedLogs(loggerName);
  return logs.some(log => 
    log.message.includes(message) && 
    (!level || log.level === level)
  );
}

/**
 * Helper para verificar si un logger tiene un log con cierto nivel
 */
export function hasLogWithLevel(loggerName: string, logLevel: string): boolean {
  const logs = getCapturedLogs(loggerName);
  return logs.some(log => log.level === logLevel);
}

/**
 * Helper para verificar si hay logs de error
 */
export function hasErrorLogs(loggerName: string): boolean {
  return hasLogWithLevel(loggerName, 'error');
}

/**
 * Helper para obtener logs de un nivel específico
 */
export function getLogsByLevel(loggerName: string, level: string): any[] {
  const logs = getCapturedLogs(loggerName);
  return logs.filter(log => log.level === level);
}

/**
 * Helper para obtener logs que contienen una palabra clave
 */
export function getLogsWithKeyword(loggerName: string, keyword: string): any[] {
  const logs = getCapturedLogs(loggerName);
  return logs.filter(log => 
    log.message.toLowerCase().includes(keyword.toLowerCase()) ||
    (log.meta && JSON.stringify(log.meta).toLowerCase().includes(keyword.toLowerCase()))
  );
}

/**
 * Helper para esperar a que se registre un log específico
 */
export async function waitForLog(loggerName: string, message: string, timeout: number = 5000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (hasLogWithMessage(loggerName, message)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
}