/**
 * =========================================================================================
 *  COPYRIGHT & INTELLECTUAL PROPERTY NOTICE
 * =========================================================================================
 *  © 2026 Shiva Singh. All Rights Reserved.
 *  Developer & Architect: Shiva Singh (AI Developer)
 *  Project: AI LMS - Next-Generation AI Intelligence Platform
 *  Module: LearningPath.jsx (Adaptive 14-Day Study Roadmap Generator)
 * 
 *  Unauthorized copying, reproduction, or distribution of this code without express written
 *  permission from Shiva Singh is strictly prohibited.
 * =========================================================================================
 */

import React, { useState } from "react";
import api from "../api";
import { DeveloperWatermark } from "./DeveloperAttribution";

function LearningPath() {
  const [studentName, setStudentName] = useState("");
  const [weakTopics, setWeakTopics] = useState("");
  const [strongTopics, setStrongTopics] = useState("");

  const [path, setPath] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSample = () => {
    setStudentName("Alex Johnson");
    setWeakTopics("Calculus, Thermodynamics, Organic Chemistry");
    setStrongTopics("Python Basics, Algebra, Newton's Laws");
    setError("");
  };

  const handleGenerate = async () => {
    if (!weakTopics.trim() && !strongTopics.trim()) {
      setError("Please specify at least one weak or strong topic.");
      return;
    }

    setLoading(true);
    setError("");
    setPath(null);

    try {
      const res = await api.post("/learning-path/generate", {
        student_name: studentName.trim() || "Student",
        weak_topics: weakTopics.split(",").map((t) => t.trim()).filter(Boolean),
        strong_topics: strongTopics.split(",").map((t) => t.trim()).filter(Boolean),
      });

      if (res.data.learning_path) {
        setPath(res.data.learning_path);
      } else {
        setError("No learning path received from backend.");
      }
    } catch (err) {
      console.error("Learning path error:", err);
      setError(err.response?.data?.detail || err.response?.data?.error || "Error generating learning path.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setStudentName("");
    setWeakTopics("");
    setStrongTopics("");
    setPath(null);
    setError("");
  };

  return (
    <div className="card hud-corner" style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Header Banner */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <span style={{ color: "var(--accent-cyan)" }}>🎯</span> Adaptive Learning Roadmap
          </h2>
          <p className="page-subtitle">
            Synthesize an adaptive 14-day study roadmap targeted at reinforcing weak concepts and advancing strong skills.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button type="button" className="chip-btn" onClick={handleSample} disabled={loading}>
            + Fill Sample Profile
          </button>
          <span style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)", padding: "6px 14px", borderRadius: "20px", fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
            SYS_ADAPTIVE_ROADMAP
          </span>
        </div>
      </div>

      {/* Input Fields */}
      <div className="form-group">
        <label>Student Profile Identity</label>
        <input
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="e.g. Alex Johnson"
          disabled={loading}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div className="form-group">
          <label>Weak Topics (Priority Revision)</label>
          <input
            type="text"
            value={weakTopics}
            onChange={(e) => setWeakTopics(e.target.value)}
            placeholder="e.g. Calculus, Organic Chemistry..."
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Proficient Topics (Advanced Reinforcement)</label>
          <input
            type="text"
            value={strongTopics}
            onChange={(e) => setStrongTopics(e.target.value)}
            placeholder="e.g. Algebra, Python Basics..."
            disabled={loading}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={loading || (!weakTopics.trim() && !strongTopics.trim())}
          style={{ width: "220px" }}
        >
          {loading ? "⏳ Generating..." : "✨ Generate Roadmap"}
        </button>

        <button className="btn-secondary" onClick={handleClear} disabled={loading}>
          Clear
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="alert-error">⚠️ {error}</div>}

      {loading && (
        <div className="alert-loading">
          <div className="pulse-dot"></div>
          🤖 AI Neural Engine is synthesizing a 14-day study plan tailored to your profile...
        </div>
      )}

      {/* Roadmap Output Timeline */}
      {path && !loading && (
        <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border-cyan)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: "700", color: "var(--text-main)", letterSpacing: "0.5px" }}>
              📚 {path.student_name}'s 14-Day Roadmap
            </h3>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "11px", color: "var(--accent-cyan)", background: "rgba(0, 212, 255, 0.08)", padding: "6px 14px", borderRadius: "12px", border: "1px solid var(--border-cyan)", letterSpacing: "1px", textTransform: "uppercase" }}>
              Duration: {path.duration || "2 Weeks"}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {Array.isArray(path.roadmap) &&
              path.roadmap.map((day) => (
                <div
                  key={day.day}
                  className="hud-corner"
                  style={{
                    background: "rgba(7, 10, 20, 0.8)",
                    border: "1px solid var(--border-cyan)",
                    borderRadius: "var(--radius-lg)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", background: "var(--cyan-gradient)", color: "#05070f", padding: "4px 10px", borderRadius: "12px" }}>
                        DAY {day.day}
                      </span>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "11px", color: "var(--accent-cyan)", fontWeight: "600" }}>
                        ⏱ {day.study_time}
                      </span>
                    </div>

                    <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px", letterSpacing: "0.5px" }}>
                      📖 {day.topic}
                    </h4>

                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px", lineHeight: "1.5" }}>
                      <strong>Focus:</strong> {day.focus}
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      <strong>🎯 Activity:</strong> {day.activity}
                    </div>
                  </div>

                  <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-cyan)", fontSize: "11px", fontFamily: "var(--font-heading)", color: "#34d399", fontWeight: "700", letterSpacing: "0.5px" }}>
                    🏆 MILESTONE: {day.goal}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Shiva Singh AI Developer Attribution & Copyright Watermark */}
      <DeveloperWatermark moduleName="Learning Path Roadmap" />
    </div>
  );
}

export default LearningPath;