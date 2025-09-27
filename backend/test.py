from openai import OpenAI
import gradio as gr
import os
from dotenv import load_dotenv

# Load the .env.local file sitting next to this script (if present).
load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise EnvironmentError(
        "OPENAI_API_KEY not found. Set the environment variable or add it to backend/.env.local"
    )

client = OpenAI(api_key=api_key)


# Function: transcribe and translate audio
def transcribe_and_translate(audio):
    with open(audio, "rb") as f:
        # Step 1: Transcribe (speech → text, same language)
        transcription = client.audio.transcriptions.create(
            model="gpt-4o-mini-transcribe", file=f
        )
    with open(audio, "rb") as f:
        # Step 2: Translate (speech → English)
        translation = client.audio.translations.create(
            model="gpt-4o-mini-transcribe", file=f
        )
    return transcription.text, translation.text


# Gradio interface with mic recording
demo = gr.Interface(
    fn=transcribe_and_translate,
    inputs=gr.Audio(sources=["microphone"], type="filepath"),
    outputs=["text", "text"],
    title="🎤 Whisper Real-time Transcription & Translation",
    description="Speak into your mic → get transcription (original language) and English translation",
)


if __name__ == "__main__":
    # Only launch the Gradio UI when run as a script (safe to import the module)
    demo.launch()
