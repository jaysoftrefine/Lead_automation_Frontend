import React, { useState, useEffect, useRef } from "react";
import { Play, Square, Terminal, Sliders, Globe, Cpu, CheckCircle, AlertTriangle } from "lucide-react";
import { api } from "../services/api";

export function PipelineRunner({ onToast, onStatusChange }) {
  const [platforms, setPlatforms] = useState({
    linkedin: true,
    indeed: true,
    glassdoor: false,
    zip_recruiter: false,
  });
  const [searchTerm, setSearchTerm] = useState("Software Engineer");
  const [location, setLocation] = useState("United States");
  const [resultsLimit, setResultsLimit] = useState(15);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([
    "LeadPulse AI Autonomous Pipeline Ready.",
    "Configure search parameters on the left and click 'Start Autonomous Engine'.",
  ]);
  const [metrics, setMetrics] = useState({ scraped: 0, enriched: 0, status: "idle" });

  const terminalEndRef = useRef(null);

  const togglePlatform = (key) => {
    setPlatforms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStart = async () => {
    const selectedPlatforms = Object.keys(platforms).filter((k) => platforms[k]);
    if (selectedPlatforms.length === 0) {
      onToast("Please select at least one platform.", "error");
      return;
    }
    if (!searchTerm.trim()) {
      onToast("Please provide a search term / title.", "error");
      return;
    }

    try {
      setIsRunning(true);
      if (onStatusChange) onStatusChange(true);
      setTerminalLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Starting pipeline for "${searchTerm}" in "${location}" across [${selectedPlatforms.join(", ")}]...`,
      ]);

      const res = await api.startPipeline({
        sites: selectedPlatforms,
        search_term: searchTerm.trim(),
        location: location.trim(),
        limit: parseInt(resultsLimit, 10) || 15,
        company_size: "all",
        provider: "gemini",
        is_remote: true,
      });

      onToast(res.message || "Pipeline started successfully!", "success");
      // Trigger status check immediately
      setTimeout(() => {
        api.getPipelineStatus().then((statusRes) => {
          const d = statusRes?.data || statusRes;
          if (d?.logs) {
            const formatted = d.logs.map((l) =>
              typeof l === "string" ? l : `[${l.time || ""}] ${l.message || ""}`
            );
            setTerminalLogs(formatted);
          }
        });
      }, 200);
    } catch (e) {
      setIsRunning(false);
      if (onStatusChange) onStatusChange(false);
      onToast(e.message, "error");
    }
  };

  const handleStop = async () => {
    try {
      await api.stopPipeline();
      setIsRunning(false);
      if (onStatusChange) onStatusChange(false);
      onToast("Pipeline cancellation requested.", "success");
    } catch (e) {
      onToast(e.message, "error");
    }
  };

  // Poll status while running
  useEffect(() => {
    let interval = null;
    const checkStatus = async () => {
      try {
        const res = await api.getPipelineStatus();
        const d = res?.data || res;
        if (d) {
          const running = Boolean(d.is_running || d.status === "running" || d.status === "scraping" || d.status === "enriching");
          setIsRunning(running);
          if (onStatusChange) onStatusChange(running);
          setMetrics({
            scraped: d.processed_count || d.scraped_count || 0,
            enriched: d.metrics?.saved_to_db || d.enriched_count || 0,
            status: d.status || "idle",
          });

          if (d.logs && Array.isArray(d.logs) && d.logs.length > 0) {
            const formatted = d.logs.map((l) =>
              typeof l === "string" ? l : `[${l.time || ""}] ${l.message || ""}`
            );
            setTerminalLogs(formatted);
          }
        }
      } catch (e) {
        // ignore polling errors
      }
    };

    checkStatus();
    if (isRunning) {
      interval = setInterval(checkStatus, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "1.25rem" }}>
      
      {/* Left: Configuration Form */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title-group">
            <Sliders style={{ width: "18px", height: "18px", color: "var(--accent-cyan)" }} />
            <h2>Pipeline Configuration</h2>
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          {/* Target Platforms */}
          <div className="form-group">
            <label>
              <Globe /> Target Job Platforms
            </label>
            <div className="platforms-selector">
              <label className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={platforms.linkedin}
                  onChange={() => togglePlatform("linkedin")}
                />
                <span className="chip-content">LinkedIn</span>
              </label>
              <label className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={platforms.indeed}
                  onChange={() => togglePlatform("indeed")}
                />
                <span className="chip-content">Indeed</span>
              </label>
              <label className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={platforms.glassdoor}
                  onChange={() => togglePlatform("glassdoor")}
                />
                <span className="chip-content">Glassdoor</span>
              </label>
              <label className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={platforms.zip_recruiter}
                  onChange={() => togglePlatform("zip_recruiter")}
                />
                <span className="chip-content">ZipRecruiter</span>
              </label>
            </div>
          </div>

          {/* Search Term & Location */}
          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="search-term">Target Job Title / Keywords</label>
              <input
                id="search-term"
                type="text"
                className="eu-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. AI Engineer, VP of Sales..."
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="location">Target Location</label>
              <input
                id="location"
                type="text"
                className="eu-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. United States, Remote"
              />
            </div>
          </div>

          {/* Limit */}
          <div className="form-group">
            <label htmlFor="limit">Job Scraping Limit</label>
            <select
              id="limit"
              value={resultsLimit}
              onChange={(e) => setResultsLimit(e.target.value)}
            >
              <option value="5">5 Job Postings</option>
              <option value="10">10 Job Postings</option>
              <option value="15">15 Job Postings (Recommended)</option>
              <option value="30">30 Job Postings</option>
              <option value="50">50 Job Postings</option>
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button
              onClick={handleStart}
              disabled={isRunning}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              <Play />
              <span>{isRunning ? "Pipeline Running..." : "Start Autonomous Engine"}</span>
            </button>
            {isRunning && (
              <button onClick={handleStop} className="btn btn-danger">
                <Square />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: Live Terminal & Metrics */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
        <div className="card-header">
          <div className="card-title-group">
            <Terminal style={{ width: "18px", height: "18px", color: "var(--accent-emerald)" }} />
            <h2>Live Execution Stream</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className={`pulse-dot ${isRunning ? "running" : ""}`} />
            <span style={{ fontSize: "0.76rem", color: isRunning ? "#10b981" : "var(--text-dim)", fontWeight: 600 }}>
              {isRunning ? "Active Agent" : "Idle"}
            </span>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div style={{ display: "flex", gap: "0.75rem", margin: "0.85rem 0", flexWrap: "wrap" }}>
          <div className="camp-stat-pill info">
            <span>{metrics.scraped}</span> Scraped Jobs
          </div>
          <div className="camp-stat-pill success">
            <span>{metrics.enriched}</span> Enriched Leads
          </div>
          <div className="camp-stat-pill" style={{ background: "var(--chip-bg)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            Status: <span style={{ textTransform: "capitalize", marginLeft: "4px" }}>{metrics.status}</span>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="terminal-window" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="terminal-header">
            <div className="terminal-dots">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>leadpulse-agent-stdout</span>
          </div>
          <div className="terminal-body">
            {terminalLogs.map((line, idx) => (
              <div key={idx} style={{ marginBottom: "3px" }}>
                <span style={{ color: "var(--accent-cyan)", marginRight: "6px" }}>&gt;</span>
                <span>{line}</span>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>

    </div>
  );
}
