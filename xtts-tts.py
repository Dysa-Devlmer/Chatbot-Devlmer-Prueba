#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Text-to-Speech con clonación de voz usando XTTS v2
Uso: python xtts-tts.py "texto a convertir" audio_referencia.wav salida.wav [idioma]
"""
import sys
import os
import io

# Forzar UTF-8 en Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from TTS.api import TTS
import json

def text_to_speech_clone(text, reference_audio, output_path, language="es"):
    """
    Genera audio con voz clonada usando XTTS v2

    Args:
        text: Texto a convertir en audio
        reference_audio: Ruta al audio de referencia (10-30 seg)
        output_path: Ruta donde guardar el audio generado
        language: Código del idioma (es, en, etc.)
    """
    try:
        print(f"🎤 Cargando XTTS v2...", file=sys.stderr)

        # Cargar modelo XTTS v2 con GPU
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)

        print(f"🔊 Generando audio con voz clonada...", file=sys.stderr)
        print(f"📁 Audio de referencia: {reference_audio}", file=sys.stderr)

        # Generar audio con voz clonada
        tts.tts_to_file(
            text=text,
            file_path=output_path,
            speaker_wav=reference_audio,
            language=language
        )

        result = {
            "success": True,
            "output_path": output_path,
            "text": text[:100] + "..." if len(text) > 100 else text
        }
        print(json.dumps(result, ensure_ascii=False))
        return result

    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result, ensure_ascii=False))
        return error_result

def main():
    if len(sys.argv) < 4:
        print("Uso: python xtts-tts.py \"texto\" audio_referencia.wav salida.wav [idioma]", file=sys.stderr)
        sys.exit(1)

    text = sys.argv[1]
    reference_audio = sys.argv[2]
    output_path = sys.argv[3]
    language = sys.argv[4] if len(sys.argv) > 4 else "es"

    text_to_speech_clone(text, reference_audio, output_path, language)

if __name__ == "__main__":
    main()
