import os
import sys
import time
from openai import OpenAI
from dotenv import load_dotenv
import threading
from typing import Callable, Optional

import speech_recognition as sr  
import tempfile
import soundfile as sf
import numpy as np


class AudioTranscribe:
    """Encapsulates microphone capture and transcription via OpenAI."""

    def __init__(self, chunk_duration: float = 3.0, energy_threshold: int = 400):
        load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("OPENAI_API_KEY not set. Export it or put it into backend/.env.local")
            sys.exit(1)

        self.client = OpenAI(api_key=api_key)

        # Recognizer and capture settings
        self.r = sr.Recognizer()
        self.r.energy_threshold = energy_threshold
        self.CHUNK_DURATION = chunk_duration

    def transcribe_audio_data(self, audio_data: sr.AudioData) -> str | None:
        """Save `audio_data` to temp WAV and send to OpenAI for transcription."""
        wav_data = audio_data.get_wav_data()

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name
            audio_array = np.frombuffer(wav_data, dtype=np.int16)
            samplerate = audio_data.sample_rate
            sf.write(tmp_path, audio_array, samplerate, subtype="PCM_16")

        try:
            with open(tmp_path, "rb") as f:
                resp = self.client.audio.transcriptions.create(
                    model="gpt-4o-transcribe", file=f, language="en"  # <-- force English transcription
                )

            return getattr(resp, "text", None)
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass

    def run(self, stop_event: Optional[threading.Event] = None, on_final: Optional[Callable[[str], None]] = None) -> None:
        """Run blocking capture loop.

        on_transcript: optional sync callback invoked with each transcription string.
        stop_event: optional threading.Event that when set will stop the loop.
        """
        print("Real-time transcription started. Say something. Press Ctrl+C or press Esc to stop.")

        result = ""
        with sr.Microphone() as source:
            print("Adjusting for ambient noise... Please wait a moment.")
            self.r.adjust_for_ambient_noise(source, duration=0.5)
            print("Ready. Start speaking now.")

            try:
                while True:
                    # If an external stop has been requested, break out
                    if stop_event is not None and stop_event.is_set():
                        print("Stop event set, stopping transcriber loop.")
                        break
                    # Check whether the user pressed Esc to stop recording
                    try:
                        if msvcrt.kbhit():
                            key = msvcrt.getch()
                            if key == b"\x1b":
                                print("Esc pressed, stopping.")
                                break
                    except Exception:
                        # Non-fatal if key check fails for some reason
                        pass

                    if stop_event is not None and stop_event.is_set():
                        print("Stop requested before next listen.")
                        break

                    try:
                        audio = self.r.listen(source, phrase_time_limit=self.CHUNK_DURATION, timeout=1.0)
                        text = self.transcribe_audio_data(audio)
                    except sr.WaitTimeoutError:
                        if stop_event is not None and stop_event.is_set():
                            break
                        continue  # no audio, keep looping

                    if text:
                        result += " " + text
                        print(text)
                    else:
                        print("(No clear speech detected)")

            except sr.WaitTimeoutError:
                print("Microphone listening timed out.")
            except KeyboardInterrupt:
                print("Stopped.")
            except Exception as e:
                print("An error occurred during transcription or audio handling:", e)

            print(f"Result : {result}")
            # Call final callback with the full result if provided
            try:
                if on_final:
                    print("Final sent")
                    on_final(result.strip())
            except Exception:
                pass


if __name__ == "__main__":
    AudioTranscribe().run()