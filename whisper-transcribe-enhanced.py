#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script mejorado de transcripción de audio usando faster-whisper
Con soporte para formatos de WhatsApp (.ogg, .opus)
"""
import sys
import json
import os
import subprocess
import tempfile
from pathlib import Path
from faster_whisper import WhisperModel

def convert_audio_if_needed(audio_path):
    """
    Convierte el audio a formato WAV si es necesario
    WhatsApp envía audios en formato .ogg o .opus
    """
    file_ext = os.path.splitext(audio_path)[1].lower()
    print(f"📼 Formato original: {file_ext}", file=sys.stderr)

    # Si ya es WAV o MP3, no convertir
    if file_ext in ['.wav', '.mp3']:
        return audio_path, None

    # Para otros formatos, intentar con ffmpeg si está disponible
    try:
        # Verificar si ffmpeg está disponible
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)

        # Crear archivo temporal WAV
        temp_wav = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        temp_wav.close()

        print(f"🔄 Convirtiendo {file_ext} a WAV...", file=sys.stderr)

        # Convertir a WAV usando ffmpeg
        cmd = [
            'ffmpeg',
            '-i', audio_path,
            '-ar', '16000',  # Sample rate 16kHz (óptimo para Whisper)
            '-ac', '1',      # Mono
            '-y',            # Sobrescribir
            temp_wav.name
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"⚠️ Error en conversión: {result.stderr}", file=sys.stderr)
            os.unlink(temp_wav.name)
            return audio_path, None

        print(f"✅ Conversión exitosa", file=sys.stderr)
        return temp_wav.name, temp_wav.name  # Retornar path para limpieza posterior

    except (subprocess.CalledProcessError, FileNotFoundError):
        print(f"ℹ️ ffmpeg no disponible, intentando con formato original", file=sys.stderr)
        return audio_path, None

def transcribe_audio(audio_path, model_size="base", language="es"):
    """
    Transcribe un archivo de audio usando faster-whisper
    """
    temp_file = None

    try:
        # Verificar que el archivo existe
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Archivo no encontrado: {audio_path}")

        # Verificar el tamaño del archivo
        file_size = os.path.getsize(audio_path)
        print(f"📁 Archivo: {audio_path} ({file_size:,} bytes)", file=sys.stderr)

        if file_size == 0:
            raise ValueError("El archivo de audio está vacío")

        if file_size < 1000:  # Menos de 1KB es sospechosamente pequeño
            print(f"⚠️ Archivo muy pequeño: {file_size} bytes", file=sys.stderr)

        # Convertir audio si es necesario
        audio_to_transcribe, temp_file = convert_audio_if_needed(audio_path)

        print(f"🎤 Cargando modelo {model_size}...", file=sys.stderr)

        # Cargar modelo con configuración optimizada
        model = WhisperModel(
            model_size,
            device="cpu",
            compute_type="int8",
            num_workers=1,
            download_root=None
        )

        print(f"🔊 Transcribiendo audio...", file=sys.stderr)

        try:
            # Intentar transcribir con detección automática de idioma primero
            segments, info = model.transcribe(
                audio_to_transcribe,
                language=None,  # Detección automática
                task="transcribe",
                beam_size=5,
                best_of=5,
                vad_filter=True,
                vad_parameters=dict(
                    min_silence_duration_ms=500,
                ),
                without_timestamps=False,
                word_timestamps=False
            )

            # Si el idioma detectado no es español pero se pidió español, re-transcribir
            if info.language != language and language == "es":
                print(f"🌐 Idioma detectado: {info.language}, forzando a {language}", file=sys.stderr)
                segments, info = model.transcribe(
                    audio_to_transcribe,
                    language=language,
                    task="transcribe",
                    beam_size=5,
                    best_of=5,
                    vad_filter=True,
                    vad_parameters=dict(
                        min_silence_duration_ms=500,
                    )
                )

        except Exception as e:
            print(f"⚠️ Error en transcripción, intentando sin VAD filter", file=sys.stderr)
            # Reintentar sin VAD filter (más tolerante con audios cortos)
            segments, info = model.transcribe(
                audio_to_transcribe,
                language=language,
                task="transcribe",
                beam_size=5,
                vad_filter=False  # Sin filtro VAD
            )

        # Combinar todos los segmentos
        full_text = " ".join([segment.text.strip() for segment in segments])

        # Si no hay texto, intentar una vez más con configuración mínima
        if not full_text.strip():
            print(f"⚠️ Sin texto detectado, reintentando con configuración mínima", file=sys.stderr)
            segments, info = model.transcribe(
                audio_to_transcribe,
                language=language,
                task="transcribe",
                beam_size=1,
                vad_filter=False
            )
            full_text = " ".join([segment.text.strip() for segment in segments])

        # Resultado
        result = {
            "text": full_text.strip() if full_text.strip() else "No se pudo transcribir el audio",
            "language": info.language if hasattr(info, 'language') else language,
            "duration": info.duration if hasattr(info, 'duration') else 0,
            "success": bool(full_text.strip())
        }

        print(f"✅ Transcripción: '{full_text[:100]}...'", file=sys.stderr)

        # Imprimir resultado como JSON
        print(json.dumps(result, ensure_ascii=False))

        return result

    except Exception as e:
        print(f"❌ Error: {str(e)}", file=sys.stderr)
        error_result = {
            "text": "",
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result, ensure_ascii=False))
        return error_result

    finally:
        # Limpiar archivo temporal si existe
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
                print(f"🧹 Archivo temporal eliminado", file=sys.stderr)
            except:
                pass

def main():
    # Argumentos de línea de comandos
    if len(sys.argv) < 2:
        print("Uso: python whisper-transcribe-enhanced.py <archivo_audio> [modelo] [idioma]", file=sys.stderr)
        sys.exit(1)

    audio_file = sys.argv[1]
    model_size = sys.argv[2] if len(sys.argv) > 2 else "base"
    language = sys.argv[3] if len(sys.argv) > 3 else "es"

    # Transcribir
    transcribe_audio(audio_file, model_size, language)

if __name__ == "__main__":
    main()