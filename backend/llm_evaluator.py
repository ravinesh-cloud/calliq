import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def evaluate(transcript: str, checklist: list) -> list:
    requirements = "\n".join([f"- {item['section']}: {item['description']}" for item in checklist])

    prompt = f"""You are an expert sales call quality analyst for Casagrand.

Evaluate the following English translation of a sales call.

TRANSCRIPT:
\"\"\"{transcript}\"\"\"

REQUIREMENTS TO CHECK:
{requirements}

TASK:
Analyze if the salesperson covered each requirement. Return ONLY a JSON array of objects with no extra text:
[
  {{
    "section_name": "exact name from requirements",
    "score": <0-100>,
    "status": "Fully Covered | Partially Covered | Missed",
    "evidence": "quote from transcript or null",
    "reasoning": "brief explanation"
  }}
]"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a sales call quality analyst. Always respond with valid JSON only, no markdown, no explanation."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1
        )

        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        evaluations = json.loads(raw)

        for i, eval_item in enumerate(evaluations):
            if i < len(checklist):
                eval_item["weight"] = checklist[i].get("weight", 0)

        return evaluations

    except Exception as e:
        print(f"❌ Evaluation Error: {e}")
        return []