/**
 * Utilidades de Seguridad
 *
 * Funciones para:
 * - Hashing de passwords (bcrypt)
 * - Generación de tokens seguros
 * - Validación de HMAC para webhooks
 * - Sanitización de inputs
 */

import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { customAlphabet } from 'nanoid'

/**
 * Configuración de bcrypt
 */
const SALT_ROUNDS = 12 // Balance entre seguridad y performance

/**
 * Hashear password con bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verificar password contra hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}

/**
 * Generar token seguro criptográficamente
 *
 * @param length - Longitud del token en bytes (default: 32)
 * @returns Token hexadecimal
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Generar token legible (alfanumérico)
 *
 * @param length - Longitud del token (default: 32)
 * @returns Token alfanumérico (sin caracteres ambiguos)
 */
export function generateReadableToken(length: number = 32): string {
  // Excluir caracteres ambiguos: 0, O, I, l
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const nanoid = customAlphabet(alphabet, length)
  return nanoid()
}

/**
 * Verificar firma HMAC SHA-256 de WhatsApp
 *
 * @param payload - Body del webhook (string)
 * @param signature - Firma enviada por WhatsApp en header x-hub-signature-256
 * @param secret - App Secret de WhatsApp Business
 * @returns true si la firma es válida
 */
export function verifyWhatsAppSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // WhatsApp envía: "sha256=<hash>"
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')}`

    // Comparación segura contra timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Error verifying WhatsApp signature:', error)
    return false
  }
}

/**
 * Sanitizar string para prevenir XSS
 *
 * @param input - String a sanitizar
 * @returns String sanitizado
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>'"]/g, '') // Remover caracteres peligrosos
    .trim()
    .slice(0, 1000) // Limitar longitud
}

/**
 * Validar que un string sea un número de teléfono válido
 *
 * @param phone - Número de teléfono
 * @returns true si es válido (formato internacional sin +)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Formato WhatsApp: código país + número (sin +)
  // Ejemplo: 56912345678 (Chile)
  return /^\d{10,15}$/.test(phone)
}

/**
 * Generar UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * Hash de string con SHA-256
 *
 * @param input - String a hashear
 * @returns Hash hexadecimal
 */
export function sha256Hash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

/**
 * Encriptar string con AES-256-GCM
 *
 * @param text - Texto a encriptar
 * @param key - Clave de encriptación (32 bytes hex)
 * @returns Objeto con iv, authTag y encrypted data
 */
export function encrypt(
  text: string,
  key: string
): { iv: string; authTag: string; encrypted: string } {
  const keyBuffer = Buffer.from(key, 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    encrypted,
  }
}

/**
 * Desencriptar string con AES-256-GCM
 *
 * @param encrypted - Objeto con iv, authTag y encrypted data
 * @param key - Clave de encriptación (32 bytes hex)
 * @returns Texto desencriptado
 */
export function decrypt(
  encrypted: { iv: string; authTag: string; encrypted: string },
  key: string
): string {
  const keyBuffer = Buffer.from(key, 'hex')
  const iv = Buffer.from(encrypted.iv, 'hex')
  const authTag = Buffer.from(encrypted.authTag, 'hex')

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
