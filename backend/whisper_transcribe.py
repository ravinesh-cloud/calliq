##Whisper_trancribe.py

import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def transcribe_audio(file_path, script_context=""):
    """
    Uses Gemini to transcribe audio.
    Supports both Tamil and English — auto detects language.
    Always returns English text.
    """
    audio_file = client.files.upload(file=file_path)

    prompt = f"""Listen to this audio carefully. It is a sales call.
    
The call may be in Tamil, English, or a mix of both (Tanglish).

Your task:
1. Detect the language automatically
2. Transcribe and translate the ENTIRE conversation into clear English
3. Label each line as either Agent or Customer where possible

Context: This is a call from Casagrand Builders (real estate company in Chennai).
Important keywords: {script_context}

Return ONLY the English transcription/translation. No extra explanation."""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[audio_file, prompt]
    )

    return response.text