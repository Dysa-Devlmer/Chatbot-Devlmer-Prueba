# Script para crear un archivo de audio de prueba
Add-Type -AssemblyName System.Speech
$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Configurar salida a archivo WAV
$speak.SetOutputToWaveFile('test-audio.wav')

# Buscar voz en español si está disponible
$spanishVoice = $speak.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -match "es" } | Select-Object -First 1
if ($spanishVoice) {
    $speak.SelectVoice($spanishVoice.VoiceInfo.Name)
}

# Generar el audio
$speak.Speak('Hola, este es un mensaje de prueba para el sistema de transcripción con Whisper. Me gustaría obtener información sobre los servicios de diseño web y desarrollo de aplicaciones móviles. También necesito saber los precios y el tiempo de entrega.')

# Cerrar el archivo
$speak.Dispose()

Write-Host "✅ Audio de prueba creado: test-audio.wav" -ForegroundColor Green