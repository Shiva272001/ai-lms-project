import React, { useState } from "react";
import api from "../api";

function LessonGenerator() {
  const [topic, setTopic] = useState("");
  const [className, setClassName] = useState(5);

  const [lesson, setLesson] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [audioScriptLanguage, setAudioScriptLanguage] = useState("English");
  const [audioScript, setAudioScript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [scriptLoading, setScriptLoading] = useState(false);

  const topicPresets = [
    "Photosynthesis & Plant Biology",
    "Newton's Laws of Motion",
    "Python Basics & Data Structures",
    "Solar System & Planets",
    "Water Cycle & Climate",
    "Human Digestive System"
  ];

  const resolveUrl = (rawUrl) => {
    if (!rawUrl) return "";
    let cleanUrl = rawUrl;
    if (cleanUrl.includes("127.0.0.1:8000") || cleanUrl.includes("localhost:8000")) {
      const imgIdx = cleanUrl.indexOf("/images/");
      const pdfIdx = cleanUrl.indexOf("/lesson/");
      const audioIdx = cleanUrl.indexOf("/audios/");
      if (imgIdx !== -1) cleanUrl = cleanUrl.substring(imgIdx);
      else if (pdfIdx !== -1) cleanUrl = cleanUrl.substring(pdfIdx);
      else if (audioIdx !== -1) cleanUrl = cleanUrl.substring(audioIdx);
    }
    if (cleanUrl.startsWith("/")) {
      const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
      return `${base}${cleanUrl}`;
    }
    return cleanUrl;
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic.");
      return;
    }

    setLoading(true);
    setLesson("");
    setImageUrl("");
    setImageError("");
    setPdfUrl("");
    setCopied(false);

    try {
      const response = await api.post("/lesson/generate", {
        topic: topic.trim(),
        class_name: Number(className),
      });

      setLesson(response.data.lesson || "No lesson generated.");

      const rawImg = response.data.image_full_url || response.data.image_url;
      if (rawImg) {
        setImageUrl(resolveUrl(rawImg));
      }

      const rawPdf = response.data.pdf_download_url || response.data.pdf_url;
      if (rawPdf) {
        setPdfUrl(resolveUrl(rawPdf));
      }
    } catch (error) {
      console.error("Lesson generation error:", error);
      if (error.response) {
        setLesson("Backend Error:\n" + JSON.stringify(error.response.data, null, 2));
      } else {
        setLesson("Unable to connect to backend server.");
      }
    } finally {
      setLoading(false);
    }
  };

  const [audioDownloadUrl, setAudioDownloadUrl] = useState("");

  const handleGenerateScript = async (lang) => {
    if (!topic.trim()) {
      alert("Please enter a topic first.");
      return;
    }

    setScriptLoading(true);
    setAudioScriptLanguage(lang);
    setAudioScript("");
    setAudioUrl("");
    setAudioDownloadUrl("");

    try {
      const response = await api.post("/lesson/generate-audio-script", {
        topic: topic.trim(),
        class_name: Number(className),
        language: lang,
        source_content: lesson || topic.trim()
      });

      if (response.data.script) {
        setAudioScript(response.data.script);
      }
      if (response.data.audio_url) {
        setAudioUrl(resolveUrl(response.data.audio_url));
      }
      if (response.data.audio_download_url) {
        setAudioDownloadUrl(resolveUrl(response.data.audio_download_url));
      }
    } catch (error) {
      console.error("Audio script generation error:", error);
      alert("Failed to generate audio script.");
    } finally {
      setScriptLoading(false);
    }
  };

  const handleCopy = () => {
    if (lesson) {
      navigator.clipboard.writeText(lesson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card hud-corner" style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Header Banner */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <span style={{ color: "var(--accent-cyan)" }}>💎 AI LMS</span> Lesson & Audio Generator
          </h2>
          <p className="page-subtitle">
            Synthesize grade-tailored educational lessons complete with AI visual diagrams, downloadable PDF notes, and NotebookLM Audio/Video scripts.
          </p>
        </div>
        <span style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)", padding: "6px 14px", borderRadius: "20px", fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
          AI_LMS_AUDIO_VIDEO_SYNTHESIS
        </span>
      </div>

      {/* Input Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "20px" }}>
        <div className="form-group">
          <label>Topic / Subject Concept</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis, Quantum Physics, Solar System..."
            disabled={loading}
          />
          {/* Quick Topic Chips */}
          <div className="chip-container">
            {topicPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className={`chip-btn ${topic === preset ? "active" : ""}`}
                onClick={() => setTopic(preset)}
                disabled={loading}
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Grade Level Target</label>
          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            disabled={loading}
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
              <option key={c} value={c}>
                Class {c} Level
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons & NotebookLM Audio/Video Options */}
      <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          style={{ width: "220px" }}
        >
          {loading ? "⏳ Synthesizing..." : "✨ Generate Lesson"}
        </button>

        {/* NotebookLM Audio/Video Options */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "rgba(0, 212, 255, 0.05)", border: "1px solid var(--border-cyan)", padding: "6px 14px", borderRadius: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-cyan)", fontFamily: "var(--font-heading)" }}>
            🎙️ NotebookLM Audio & Video:
          </span>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleGenerateScript("English")}
            disabled={scriptLoading || !topic.trim()}
            style={{ padding: "6px 14px", fontSize: "12px" }}
          >
            {scriptLoading && audioScriptLanguage === "English" ? "⏳ Generating..." : "🇬🇧 English Voice & Video Script"}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleGenerateScript("Hinglish")}
            disabled={scriptLoading || !topic.trim()}
            style={{ padding: "6px 14px", fontSize: "12px" }}
          >
            {scriptLoading && audioScriptLanguage === "Hinglish" ? "⏳ Generating..." : "🇮🇳 Hinglish Voice & Video Script"}
          </button>
        </div>
      </div>

      {/* Image Error Alert */}
      {imageError && (
        <div className="alert-error">
          ⚠️ {imageError}
        </div>
      )}

      {/* Loading Skeleton Indicator */}
      {loading && (
        <div className="alert-loading">
          <div className="pulse-dot"></div>
          💎 AI LMS Engine is synthesizing structured lesson notes and rendering diagram...
        </div>
      )}

      {/* Audio Script Generation Loading Indicator */}
      {scriptLoading && (
        <div className="alert-loading" style={{ marginTop: "16px" }}>
          <div className="pulse-dot"></div>
          🎙️ AI LMS Master Teacher is synthesizing NotebookLM {audioScriptLanguage} audio script and audio overview...
        </div>
      )}

      {/* NotebookLM Audio Preview & Script Panel */}
      {audioScript && !scriptLoading && (
        <div className="hud-corner" style={{ marginTop: "24px", background: "rgba(10, 20, 35, 0.9)", border: "1px solid var(--accent-cyan)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: "700", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "8px" }}>
              💎 AI LMS NotebookLM Audio Overview ({audioScriptLanguage})
            </h3>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                navigator.clipboard.writeText(audioScript);
                alert("Audio script copied!");
              }}
              style={{ padding: "6px 12px", fontSize: "11px" }}
            >
              📋 Copy Script
            </button>
          </div>

          {/* Audio Player Preview & Download */}
          {audioUrl && (
            <div style={{ marginBottom: "16px", background: "#050814", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-cyan)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <p style={{ fontSize: "12px", color: "var(--accent-turquoise)", fontWeight: "600", fontFamily: "var(--font-heading)" }}>
                  🔊 Audio & Video Lesson Overview (Female Teacher Voice - {audioScriptLanguage})
                </p>
                {audioDownloadUrl && (
                  <a
                    href={audioDownloadUrl}
                    download
                    className="btn-primary"
                    style={{ padding: "4px 12px", fontSize: "11px", textDecoration: "none" }}
                  >
                    ⬇️ Download Audio (.mp3)
                  </a>
                )}
              </div>
              <audio controls src={audioUrl} style={{ width: "100%" }}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          <div
            style={{
              background: "#04060c",
              border: "1px solid var(--border-cyan)",
              borderRadius: "var(--radius-sm)",
              padding: "16px",
              maxHeight: "300px",
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              fontSize: "13px",
              lineHeight: "1.6",
              color: "#cbd5e1"
            }}
          >
            {audioScript}
          </div>
        </div>
      )}

      {/* Output HUD Panel */}
      {(lesson || imageUrl) && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border-cyan)" }}>
          {/* Left Panel: Diagram Card */}
          <div className="hud-corner" style={{ background: "rgba(7, 10, 20, 0.8)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-cyan)", padding: "20px" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--accent-cyan)" }}>
              🖼️ Visual Diagram
            </h3>

            {imageUrl && !imageError ? (
              <div style={{ textAlign: "center" }}>
                <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={imageUrl}
                    alt="Educational Visual"
                    style={{
                      width: "100%",
                      maxHeight: "380px",
                      objectFit: "cover",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-cyan-bright)",
                      boxShadow: "0 0 25px rgba(0, 212, 255, 0.2)",
                      transition: "transform 0.2s ease"
                    }}
                    onError={() => setImageError("Image preview failed to load.")}
                  />
                </a>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "10px", fontFamily: "var(--font-heading)", letterSpacing: "1px" }}>
                  🔍 CLICK DIAGRAM TO EXPAND HI-RES
                </p>
              </div>
            ) : (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", background: "rgba(0,0,0,0.3)", borderRadius: "var(--radius-sm)" }}>
                {imageError ? `⚠️ ${imageError}` : "No diagram preview available for this topic."}
              </div>
            )}
          </div>

          {/* Right Panel: Content Card */}
          <div className="hud-corner" style={{ background: "rgba(7, 10, 20, 0.8)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-cyan)", padding: "20px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--accent-cyan)" }}>
                📚 Synthesized Notes
              </h3>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopy}
                  style={{ padding: "6px 12px", fontSize: "11px" }}
                >
                  {copied ? "✓ Copied!" : "📋 Copy Notes"}
                </button>

                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ padding: "6px 14px", fontSize: "11px", textDecoration: "none" }}
                  >
                    📥 Download PDF
                  </a>
                )}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                background: "#04060c",
                border: "1px solid var(--border-cyan)",
                borderRadius: "var(--radius-sm)",
                padding: "20px",
                maxHeight: "500px",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                fontSize: "14px",
                lineHeight: "1.7",
                color: "#e2e8f0"
              }}
            >
              {lesson}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LessonGenerator;