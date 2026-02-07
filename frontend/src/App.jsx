import React, { useState, useEffect, useRef } from "react";
import "./App.css";

export default function App() {
  const [step, setStep] = useState(-1); // -1 intro, 0 interview, 1 score
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState([]);
  const [listening, setListening] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);


  const recognitionRef = useRef(null);

  // ---------- SPEECH RECOGNITION ----------
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported. Use Chrome.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.continuous = false;

    recognitionRef.current.onresult = (event) => {
      const text = event.results[0][0].transcript;
      handleAnswer(text);
    };
  }, []);

  // ---------- TEXT TO SPEECH ----------
  const speak = (text) => {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(msg);
  };

  // ---------- FETCH QUESTION FROM BACKEND ----------
  const fetchQuestion = async (prevAnswers) => {
    const res = await fetch("http://127.0.0.1:8000/next-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: prevAnswers,
        domain: "software engineering",
      }),
    });

    const data = await res.json();
    setQuestion(data.question);
    speak(data.question);
    setLoading(true);
    // after response
    setLoading(false);
    <p className="question-text">
    {loading ? "🤖 AI is thinking..." : question}
    </p>


  };

  // ---------- FLOW ----------
  const startInterview = () => {
    setAnswers([]);
    setScore(0);
    setStep(0);
    fetchQuestion([]);
  };

  const startListening = () => {
    setListening(true);
    recognitionRef.current.start();
  };

  const handleAnswer = (text) => {
    setListening(false);
    const newAnswers = [...answers, text];
    setAnswers(newAnswers);
    setScore((s) => s + 20);

    if (newAnswers.length >= 5) {
      setStep(1);
      return;
    }

    fetchQuestion(newAnswers);
  };

  // ---------- UI ----------
  return (
    <div className="app-container">
      {step === -1 && (
        <div className="card fade-in">
          <h1 className="title">AI Interview Coach</h1>
          <p className="subtitle">
            AI will ask questions. Answer by speaking.
          </p>
          <button className="primary-btn" onClick={startInterview}>
            Start Interview
          </button>
        </div>
      )}

      {step === 0 && (
        <div className="card slide-in">
          <h2 className="section-title">Interview Question</h2>
          <p className="question-text">{question || "Loading..."}</p>

          <button
            className={`primary-btn ${listening ? "listening" : ""}`}
            onClick={startListening}
          >
            {listening ? "🎤 Listening..." : "🎙 Speak Answer"}
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="card zoom-in">
          <h1 className="title">Interview Completed</h1>
          <h2 className="section-title">Your Score</h2>
          <h1 className="score">{score} / 100</h1>

          <button
            className="primary-btn"
            onClick={() => window.location.reload()}
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
}
