import os
import sys
import tempfile
import wave
import time
from openai import OpenAI
from dotenv import load_dotenv

import sounddevice as sd
import numpy as np
import soundfile as sf

load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("OPENAI_API_KEY not set. Export it or put it into backend/.env.local")
    sys.exit(1)

client = OpenAI(api_key=api_key)

CHANNELS = 1
SAMPLERATE = 16000
CHUNK_DURATION = 3.0  # seconds per chunk


def record_chunk(duration, samplerate, channels):
    """Record a chunk of audio and return numpy array"""
    frames = sd.rec(
        int(duration * samplerate),
        samplerate=samplerate,
        channels=channels,
        dtype="int16",
    )
    sd.wait()
    return frames


def save_wav(tmp_path, data, samplerate, channels):
    # soundfile can write numpy arrays directly
    sf.write(tmp_path, data, samplerate, subtype="PCM_16")


def transcribe_file(path):
    with open(path, "rb") as f:
        resp = client.audio.transcriptions.create(
            model="gpt-4o-mini-transcribe", file=f
        )
    return getattr(resp, "text", None)


def main():
    print("Realtime transcription started. Press Ctrl+C to stop.")
    try:
        while True:
            print(f"Recording {CHUNK_DURATION}s...")
            data = record_chunk(CHUNK_DURATION, SAMPLERATE, CHANNELS)
            # data shape [samples, channels]
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp_path = tmp.name
            save_wav(tmp_path, data, SAMPLERATE, CHANNELS)
            try:
                text = transcribe_file(tmp_path)
                timestamp = time.strftime("%H:%M:%S")
                print(f"[{timestamp}] {text}")
            except Exception as e:
                print("Transcription error:", e)
            finally:
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass
    except KeyboardInterrupt:
        print("Stopped.")


if __name__ == "__main__":
    main()
