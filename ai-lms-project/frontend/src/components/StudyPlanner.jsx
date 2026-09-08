import React, { useState } from "react";
import api from "../api";

function StudyPlanner() {
  const [subjects, setSubjects] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [daysLeft, setDaysLeft] = useState(7);

  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSample = () => {
    setSubjects("Physics, Mathematics, Computer Science, English Literature");
    setHoursPerDay(3);
    setDaysLeft(7);
    setError("");
  };

  const handleGenerate = async () => {
    if (!subjects.trim()) {
      setError("Please enter at least one subject.");
      return;
    }

    if (Number(hoursPerDay) <= 0 || Number(daysLeft) <= 0) {
      setError("Hours per day and days left must be greater than 0.");
      return;
    }

    setLoading(true);
    setError("");
    setPlan(null);

    try {
      const res = await api.post("/study-planner/generate", {
        subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
        hours_per_day: Number(hoursPerDay),
        days_left: Number(daysLeft),
      });

      let studyPlan = res.data.study_plan;
      if (typeof studyPlan === "string") {
        studyPlan = studyPlan.replace(/```json/g, "").replace(/```/g, "").trim();
        studyPlan = JSON.parse(studyPlan);
      }

      if (studyPlan && studyPlan.plan) {
        setPlan(studyPlan);
      } else {
        setError("Invalid study plan returned from backend.");
      }
    } catch (err) {
      console.error("Study planner error:", err);
      setError(err.response?.data?.detail || "Could not generate study plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSubjects("");
    setHoursPerDay(2);
    setDaysLeft(7);
    setPlan(null);
    setError("");
  };

  return (
    <div className="card hud-corner" style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Header Banner */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <span style={{ color: "var(--accent-cyan)" }}>🗓️</span> AI Study Planner & Timetable
          </h2>
          <p className="page-subtitle">
            Generate an optimized daily revision schedule tailored to your subjects, available hours, and target deadline.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button type="button" className="chip-btn" onClick={handleSample} disabled={loading}>
            + Load Sample Subjects
          </button>
          <span style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)", padding: "6px 14px", borderRadius: "20px", fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
            SYS_TIMETABLE_ALLOCATION
          </span>
        </div>
      </div>

      {/* Input Controls */}
      <div className="form-group">
        <label>Target Subjects (Comma Separated)</label>
        <input
          type="text"
          value={subjects}
          onChange={(e) => setSubjects(e.target.value)}
          placeholder="e.g. Physics, Chemistry, Mathematics, History..."
          disabled={loading}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div className="form-group">
          <label>Daily Study Capacity (Hours/Day)</label>
          <input
            type="number"
            min="1"
            max="12"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Days Remaining Until Deadline</label>
          <input
            type="number"
            min="1"
            max="60"
            value={daysLeft}
            onChange={(e) => setDaysLeft(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={loading || !subjects.trim()}
          style={{ width: "220px" }}
        >
          {loading ? "⏳ Generating..." : "✨ Generate Schedule"}
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
          🤖 AI Neural Engine is calculating time allocations and compiling day-by-day timetable grid...
        </div>
      )}

      {/* Output Timetable Grid */}
      {plan && !loading && (
        <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border-cyan)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: "700", color: "var(--text-main)", letterSpacing: "0.5px" }}>
              📚 Generated Revision Schedule
            </h3>
            <div style={{ display: "flex", gap: "12px", color: "var(--accent-cyan)", fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>
              <span>Duration: {plan.duration}</span>
              <span>•</span>
              <span>Capacity: {plan.hours_per_day} hrs/day</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {Array.isArray(plan.plan) &&
              plan.plan.map((day) => (
                <div
                  key={day.day}
                  className="hud-corner"
                  style={{
                    background: "rgba(7, 10, 20, 0.8)",
                    border: "1px solid var(--border-cyan)",
                    borderRadius: "var(--radius-lg)",
                    padding: "20px"
                  }}
                >
                  <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: "700", color: "var(--accent-cyan)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px", letterSpacing: "0.5px" }}>
                    <span>📅</span> DAY {day.day} TIMETABLE
                  </h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {Array.isArray(day.subjects) &&
                      day.subjects.map((sub, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "#04060c",
                            border: "1px solid var(--border-cyan)",
                            borderRadius: "var(--radius-sm)",
                            padding: "14px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: "700", color: "var(--text-main)", letterSpacing: "0.5px" }}>
                              📖 {sub.subject}
                            </span>
                            <span style={{ fontFamily: "var(--font-heading)", fontSize: "10px", fontWeight: "700", background: "rgba(0, 212, 255, 0.1)", color: "var(--accent-cyan)", border: "1px solid var(--border-cyan)", padding: "2px 8px", borderRadius: "10px" }}>
                              ⏱ {sub.hours} hr{sub.hours !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                            <strong>Target Activity:</strong> {sub.activity}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudyPlanner;