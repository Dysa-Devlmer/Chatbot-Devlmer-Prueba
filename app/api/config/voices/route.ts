import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Voces disponibles de edge-tts (español)
const SPANISH_VOICES = [
  // Chile
  { id: 'es-CL-CatalinaNeural', name: 'Catalina', country: 'Chile', gender: 'female' },
  { id: 'es-CL-LorenzoNeural', name: 'Lorenzo', country: 'Chile', gender: 'male' },
  // España
  { id: 'es-ES-ElviraNeural', name: 'Elvira', country: 'España', gender: 'female' },
  { id: 'es-ES-AlvaroNeural', name: 'Alvaro', country: 'España', gender: 'male' },
  // México
  { id: 'es-MX-DaliaNeural', name: 'Dalia', country: 'México', gender: 'female' },
  { id: 'es-MX-JorgeNeural', name: 'Jorge', country: 'México', gender: 'male' },
  // Argentina
  { id: 'es-AR-ElenaNeural', name: 'Elena', country: 'Argentina', gender: 'female' },
  { id: 'es-AR-TomasNeural', name: 'Tomás', country: 'Argentina', gender: 'male' },
  // Colombia
  { id: 'es-CO-SalomeNeural', name: 'Salomé', country: 'Colombia', gender: 'female' },
  { id: 'es-CO-GonzaloNeural', name: 'Gonzalo', country: 'Colombia', gender: 'male' },
  // Perú
  { id: 'es-PE-CamilaNeural', name: 'Camila', country: 'Perú', gender: 'female' },
  { id: 'es-PE-AlexNeural', name: 'Alex', country: 'Perú', gender: 'male' },
  // Venezuela
  { id: 'es-VE-PaolaNeural', name: 'Paola', country: 'Venezuela', gender: 'female' },
  { id: 'es-VE-SebastianNeural', name: 'Sebastián', country: 'Venezuela', gender: 'male' },
];

// GET - Obtener voces disponibles y configuración actual
export async function GET() {
  try {
    // Obtener configuración actual
    const config = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['tts_voice', 'tts_rate', 'tts_backend'],
        },
      },
    });

    const configMap = new Map(config.map((c: { key: string; value: string }) => [c.key, c.value]));

    return NextResponse.json({
      success: true,
      voices: SPANISH_VOICES,
      current: {
        voice: configMap.get('tts_voice') || 'es-CL-CatalinaNeural',
        rate: configMap.get('tts_rate') || '+0%',
        backend: configMap.get('tts_backend') || 'edge-tts',
      },
    });
  } catch (error) {
    console.error('Error obteniendo voces:', error);
    return NextResponse.json(
      { success: false, error: 'Error obteniendo configuración de voces' },
      { status: 500 }
    );
  }
}

// POST - Actualizar configuración de voz
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voice, rate } = body;

    // Validar que la voz sea válida
    if (voice && !SPANISH_VOICES.find(v => v.id === voice)) {
      return NextResponse.json(
        { success: false, error: 'Voz no válida' },
        { status: 400 }
      );
    }

    // Actualizar configuración
    const updates = [];

    if (voice) {
      updates.push(
        prisma.systemConfig.upsert({
          where: { key: 'tts_voice' },
          update: { value: voice },
          create: { key: 'tts_voice', value: voice },
        })
      );
    }

    if (rate) {
      // Validar formato de rate (ej: +10%, -5%, +0%)
      if (!/^[+-]\d+%$/.test(rate)) {
        return NextResponse.json(
          { success: false, error: 'Formato de velocidad inválido. Use +10%, -5%, etc.' },
          { status: 400 }
        );
      }

      updates.push(
        prisma.systemConfig.upsert({
          where: { key: 'tts_rate' },
          update: { value: rate },
          create: { key: 'tts_rate', value: rate },
        })
      );
    }

    await Promise.all(updates);

    // Obtener configuración actualizada
    const config = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['tts_voice', 'tts_rate'],
        },
      },
    });

    const configMap = new Map(config.map((c: { key: string; value: string }) => [c.key, c.value]));

    return NextResponse.json({
      success: true,
      message: 'Configuración de voz actualizada',
      current: {
        voice: configMap.get('tts_voice') || 'es-CL-CatalinaNeural',
        rate: configMap.get('tts_rate') || '+0%',
      },
    });
  } catch (error) {
    console.error('Error actualizando voz:', error);
    return NextResponse.json(
      { success: false, error: 'Error actualizando configuración de voz' },
      { status: 500 }
    );
  }
}

// DELETE - Generar preview de una voz
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { voice, text = 'Hola, soy tu asistente virtual de PITHY. ¿En qué puedo ayudarte hoy?' } = body;

    // Validar voz
    if (!SPANISH_VOICES.find(v => v.id === voice)) {
      return NextResponse.json(
        { success: false, error: 'Voz no válida' },
        { status: 400 }
      );
    }

    // Generar preview (solo texto para demostración)
    // En un entorno real, esto generaría un archivo de audio y lo devolvería
    return NextResponse.json({
      success: true,
      message: `Preview de voz "${voice}" generado`,
      previewText: text,
      voice: SPANISH_VOICES.find(v => v.id === voice),
    });
  } catch (error) {
    console.error('Error generando preview:', error);
    return NextResponse.json(
      { success: false, error: 'Error generando preview de voz' },
      { status: 500 }
    );
  }
}
