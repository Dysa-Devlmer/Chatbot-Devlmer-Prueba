#!/usr/bin/env python3
"""
Script de transcripción de audio usando faster-whisper
Uso: python whisper-transcribe.py <archivo_audio> [modelo] [idioma]
"""
import sys
import json
import os
from pathlib import Path
from faster_whisper import WhisperModel

def transcribe_audio(audio_path, model_size="small", language="es"):
    """
    Transcribe un archivo de audio usando faster-whisper

    Args:
        audio_path: Ruta al archivo de audio
        model_size: Tamaño del modelo (tiny, base, small, medium, large)
        language: Código del idioma (es, en, etc.)

    Returns:
        dict con: text (texto transcrito), language (idioma detectado), duration (duración)
    """
    try:
        # Verificar que el archivo existe
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Archivo no encontrado: {audio_path}")

        # Verificar el tamaño del archivo
        file_size = os.path.getsize(audio_path)
        print(f"📁 Archivo: {audio_path} ({file_size} bytes)", file=sys.stderr)

        if file_size == 0:
            raise ValueError("El archivo de audio está vacío")

        print(f"🎤 Cargando modelo {model_size}...", file=sys.stderr)

        # Cargar modelo con configuración optimizada
        model = WhisperModel(
            model_size,
            device="cpu",  # Cambiar a "cuda" si tienes GPU NVIDIA
            compute_type="int8",  # Usar int8 para mejor rendimiento en CPU
            num_workers=1,
            download_root=None  # Usa el directorio por defecto de cache
        )

        print(f"🔊 Transcribiendo audio: {audio_path}", file=sys.stderr)

        # Detectar formato del archivo
        file_ext = os.path.splitext(audio_path)[1].lower()
        print(f"📼 Formato detectado: {file_ext}", file=sys.stderr)

        # Transcribir (faster-whisper maneja .ogg, .opus, .mp3, .wav, etc.)
        segments, info = model.transcribe(
            audio_path,
            language=language,
            task="transcribe",
            beam_size=5,
            best_of=5,
            vad_filter=True,  # Filtro de actividad de voz para mejor precisión
            vad_parameters=dict(
                min_silence_duration_ms=500,
            ),
            without_timestamps=False,  # Incluir timestamps
            word_timestamps=False  # No necesitamos timestamps por palabra
        )

        # Combinar todos los segmentos
        full_text = " ".join([segment.text.strip() for segment in segments])

        # Resultado
        result = {
            "text": full_text,
            "language": info.language,
            "duration": info.duration,
            "success": True
        }

        # Imprimir resultado como JSON
        print(json.dumps(result, ensure_ascii=False))

        return result

    except Exception as e:
        error_result = {
            "text": "",
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result, ensure_ascii=False))
        return error_result

def main():
    # Argumentos de línea de comandos
    if len(sys.argv) < 2:
        print("Uso: python whisper-transcribe.py <archivo_audio> [modelo] [idioma]", file=sys.stderr)
        sys.exit(1)

    audio_file = sys.argv[1]
    model_size = sys.argv[2] if len(sys.argv) > 2 else "small"
    language = sys.argv[3] if len(sys.argv) > 3 else "es"

    # Transcribir
    transcribe_audio(audio_file, model_size, language)

if __name__ == "__main__":
    main()