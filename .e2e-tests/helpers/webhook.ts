import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Helper para generar un payload válido de webhook de WhatsApp
 */
export function generateValidPayload(overrides = {}) {
  const defaultPayload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "259609383376410",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15551234567",
                phone_number_id: "123456789012345"
              },
              contacts: [
                {
                  profile: {
                    name: "Usuario de Prueba"
                  },
                  wa_id: "56912345678"
                }
              ],
              messages: [
                {
                  from: "56912345678",
                  id: "wamid.HBgNNTY5MTIzNDU2NzhGAAhEVElLRU5fQUNDRVNTX1RPS0VOAA==",
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: {
                    body: "Mensaje de prueba para E2E"
                  },
                  type: "text"
                }
              ]
            },
            field: "messages"
          }
        ]
      }
    ]
  };

  return { ...defaultPayload, ...overrides };
}

/**
 * Helper para generar HMAC válido basado en payload y secret
 */
export function generateHMAC(payload: string, secret: string = process.env.WHATSAPP_WEBHOOK_SECRET || 'test-secret'): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Helper para crear un objeto NextRequest con headers y payload
 */
export function createRequest(payload: any, signature: string): NextRequest {
  const url = new URL('http://localhost:7847/api/whatsapp/webhook');
  
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'X-Hub-Signature-256': signature,
      'Content-Type': 'application/json',
      'User-Agent': 'E2E-Test-Client'
    },
    body: JSON.stringify(payload)
  });
}

/**
 * Helper para crear un payload de audio
 */
export function generateAudioPayload(overrides = {}) {
  const defaultPayload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "259609383376410",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15551234567",
                phone_number_id: "123456789012345"
              },
              contacts: [
                {
                  profile: {
                    name: "Usuario Audio"
                  },
                  wa_id: "56987654321"
                }
              ],
              messages: [
                {
                  from: "56987654321",
                  id: "wamid.HBgNNTY5ODc2NTQzMjFGAAhEVElLRU5fQUNDRVNTX1RPS0VOAA==",
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: "audio",
                  audio: {
                    id: "1234567890",
                    mime_type: "audio/ogg; codecs=opus",
                    sha256: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                    voice: true
                  }
                }
              ]
            },
            field: "messages"
          }
        ]
      }
    ]
  };

  return { ...defaultPayload, ...overrides };
}

/**
 * Helper para crear un payload con HMAC inválido
 */
export function createInvalidHMACRequest(payload: any): NextRequest {
  const url = new URL('http://localhost:7847/api/whatsapp/webhook');
  
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'X-Hub-Signature-256': 'sha256=invalid_signature_here',
      'Content-Type': 'application/json',
      'User-Agent': 'E2E-Test-Client'
    },
    body: JSON.stringify(payload)
  });
}