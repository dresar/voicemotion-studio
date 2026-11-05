#!/usr/bin/env bash
set -euo pipefail

if command -v pip3 >/dev/null 2>&1; then
  pip3 install --upgrade edge-tts
elif command -v python3 >/dev/null 2>&1; then
  python3 -m pip install --upgrade edge-tts
else
  printf "python3 atau pip3 tidak ditemukan.\n"
  exit 1
fi

edge-tts --text "Halo, ini uji suara VoiceMotion Studio." --voice id-ID-ArdiNeural --write-media /tmp/voicemotion-tts-test.mp3
printf "edge-tts siap. File uji: /tmp/voicemotion-tts-test.mp3\n"
