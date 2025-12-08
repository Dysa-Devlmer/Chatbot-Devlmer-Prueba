#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test completo del flujo audio-a-audio
Simula el proceso completo: Audio → Whisper → IA → TTS → Audio
"""

import sys
import os
import json
import asyncio
from faster_whisper import WhisperModel
import edge_tts

# Configurar encoding para Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

async def test_audio_to_audio_flow(audio_input_path):
    """
    Prueba el flujo completo de audio a audio
    """
    print("="*60)
    print("🎯 TEST DE FLUJO COMPLETO: AUDIO → AUDIO")
    print("="*60)
    print()

    # 1. TRANSCRIPCIÓN CON WHISPER
    print("1️⃣ TRANSCRIBIENDO AUDIO CON WHISPER...")
    print(f"   📁 Archivo: {audio_input_path}")

    try:
        model = WhisperModel("base", device="cpu", compute_type="int8")
        segments, info = model.transcribe(
            audio_input_path,
            language="es",
            task="transcribe",
            vad_filter=True
        )

        transcription = " ".join([segment.text.strip() for segment in segments])
        print(f"   ✅ Transcripción: \"{transcription}\"")
        print(f"   🌐 Idioma: {info.language}")
        print(f"   ⏱️ Duración: {info.duration:.2f}s")
        print()

    except Exception as e:
        print(f"   ❌ Error en transcripción: {e}")
        return

    # 2. SIMULACIÓN DE PROCESAMIENTO CON IA
    print("2️⃣ PROCESANDO CON IA (Simulado)...")
    print(f"   💭 Analizando: \"{transcription[:50]}...\"")

    # Simular respuesta de IA basada en el contenido
    if "servicio" in transcription.lower() or "información" in transcription.lower():
        ai_response = """Gracias por tu interés en nuestros servicios.
        Ofrecemos diseño web profesional, desarrollo de aplicaciones móviles
        y consultoría tecnológica. Te enviaré más información por mensaje."""
    elif "precio" in transcription.lower():
        ai_response = """Los precios varían según el proyecto.
        Para una cotización personalizada, por favor compárteme más detalles
        sobre lo que necesitas y con gusto te preparo un presupuesto."""
    else:
        ai_response = """He recibido tu mensaje. Estoy aquí para ayudarte
        con cualquier consulta sobre nuestros servicios. ¿En qué puedo asistirte?"""

    print(f"   ✅ Respuesta generada: \"{ai_response[:80]}...\"")
    print()

    # 3. CONVERSIÓN A VOZ CON TTS
    print("3️⃣ GENERANDO AUDIO DE RESPUESTA CON TTS...")

    voice = "es-CL-CatalinaNeural"  # Voz chilena femenina
    output_file = f"response-audio-{os.getpid()}.mp3"

    print(f"   🎭 Voz: {voice}")
    print(f"   📝 Texto: \"{ai_response[:50]}...\"")

    try:
        # Generar audio con edge-tts
        communicate = edge_tts.Communicate(ai_response, voice)
        await communicate.save(output_file)

        file_size = os.path.getsize(output_file)
        print(f"   ✅ Audio generado: {output_file}")
        print(f"   📊 Tamaño: {file_size/1024:.2f} KB")
        print()

    except Exception as e:
        print(f"   ❌ Error en TTS: {e}")
        return

    # 4. RESUMEN DEL FLUJO
    print("="*60)
    print("✅ FLUJO COMPLETO EXITOSO")
    print("="*60)
    print()
    print("📊 RESUMEN DEL PROCESO:")
    print(f"   1. Audio entrada: {audio_input_path}")
    print(f"   2. Texto transcrito: \"{transcription[:60]}...\"")
    print(f"   3. Respuesta IA: \"{ai_response[:60]}...\"")
    print(f"   4. Audio salida: {output_file}")
    print()
    print("🎯 SIMULACIÓN DE WHATSAPP:")
    print("   👤 Usuario envía: [Audio de voz]")
    print(f"   🤖 Bot transcribe: \"{transcription[:50]}...\"")
    print(f"   🤖 Bot responde: \"{ai_response[:50]}...\"")
    print("   👤 Usuario recibe: [Audio de respuesta] + [Texto]")
    print()

    # Intentar reproducir el audio de respuesta
    if sys.platform == "win32":
        os.system(f"start {output_file}")
        print("🔊 Reproduciendo audio de respuesta...")

    return {
        "transcription": transcription,
        "ai_response": ai_response,
        "output_audio": output_file
    }

def main():
    if len(sys.argv) < 2:
        print("❌ Uso: python test-audio-to-audio.py <archivo_audio>")
        print("\nEjemplo:")
        print("  python test-audio-to-audio.py test-audio.wav")
        sys.exit(1)

    audio_file = sys.argv[1]
    if not os.path.exists(audio_file):
        print(f"❌ Archivo no encontrado: {audio_file}")
        sys.exit(1)

    # Ejecutar el flujo asíncrono
    asyncio.run(test_audio_to_audio_flow(audio_file))

if __name__ == "__main__":
    main()