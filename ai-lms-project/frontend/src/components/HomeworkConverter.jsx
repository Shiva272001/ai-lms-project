import React, { useState } from "react";
import api from "../api";

function HomeworkConverter() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState("");
  const [structuredLesson, setStructuredLesson] = useState("");
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!file) {
      alert("Please upload a handwritten note image or PDF document first.");
      return;
    }

    setLoading(true);
    setRawText("");
    setStructuredLesson("");
    setPdfDownloadUrl("");
    setErrorMsg("");
    setCopied(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/converter/convert-homework", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        setRawText(response.data.extracted_raw_text);
        setStructuredLesson(response.data.digital_structured_lesson);
        if (response.data.pdf_download_url) {
          setPdfDownloadUrl(response.data.pdf_download_url);
        }
      } else {
        setErrorMsg(response.data.error || "Failed to process document.");
      }
    } catch (err) {
      console.error("Homework conversion error:", err);
      setErrorMsg(err.response?.data?.detail || "Server error while converting homework.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (structuredLesson) {
      navigator.clipboard.writeText(structuredLesson);
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
            <span style={{ color: "var(--accent-cyan)" }}>📄✨ AI LMS</span> Homework & PDF Converter
          </h2>
          <p className="page-subtitle">
            Convert handwritten notes, scanned assignment photos, or raw PDF documents into clean, structured digital lessons & downloadable PDFs.
          </p>
        </div>
        <span style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)", padding: "6px 14px", borderRadius: "20px", fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
          VISION_OCR_TRANSFORMATION
        </span>
      </div>

      {/* Upload Box Area */}
      <div style={{ background: "rgba(10, 16, 31, 0.8)", border: "1px dashed var(--accent-cyan)", borderRadius: "var(--radius-lg)", padding: "28px", textAlign: "center" }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", color: "var(--text-main)", marginBottom: "8px" }}>
          Upload Handwritten Photo or PDF Document
        </h3>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
          Supports .PNG, .JPG, .JPEG, .WEBP images and .PDF files
        </p>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.doc,.docx"
            onChange={handleFileChange}
            disabled={loading}
            style={{ maxWidth: "340px", padding: "10px" }}
          />

          <button
            className="btn-primary"
            onClick={handleConvert}
            disabled={loading || !file}
            style={{ padding: "12px 24px", fontSize: "13px" }}
          >
            {loading ? "⏳ Converting Document..." : "⚡ Convert to Digital Lesson"}
          </button>
        </div>

        {file && (
          <p style={{ marginTop: "12px", fontSize: "12px", color: "var(--accent-turquoise)", fontWeight: "600" }}>
            📁 Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="alert-error" style={{ marginTop: "16px" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="alert-loading" style={{ marginTop: "20px" }}>
          <div className="pulse-dot"></div>
          💎 AI Vision OCR Engine is transcribing handwritten notes and building structured lesson layout...
        </div>
      )}

      {/* Converted Output View */}
      {(structuredLesson || rawText) && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border-cyan)" }}>
          {/* Left Panel: Raw OCR Transcription */}
          <div className="hud-corner" style={{ background: "rgba(7, 10, 20, 0.8)", border: "1px solid var(--border-cyan)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "700", color: "var(--accent-turquoise)", marginBottom: "12px", textTransform: "uppercase" }}>
              🔍 Raw OCR Transcribed Text
            </h3>
            <div style={{ background: "#04060c", border: "1px solid var(--border-cyan)", padding: "16px", borderRadius: "4px", maxHeight: "450px", overflowY: "auto", whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: "1.6", color: "#cbd5e1" }}>
              {typeof rawText === "string" ? rawText : JSON.stringify(rawText)}
            </div>
          </div>

          {/* Right Panel: Clean Structured Digital Lesson */}
          <div className="hud-corner" style={{ background: "rgba(7, 10, 20, 0.8)", border: "1px solid var(--border-cyan)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "700", color: "var(--accent-cyan)", textTransform: "uppercase" }}>
                📘 Formatted Digital Lesson Note
              </h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopy}
                  style={{ padding: "6px 12px", fontSize: "11px" }}
                >
                  {copied ? "✓ Copied!" : "📋 Copy Lesson"}
                </button>
                {pdfDownloadUrl && (
                  <a
                    href={pdfDownloadUrl}
                    download
                    className="btn-primary"
                    style={{ padding: "6px 14px", fontSize: "11px", textDecoration: "none" }}
                  >
                    📥 Download PDF
                  </a>
                )}
              </div>
            </div>

            <div style={{ flex: 1, background: "#04060c", border: "1px solid var(--border-cyan)", padding: "16px", borderRadius: "4px", maxHeight: "450px", overflowY: "auto", whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.7", color: "#e2e8f0" }}>
              {typeof structuredLesson === "string" ? structuredLesson : JSON.stringify(structuredLesson)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeworkConverter;
