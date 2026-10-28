$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$narrations = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'territory-narration.json'), [Text.Encoding]::UTF8) | ConvertFrom-Json
$folder = Join-Path $PSScriptRoot '../../.tools/tutorial-voice'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.SelectVoice('Microsoft Sabina Desktop')
$speaker.Rate = 0
try {
  for ($index = 0; $index -lt $narrations.Count; $index++) {
    $speaker.SetOutputToWaveFile((Join-Path $folder "$index.wav"))
    $speaker.Speak($narrations[$index])
    $speaker.SetOutputToNull()
  }
} finally { $speaker.Dispose() }
Write-Output 'Narracion local en espanol generada.'
