from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import traceback

# Import the updated transcription and evaluation functions
from backend.whisper_transcribe import transcribe_audio
from backend.script_parser import load_script
from backend.llm_evaluator import evaluate
from backend.scoring import calculate_score
from backend.utils import save_json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "AI Sales Call Evaluator is running"}

@app.post("/api/evaluate")
async def evaluate_call(audio: UploadFile = File(...)):
    try:
        # Create necessary directories
        os.makedirs("input/audio", exist_ok=True)
        os.makedirs("input/scripts", exist_ok=True)
        os.makedirs("output", exist_ok=True)

        # Step 1: Save Audio File
        file_path = f"input/audio/{audio.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        print(f"✅ Step 1: Audio saved to {file_path}")

        # Step 2: Load Script FIRST
        # We load this first so we can give Whisper "hints" about your brand/product
        script = load_script("input/scripts/script.json")
        
        # Create a string of keywords from your script sections and descriptions
        # This helps the Whisper API recognize "Casagrand" and other specific terms
        script_context = ", ".join([f"{item['section']} {item['description']}" for item in script])
        print(f"✅ Step 2: Script loaded — Context extracted for accurate translation")

        # Step 3: High-Accuracy Transcription (OpenAI Whisper API)
        # We pass the script_context as the 'prompt' parameter
        transcript = transcribe_audio(file_path, script_context=script_context)
        print(f"✅ Step 3: Transcription done — {len(transcript)} characters")

        # Step 4: LLM Evaluation (Gemini 1.5/2.0 Flash)
        result = evaluate(transcript, script)
        print(f"✅ Step 4: LLM evaluation done")

        # Step 5: Scoring and Output
        final_result = calculate_score(result)
        final_result["transcript"] = transcript
        print(f"✅ Step 5: Score — {final_result.get('overall_score')}%")

        save_json(final_result, "output/result.json")

        return final_result

    except Exception as e:
        print("❌ ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))