/**
 * =========================================================================================
 *  COPYRIGHT & INTELLECTUAL PROPERTY NOTICE
 * =========================================================================================
 *  © 2026 Shiva Singh. All Rights Reserved.
 *  Developer & Architect: Shiva Singh (AI Developer)
 *  Project: AI LMS - Next-Generation AI Intelligence Platform
 *  Module: ProgressChart.jsx (Student Learning Analytics & Telemetry Engine)
 * 
 *  Unauthorized copying, reproduction, or distribution of this code without express written
 *  permission from Shiva Singh is strictly prohibited.
 * =========================================================================================
 */

import React, { useState, useEffect } from "react";
import api from "../api";
import jsPDF from "jspdf";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DeveloperWatermark } from "./DeveloperAttribution";

function ProgressChart() {
  const [studentId, setStudentId] = useState("1");
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const studentPresets = ["1", "2", "3"];

  const [studentName, setStudentName] = useState("");
  const [rollNo, setRollNo] = useState("");

  const handleDownloadProgressPDF = () => {
    if (!data || data.length === 0) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`AI LMS Student Telemetry & Progress Report`, pageWidth / 2, y, { align: "center" });

    y += 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Student Name: ${studentName || "Student"}`, 15, y);
    doc.text(`Roll No: ${rollNo || studentId}  |  ID: #${studentId}`, 100, y);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 55, y);
    y += 10;

    if (summary) {
      doc.setFont("helvetica", "bold");
      doc.text(`Overview Statistics:`, 15, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`• Total Completed Quizzes: ${summary.total_quizzes}`, 20, y);
      y += 6;
      doc.text(`• Overall Average Score: ${summary.average_score} / 10`, 20, y);
      y += 6;
      doc.text(`• Highest Score Record: ${summary.highest_score} / 10`, 20, y);
      y += 12;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Topic Performance Breakdown:", 15, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Topic Name", 15, y);
    doc.text("Average Score (/10)", pageWidth - 80, y);
    doc.text("Quizzes Taken", pageWidth - 35, y);
    y += 4;
    doc.line(15, y, pageWidth - 15, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    data.forEach((row) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(String(row.topic || "General"), 15, y);
      doc.text(`${row.avg_score} / 10`, pageWidth - 80, y);
      doc.text(`${row.quiz_count || 1}`, pageWidth - 35, y);
      y += 7;
    });

    doc.save(`${(studentName || "student").replace(/\s+/g, "_")}_progress_report.pdf`);
  };

  const fetchProgress = async (idToFetch) => {
    const id = idToFetch || studentId;
    if (!id.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/analytics/progress/${encodeURIComponent(id)}`);
      const progressArray = res.data.progress || res.data.data || [];
      if (Array.isArray(progressArray)) {
        setData(progressArray);
        setSummary(res.data.summary || null);
        if (res.data.student_name) setStudentName(res.data.student_name);
        if (res.data.roll_no) setRollNo(res.data.roll_no);
      } else {
        setData([]);
        setSummary(null);
      }
    } catch (err) {
      console.error("Progress analytics error:", err);
      setError("Unable to load progress data.");
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress("1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card hud-corner" style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Header Banner */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <span style={{ color: "var(--accent-cyan)" }}>📊</span> Progress Telemetry Analytics
          </h2>
          <p className="page-subtitle">
            Track student quiz scores, performance metrics, and subject growth over time.
          </p>
        </div>
        <span style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)", padding: "6px 14px", borderRadius: "20px", fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
          SYS_LIVE_TELEMETRY
        </span>
      </div>

      {/* Student Search & Filter Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          <label style={{ margin: 0, whiteSpace: "nowrap" }}>Search Student (Name / Roll No / ID):</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Enter Student Name, Roll No, or ID..."
            style={{ maxWidth: "260px" }}
          />
          <button className="btn-primary" onClick={() => fetchProgress()} disabled={loading} style={{ padding: "10px 20px" }}>
            {loading ? "⏳" : "📊 Load Telemetry"}
          </button>
        </div>

        <div className="chip-container" style={{ margin: 0, display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", alignSelf: "center" }}>Presets:</span>
          {studentPresets.map((id) => (
            <button
              key={id}
              type="button"
              className={`chip-btn ${studentId === id ? "active" : ""}`}
              onClick={() => {
                setStudentId(id);
                fetchProgress(id);
              }}
            >
              Student #{id}
            </button>
          ))}

          {data.length > 0 && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleDownloadProgressPDF}
              style={{ padding: "8px 16px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", fontSize: "12px", marginLeft: "12px" }}
              title="Download Student Progress Telemetry PDF Report"
            >
              📄 Download Progress Report (PDF)
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && <div className="alert-error" style={{ marginBottom: "20px" }}>⚠️ {error}</div>}

      {/* Stats Metric Summary Grid */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: "28px" }}>
          <div className="stat-card hud-corner">
            <div className="stat-icon" style={{ background: "rgba(0, 212, 255, 0.1)", color: "var(--accent-cyan)" }}>📝</div>
            <div>
              <div className="stat-value">{summary.total_quizzes}</div>
              <div className="stat-label">Total Tests Taken</div>
            </div>
          </div>

          <div className="stat-card hud-corner">
            <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#34d399" }}>📈</div>
            <div>
              <div className="stat-value">{summary.average_score} <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>/ 10</span></div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>

          <div className="stat-card hud-corner">
            <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>✅</div>
            <div>
              <div className="stat-value" style={{ color: "#34d399" }}>
                {data.reduce((acc, row) => acc + (row.pass_count || 0), 0)}
              </div>
              <div className="stat-label">Pass Tests (≥40%)</div>
            </div>
          </div>

          <div className="stat-card hud-corner">
            <div className="stat-icon" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#f43f5e" }}>✕</div>
            <div>
              <div className="stat-value" style={{ color: "#fca5a5" }}>
                {data.reduce((acc, row) => acc + (row.fail_count || 0), 0)}
              </div>
              <div className="stat-label">Fail Tests (&lt;40%)</div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      {loading ? (
        <div className="alert-loading">
          <div className="pulse-dot"></div>
          Fetching telemetry performance records from database...
        </div>
      ) : data.length > 0 ? (
        <div className="hud-corner" style={{ background: "#04060c", border: "1px solid var(--border-cyan)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: "700", marginBottom: "20px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚡</span> Performance Scores by Topic (/10)
          </h3>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
              <XAxis dataKey="topic" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "var(--font-heading)" }} />
              <YAxis domain={[0, 10]} stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "var(--font-heading)" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#070a14",
                  borderColor: "var(--border-cyan)",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontFamily: "var(--font-heading)"
                }}
              />
              <Bar dataKey="avg_score" fill="url(#cyberBar)" radius={[4, 4, 0, 0]}>
                <defs>
                  <linearGradient id="cyberBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)", background: "rgba(0,0,0,0.3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-cyan)" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>📭</div>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", color: "var(--text-main)", fontWeight: "700" }}>No Telemetry Records Found</h3>
          <p style={{ fontSize: "13px", marginTop: "4px" }}>
            Take quizzes under the <strong>Quiz Generator</strong> tab to record live telemetry scores for student <strong>#{studentId}</strong>.
          </p>
        </div>
      )}

      {/* Shiva Singh AI Developer Attribution & Copyright Watermark */}
      <DeveloperWatermark moduleName="Progress Analytics" />
    </div>
  );
}

export default ProgressChart;