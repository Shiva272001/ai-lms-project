import React, { useState } from "react";
import api from "../api";

function AssignmentEvaluator() {
  const [question, setQuestion] = useState("");
  const [idealAnswer, setIdealAnswer] = useState("");
  const [studentAnswer, setStudentAnswer] = useState("");

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sampleAssignment = {
    question: "Explain the process of photosynthesis and its chemical equation.",
    idealAnswer: "Photosynthesis is the biological process where plants convert solar light energy into chemical energy stored as glucose. The chemical equation is 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2. Oxygen gas is released as a byproduct.",
    studentAnswer: "Photosynthesis is when green plants use sunlight to make food (sugar). They take carbon dioxide and water and produce oxygen and glucose."
  };

  const handleLoadSample = () => {
    setQuestion(sampleAssignment.question);
    setIdealAnswer(sampleAssignment.idealAnswer);
    setStudentAnswer(sampleAssignment.studentAnswer);
    setError("");
    setResult(null);
  };

  const handleEvaluate = async () => {
    if (!question.trim() || !idealAnswer.trim() || !studentAnswer.trim()) {
      setError("Please fill in all 3 fields before evaluating.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api.post("/evaluate/assignment", {
        question: question.trim(),
        ideal_answer: idealAnswer.trim(),
        student_answer: studentAnswer.trim(),
      });

      if (res.data.result) {
        setResult(res.data.result);
      } else {
        setError("No evaluation result returned from backend.");
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      setError(err.response?.data?.detail || err.response?.data?.error || "Unable to evaluate response.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuestion("");
    setIdealAnswer("");
    setStudentAnswer("");
    setResult(null);
    setError("");
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "#10b981";
    if (score >= 5) return "#f59e0b";
    return "#f43f5e";
  };

  return (
    <div className="card hud-corner" style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Header Banner */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <span style={{ color: "var(--accent-cyan)" }}>✅</span> Automated Assignment Evaluator
          </h2>
          <p className="page-subtitle">
            Evaluate student answers against model rubrics with AI semantic scoring and constructive feedback.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button type="button" className="chip-btn" onClick={handleLoadSample} disabled={loading}>
            + Load Sample Rubric
          </button>
          <span style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)", padding: "6px 14px", borderRadius: "20px", fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
            SYS_RUBRIC_EVALUATION
          </span>
        </div>
      </div>

      {/* Input Fields */}
      <div className="form-group">
        <label>Assignment Question / Prompt</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter question prompt..."
          disabled={loading}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div className="form-group">
          <label>Model Answer / Rubric Standard</label>
          <textarea
            rows={5}
            value={idealAnswer}
            onChange={(e) => setIdealAnswer(e.target.value)}
            placeholder="Enter ideal correct answer or grading rubric..."
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Student Written Response</label>
          <textarea
            rows={5}
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
            placeholder="Paste student submission..."
            disabled={loading}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <button
          className="btn-primary"
          onClick={handleEvaluate}
          disabled={loading || !question.trim() || !idealAnswer.trim() || !studentAnswer.trim()}
          style={{ width: "220px" }}
        >
          {loading ? "⏳ Evaluating..." : "✅ Evaluate Answer"}
        </button>

        <button className="btn-secondary" onClick={handleClear} disabled={loading}>
          Clear Form
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="alert-error">⚠️ {error}</div>}

      {loading && (
        <div className="alert-loading">
          <div className="pulse-dot"></div>
          🤖 AI Neural Engine is analyzing response completeness, factual accuracy, and computing score...
        </div>
      )}

      {/* Evaluation Result Card */}
      {result && !loading && (
        <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border-cyan)" }}>
          <div className="hud-corner" style={{ background: "rgba(7, 10, 20, 0.8)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-cyan)", padding: "24px", display: "grid", gridTemplateColumns: "180px 1fr", gap: "24px", alignItems: "center" }}>
            {/* Score Ring Badge */}
            <div style={{ textAlign: "center", padding: "20px", background: "#04060c", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-cyan)" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "8px" }}>
                TELEMETRY SCORE
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "42px", fontWeight: "700", color: getScoreColor(result.score), lineHeight: "1" }}>
                {result.score}
                <span style={{ fontSize: "16px", color: "var(--text-muted)" }}>/10</span>
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", marginTop: "8px", color: getScoreColor(result.score), letterSpacing: "1px" }}>
                {result.score >= 8 ? "EXCELLENT" : result.score >= 5 ? "SATISFACTORY" : "NEEDS REVIEW"}
              </div>
            </div>

            {/* AI Feedback Detail */}
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "700", color: "var(--text-main)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px", letterSpacing: "0.5px" }}>
                💬 AI Evaluator Analysis
              </h3>
              <div style={{ background: "#04060c", border: "1px solid var(--border-cyan)", padding: "16px", borderRadius: "var(--radius-sm)", color: "#e2e8f0", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {result.feedback}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignmentEvaluator;