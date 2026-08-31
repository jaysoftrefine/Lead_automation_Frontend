import React, { useState, useEffect } from "react";
import { Zap, Settings, ShieldCheck, Clock } from "lucide-react";

export function Header({ stats, onOpenSmtp, isPipelineRunning }) {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString());
      setDateStr(
        now.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="glass-card" style={{ padding: "0.9rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        
        {/* Left: Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Zap style={{ width: "20px", height: "20px", color: "#fff" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                LeadPulse <span style={{ color: "var(--accent-cyan)" }}>AI</span>
              </h1>
              <span className="platform-badge accent" style={{ fontSize: "0.68rem" }}>
                B2B Lead Engine
              </span>
            </div>
            <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Autonomous Scraping, AI Enrichment &amp; Email Marketing
            </p>
          </div>
        </div>

        {/* Right: Clock, Status & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
          {/* Status Indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-full)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.78rem",
            }}
          >
            <span className={`pulse-dot ${isPipelineRunning ? "running" : ""}`} />
            <span style={{ color: isPipelineRunning ? "#10b981" : "var(--text-muted)", fontWeight: 600 }}>
              {isPipelineRunning ? "Pipeline Running" : "Engine Ready"}
            </span>
          </div>

          {/* Clock */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-full)",
              background: "rgba(15,23,42,0.6)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.78rem",
              fontFamily: "var(--font-mono)",
              color: "var(--text-secondary)",
            }}
          >
            <Clock style={{ width: "13px", height: "13px", color: "var(--accent-cyan)" }} />
            <span>{timeStr || "12:00:00"}</span>
            <span style={{ color: "var(--text-dim)", fontSize: "0.72rem" }}>• {dateStr}</span>
          </div>

          {/* SMTP Settings Quick Button */}
          <button
            onClick={onOpenSmtp}
            className="btn btn-secondary btn-sm"
            title="Configure SMTP Server"
          >
            <Settings style={{ width: "13px", height: "13px" }} />
            <span>SMTP Config</span>
          </button>
        </div>
      </div>
    </header>
  );
}
