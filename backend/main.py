from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

app = FastAPI()

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- DATA MODEL ----------
class InterviewRequest(BaseModel):
    answers: list[str]
    domain: str = "software engineering"

# ---------- HEALTH CHECK ----------
@app.get("/")
def root():
    return {"status": "Backend running successfully"}

# ---------- PROMPT BUILDER ----------
def build_prompt(previous_answers, domain):
    if not previous_answers:
        return f"""
You are a professional interviewer for a {domain} role.
Start with a simple introductory interview question.
"""

    history = "\n".join(
        [f"Answer {i+1}: {ans}" for i, ans in enumerate(previous_answers)]
    )

    return f"""
You are a senior interviewer for a {domain} position.

Conversation so far:
{history}

Rules:
- Ask ONE clear interview question
- Increase difficulty gradually
- Ask follow-up questions if answers are vague
- Keep it professional and concise

Ask the next interview question.
"""

# ---------- AI QUESTION API ----------
@app.post("/next-question")
def next_question(data: InterviewRequest):
    if not OPENROUTER_API_KEY:
        return {"error": "OpenRouter API key not configured"}

    prompt = build_prompt(data.answers, data.domain)

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "AI Interview Coach",
    }

    payload = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": "You are an AI interview coach."},
            {"role": "user", "content": prompt},
        ],
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=30,
    )

    result = response.json()

    if "choices" not in result:
        print("OpenRouter error response:", result)
        return {
            "question": "Sorry, I could not generate a question. Please try again."
        }

    question = result["choices"][0]["message"]["content"]
    return {"question": question}

# ---------- AI EVALUATION API ----------
@app.post("/evaluate")
def evaluate_interview(data: InterviewRequest):
    if not OPENROUTER_API_KEY:
        return {"error": "OpenRouter API key not configured"}

    prompt = f"""
You are an interview evaluator.

Evaluate the candidate based on these answers:
{data.answers}

Give:
1. Score out of 100
2. 2 strengths
3. 2 improvement suggestions

Return response in JSON format.
"""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": "You are an interview evaluator."},
            {"role": "user", "content": prompt},
        ],
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=30,
    )

    result = response.json()

    if "choices" not in result:
        print("Evaluation error:", result)
        return {"error": "Evaluation failed"}

    return {
        "evaluation": result["choices"][0]["message"]["content"]
    }
