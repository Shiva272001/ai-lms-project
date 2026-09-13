/**
 * =========================================================================================
 *  COPYRIGHT & INTELLECTUAL PROPERTY NOTICE
 * =========================================================================================
 *  © 2026 Shiva Singh. All Rights Reserved.
 *  Developer & Architect: Shiva Singh (AI Developer)
 *  Project: AI LMS - Next-Generation AI Intelligence Platform
 *  Module: Chatbot.jsx (Conversational Academic AI Tutor)
 * 
 *  Unauthorized copying, reproduction, or distribution of this code without express written
 *  permission from Shiva Singh is strictly prohibited.
 * =========================================================================================
 */

import React, { useState, useRef, useEffect } from "react";
import api from "../api";
import { DeveloperWatermark } from "./DeveloperAttribution";

function Chatbot() {
  const [question, setQuestion] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [sessionId] = useState(() => {
    let saved = localStorage.getItem("ai_lms_chat_session");
    if (!saved) {
      saved = "student_" + Date.now();
      localStorage.setItem("ai_lms_chat_session", saved);
    }
    return saved;
  });

  const promptSuggestions = [
    "Explain key concepts in simple words",
    "Give me a real-world example",
    "Summarize my lesson for quick revision",
    "How can I solve difficult exam questions?"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, loading]);

  const getAnswerText = (answer) => {
    if (typeof answer === "string") return answer;
    if (answer === null || answer === undefined) return "No answer returned.";
    if (Array.isArray(answer)) {
      return answer.map((block) => (typeof block === "string" ? block : block.text || block.content || "")).join("").trim();
    }
    if (typeof answer === "object") {
      return answer.text || answer.content || JSON.stringify(answer, null, 2);
    }
    return String(answer);
  };

  const handleAsk = async (textToSend) => {
    const qText = (textToSend || question).trim();
    if (!qText || loading) return;

    setChatLog((prev) => [...prev, { role: "student", text: qText }]);
    if (!textToSend) setQuestion("");
    setLoading(true);

    try {
      const res = await api.post("/chatbot/ask", {
        student_question: qText,
        session_id: sessionId,
      });

      const answerText = getAnswerText(res.data.answer);
      setChatLog((prev) => [...prev, { role: "ai", text: answerText }]);
    } catch (err) {
      console.error("Chatbot error:", err);
      setChatLog((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ Unable to connect to AI server. Please verify backend service is active." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await api.delete(`/chatbot/clear/${sessionId}`);
    } catch (err) {
      console.error("Clear chat error:", err);
    }
    setChatLog([]);
    setQuestion("");
  };

  return (
    <div style={{ padding: "0", marginTop: "10px", marginBottom: "20px" }}>
      {/* Header Banner */}
      <div className="page-header" style={{ marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border-cyan)" }}>
        <div>
          <h2 className="page-title" style={{ fontSize: "22px", margin: "0" }}>
            <span style={{ color: "var(--accent-cyan)" }}>💬</span> Student Doubt AI Tutor
          </h2>
          <p className="page-subtitle" style={{ marginTop: "4px", fontSize: "13px" }}>
            24/7 Conversational AI tutor for doubts, step-by-step guidance, and conceptual reviews.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {chatLog.length > 0 && (
            <button className="btn-secondary" onClick={handleClear} style={{ padding: "6px 14px", fontSize: "11px" }}>
              🗑️ Clear History
            </button>
          )}
          <span style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)", padding: "4px 12px", borderRadius: "20px", fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px" }}>
            ONLINE
          </span>
        </div>
      </div>

      {/* Suggestion Chips */}
      {chatLog.length === 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div className="chip-container">
            {promptSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="chip-btn"
                onClick={() => handleAsk(prompt)}
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                💡 {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Display Box */}
      <div
        className="hud-corner"
        style={{
          height: "440px",
          overflowY: "auto",
          background: "rgba(4, 6, 12, 0.95)",
          border: "1px solid var(--border-cyan)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          marginBottom: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxShadow: "inset 0 0 25px rgba(0, 0, 0, 0.8)",
          scrollBehavior: "smooth"
        }}
      >
        {chatLog.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center", padding: "20px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                margin: "0 auto 12px",
                background: "rgba(0, 212, 255, 0.1)",
                border: "1px solid var(--accent-cyan)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                boxShadow: "0 0 25px rgba(0, 212, 255, 0.4)"
              }}
            >
              🤖
            </div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", color: "var(--text-main)", fontWeight: "700", margin: "0" }}>
              AI Tutor Terminal Ready
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "6px auto 0", maxWidth: "420px" }}>
              Type your academic doubt below or choose a suggested query prompt to begin.
            </p>
          </div>
        )}

        {chatLog.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: msg.role === "student" ? "flex-end" : "flex-start",
              alignItems: "flex-start",
              gap: "12px"
            }}
          >
            {msg.role !== "student" && (
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(0, 212, 255, 0.15)",
                  border: "1px solid var(--accent-cyan)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                  boxShadow: "0 0 12px rgba(0, 212, 255, 0.3)"
                }}
              >
                🤖
              </div>
            )}

            <div
              style={{
                maxWidth: "82%",
                padding: "14px 18px",
                borderRadius: msg.role === "student" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "student" 
                  ? "linear-gradient(135deg, #00d4ff 0%, #0284c7 100%)" 
                  : "rgba(10, 16, 31, 0.95)",
                color: msg.role === "student" ? "#05070f" : "#f8fafc",
                border: msg.role === "student" ? "none" : "1px solid var(--border-cyan)",
                boxShadow: msg.role === "student" 
                  ? "0 4px 20px rgba(0, 212, 255, 0.35)" 
                  : "0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
                fontSize: "14px",
                lineHeight: "1.65",
                fontWeight: msg.role === "student" ? "600" : "400",
                position: "relative"
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "10px",
                  fontWeight: "700",
                  color: msg.role === "student" ? "rgba(5, 7, 15, 0.85)" : "var(--accent-cyan)",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px"
                }}
              >
                <span>{msg.role === "student" ? "STUDENT" : "AI TUTOR ENGINE"}</span>
                <span style={{ fontSize: "9px", opacity: 0.7 }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.text}</div>
            </div>

            {msg.role === "student" && (
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(168, 85, 247, 0.2)",
                  border: "1px solid var(--accent-violet)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                  boxShadow: "0 0 12px rgba(168, 85, 247, 0.3)"
                }}
              >
                🎓
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(0, 212, 255, 0.15)",
                border: "1px solid var(--accent-cyan)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px"
              }}
            >
              🤖
            </div>
            <div
              style={{
                background: "rgba(10, 16, 31, 0.95)",
                border: "1px solid var(--border-cyan)",
                padding: "14px 20px",
                borderRadius: "18px 18px 18px 4px",
                color: "var(--accent-cyan)",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxShadow: "0 0 15px rgba(0, 212, 255, 0.2)"
              }}
            >
              <div className="pulse-dot"></div>
              <span style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.5px" }}>
                AI Tutor is processing query & formulating response...
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Ask your doubt or academic topic here (Press Enter)..."
          disabled={loading}
          style={{
            flex: 1,
            padding: "14px 18px",
            fontSize: "14px",
            borderRadius: "var(--radius-lg)"
          }}
        />
        <button
          className="btn-primary"
          onClick={() => handleAsk()}
          disabled={loading || !question.trim()}
          style={{ padding: "14px 22px", borderRadius: "var(--radius-lg)", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          🚀 Send Query
        </button>
      </div>

      {/* Shiva Singh AI Developer Attribution & Copyright Watermark */}
      <DeveloperWatermark moduleName="Student Doubt Chatbot" />
    </div>
  );
}

export default Chatbot;