#!/usr/bin/env python3
"""
Script to download XTTS v2 model with automatic TOS acceptance
"""
import sys
import os

# Mock input to auto-accept TOS
class MockInput:
    def __init__(self):
        self.call_count = 0

    def __call__(self, prompt):
        self.call_count += 1
        print(f"{prompt}y (auto-accepted)")
        return "y"

# Replace input with mock
original_input = input
sys.modules['builtins'].input = MockInput()

try:
    from TTS.api import TTS
    print("Descargando modelo XTTS v2...")
    print("Esto puede tomar varios minutos (modelo ~1.5GB)...")

    # Download model (will auto-accept TOS)
    tts = TTS('tts_models/multilingual/multi-dataset/xtts_v2')

    print("\n✅ XTTS v2 descargado y listo para usar")
    print(f"Idiomas soportados: {tts.languages if hasattr(tts, 'languages') else 'multilingual'}")

except Exception as e:
    print(f"\n❌ Error descargando modelo: {e}")
    sys.exit(1)
finally:
    # Restore original input
    sys.modules['builtins'].input = original_input
