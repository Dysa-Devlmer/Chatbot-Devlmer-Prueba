import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

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
          in: ['tts_voice', 'tts_rate', 'tts_backend', 'tts_reference_audio'],
        },
      },
    });

    const configMap = new Map(config.map((c: { key: string; value: string }) => [c.key, c.value]));

    // Obtener audios de referencia disponibles
    const voiceSamplesDir = path.join(process.cwd(), 'voice_samples');
    let referenceAudios: string[] = [];

    if (fs.existsSync(voiceSamplesDir)) {
      referenceAudios = fs.readdirSync(voiceSamplesDir)
        .filter(f => f.endsWith('.wav') || f.endsWith('.mp3') || f.endsWith('.ogg'));
    }

    // Verificar si XTTS está disponible
    const xttsAvailable = fs.existsSync(path.join(process.cwd(), 'venv_xtts')) &&
                          fs.existsSync(path.join(process.cwd(), 'xtts-tts.py'));

    return NextResponse.json({
      success: true,
      voices: SPANISH_VOICES,
      backends: [
        { id: 'edge-tts', name: 'Microsoft Edge TTS', available: true },
        { id: 'xtts', name: 'XTTS v2 (Clonación de voz)', available: xttsAvailable },
        { id: 'gtts', name: 'Google TTS', available: true },
      ],
      referenceAudios,
      current: {
        voice: configMap.get('tts_voice') || 'es-CL-CatalinaNeural',
        rate: configMap.get('tts_rate') || '+0%',
        backend: configMap.get('tts_backend') || 'edge-tts',
        referenceAudio: configMap.get('tts_reference_audio') || '',
      },
      xttsAvailable,
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
    const { voice, rate, backend, referenceAudio } = body;

    const updates = [];

    // Validar y actualizar backend
    if (backend) {
      if (!['edge-tts', 'xtts', 'gtts', 'pyttsx3'].includes(backend)) {
        return NextResponse.json(
          { success: false, error: 'Backend no válido' },
          { status: 400 }
        );
      }

      updates.push(
        prisma.systemConfig.upsert({
          where: { key: 'tts_backend' },
          update: { value: backend },
          create: { key: 'tts_backend', value: backend },
        })
      );
    }

    // Validar y actualizar voz (solo para edge-tts)
    if (voice) {
      if (!SPANISH_VOICES.find(v => v.id === voice)) {
        return NextResponse.json(
          { success: false, error: 'Voz no válida' },
          { status: 400 }
        );
      }

      updates.push(
        prisma.systemConfig.upsert({
          where: { key: 'tts_voice' },
          update: { value: voice },
          create: { key: 'tts_voice', value: voice },
        })
      );
    }

    // Validar y actualizar rate
    if (rate) {
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

    // Actualizar audio de referencia (para XTTS)
    if (referenceAudio !== undefined) {
      const fullPath = referenceAudio
        ? path.join(process.cwd(), 'voice_samples', referenceAudio)
        : '';

      // Verificar que el archivo existe (si se proporciona)
      if (referenceAudio && !fs.existsSync(fullPath)) {
        return NextResponse.json(
          { success: false, error: 'Audio de referencia no encontrado' },
          { status: 400 }
        );
      }

      updates.push(
        prisma.systemConfig.upsert({
          where: { key: 'tts_reference_audio' },
          update: { value: fullPath },
          create: { key: 'tts_reference_audio', value: fullPath },
        })
      );
    }

    await Promise.all(updates);

    // Obtener configuración actualizada
    const config = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['tts_voice', 'tts_rate', 'tts_backend', 'tts_reference_audio'],
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
        backend: configMap.get('tts_backend') || 'edge-tts',
        referenceAudio: configMap.get('tts_reference_audio') || '',
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

// PUT - Activar XTTS con audio de referencia
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { referenceAudio, activate } = body;

    if (activate && referenceAudio) {
      const fullPath = path.join(process.cwd(), 'voice_samples', referenceAudio);

      // Verificar que el archivo existe
      if (!fs.existsSync(fullPath)) {
        return NextResponse.json(
          { success: false, error: 'Audio de referencia no encontrado' },
          { status: 400 }
        );
      }

      // Activar XTTS
      await Promise.all([
        prisma.systemConfig.upsert({
          where: { key: 'tts_backend' },
          update: { value: 'xtts' },
          create: { key: 'tts_backend', value: 'xtts' },
        }),
        prisma.systemConfig.upsert({
          where: { key: 'tts_reference_audio' },
          update: { value: fullPath },
          create: { key: 'tts_reference_audio', value: fullPath },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `XTTS activado con voz: ${referenceAudio}`,
        backend: 'xtts',
        referenceAudio: fullPath,
      });
    } else {
      // Desactivar XTTS, volver a edge-tts
      await prisma.systemConfig.upsert({
        where: { key: 'tts_backend' },
        update: { value: 'edge-tts' },
        create: { key: 'tts_backend', value: 'edge-tts' },
      });

      return NextResponse.json({
        success: true,
        message: 'XTTS desactivado, usando edge-tts',
        backend: 'edge-tts',
      });
    }
  } catch (error) {
    console.error('Error activando XTTS:', error);
    return NextResponse.json(
      { success: false, error: 'Error activando XTTS' },
      { status: 500 }
    );
  }
}
