import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Play,
  Square,
  Terminal,
  Sliders,
  Globe,
  Cpu,
  CheckCircle,
  AlertTriangle,
  Wifi,
  UploadCloud,
  FileSpreadsheet,
  Download,
  X,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { api, getPipelineWsUrl } from "../services/api";

export interface PipelineRunnerProps {
  onToast: (message: string, type?: string) => void;
  onStatusChange?: (running: boolean) => void;
}

export function PipelineRunner({ onToast, onStatusChange }: PipelineRunnerProps) {
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({
    linkedin: true,
    /* indeed: false,
    glassdoor: false,
    zip_recruiter: false, */
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [companySize, setCompanySize] = useState("small");
  const [resultsLimit, setResultsLimit] = useState<string | number>(15);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "HirePilot AI Autonomous Pipeline Ready.",
    "Configure search parameters on the left and click 'Start Autonomous Engine'.",
  ]);
  const [metrics, setMetrics] = useState({ scraped: 0, enriched: 0, status: "idle" });
  const [wsConnected, setWsConnected] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const handleCopyLogs = () => {
    const text = terminalLogs.join("\n");
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    onToast("Terminal logs copied to clipboard!", "info");
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleUploadSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      onToast("Please select a CSV or Excel file to upload.", "error");
      return;
    }
    setIsUploading(true);
    try {
      const res = await api.uploadScrapingSchedule(uploadFile);
      onToast(res.message || `Imported ${res.imported_count || 0} scheduled scraping tasks!`, "success");
      setShowUploadModal(false);
      setUploadFile(null);
    } catch (err: any) {
      onToast(err.message || "Failed to upload schedule file", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const togglePlatform = (key: string) => {
    setPlatforms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyStateUpdate = (d: any) => {
    if (!d) return;
    const running = Boolean(
      d.is_running ||
      d.status === "running" ||
      d.status === "scraping" ||
      d.status === "enriching"
    );
    setIsRunning(running);
    if (onStatusChange) onStatusChange(running);
    setMetrics({
      scraped: d.processed_count || d.scraped_count || 0,
      enriched: d.metrics?.saved_to_db || d.enriched_count || 0,
      status: d.status || "idle",
    });

    if (d.logs && Array.isArray(d.logs) && d.logs.length > 0) {
      const formatted = d.logs.map((l: any) =>
        typeof l === "string" ? l : `[${l.time || ""}] ${l.message || ""}`
      );
      setTerminalLogs(formatted);
    }
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
        `[${new Date().toLocaleTimeString()}] Starting pipeline for "${searchTerm}" in "${location}" (Target Size: Small/Startup <=50) across [${selectedPlatforms.join(", ")}]...`,
      ]);

      const res = await api.startPipeline({
        sites: selectedPlatforms,
        search_term: searchTerm.trim(),
        location: location.trim(),
        limit: parseInt(String(resultsLimit), 10) || 15,
        company_size: companySize || "small",
        provider: "gemini",
        is_remote: true,
      });

      onToast(res.message || "Pipeline started successfully!", "success");
    } catch (e: any) {
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
    } catch (e: any) {
      onToast(e.message, "error");
    }
  };

  // Real-time WebSocket connection for live pipeline status, metrics, and logs
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;
    let isMounted = true;

    const connectWs = () => {
      try {
        const wsUrl = getPipelineWsUrl();
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isMounted) setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            applyStateUpdate(data);
          } catch {
            // ignore non-JSON messages like pong
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            setWsConnected(false);
            reconnectTimer = setTimeout(connectWs, 3000);
          }
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (err) {
        if (isMounted) {
          reconnectTimer = setTimeout(connectWs, 3000);
        }
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

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
              {/* <label className="checkbox-chip">
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
              </label> */}
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
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">— Select Location —</option>
                <option value="Worldwide">Worldwide (Remote)</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="India">India</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Singapore">Singapore</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
              </select>
            </div>
          </div>

          {/* Company Size & Limit */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="company-size">Target Company Size</label>
              <select
                id="company-size"
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
              >
                <option value="small">Small / Startup (1–50 employees) [Default]</option>
                <option value="medium">Medium (51–500 employees)</option>
                <option value="large">Large Enterprise (500+ employees)</option>
                <option value="all">All Company Sizes</option>
              </select>
            </div>
            <div className="form-group flex-1">
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
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
            <button
              onClick={handleStart}
              disabled={isRunning}
              className="btn btn-primary"
              style={{ flex: 1, minWidth: "200px" }}
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

          <div
            style={{
              marginTop: "1rem",
              paddingTop: "0.9rem",
              borderTop: "1px dashed var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Want to run bulk or scheduled searches?
            </span>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.78rem" }}
            >
              <UploadCloud style={{ width: "13px", height: "13px", color: "#10b981" }} />
              <span>Upload CSV / Excel Schedule</span>
            </button>
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {wsConnected && (
              <span
                style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: 500,
                }}
                title="Real-time WebSocket Stream Connected"
              >
                <Wifi style={{ width: "12px", height: "12px" }} /> Live
              </span>
            )}
            <span className={`pulse-dot ${isRunning ? "running" : ""}`} />
            <span style={{ fontSize: "0.76rem", color: isRunning ? "#10b981" : "var(--text-dim)", fontWeight: 600 }}>
              {isRunning ? "Active Agent" : "Idle"}
            </span>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div style={{ display: "flex", gap: "0.75rem", margin: "0.85rem 0", flexWrap: "wrap" }}>
          <div className="camp-stat-pill info">
            <span style={{ fontWeight: 800 }}>{metrics.scraped}</span> Scraped Jobs
          </div>
          <div className="camp-stat-pill success">
            <span style={{ fontWeight: 800 }}>{metrics.enriched}</span> Enriched Leads
          </div>
          <div className="camp-stat-pill" style={{ background: "var(--chip-bg)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            Engine: <span style={{ textTransform: "capitalize", marginLeft: "4px", color: isRunning ? "var(--accent-emerald)" : "var(--text-muted)", fontWeight: 600 }}>{metrics.status}</span>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="terminal-window" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="terminal-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="terminal-dots">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
              </div>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                hirepilot-agent-stdout • zsh
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={handleCopyLogs}
                className="btn-icon-ghost"
                style={{ width: "26px", height: "26px", borderRadius: "6px" }}
                title="Copy Terminal Output"
              >
                {copiedLogs ? <Check style={{ width: "13px", height: "13px", color: "#10b981" }} /> : <Copy style={{ width: "13px", height: "13px" }} />}
              </button>
              <button
                type="button"
                onClick={() => setTerminalLogs(["hirepilot-agent-stdout cleared."])}
                className="btn-icon-ghost"
                style={{ width: "26px", height: "26px", borderRadius: "6px" }}
                title="Clear Terminal"
              >
                <Trash2 style={{ width: "13px", height: "13px" }} />
              </button>
            </div>
          </div>
          <div className="terminal-body">
            {terminalLogs.map((line, idx) => (
              <div key={idx} style={{ marginBottom: "5px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <span style={{ color: "var(--accent-cyan)", opacity: 0.7, userSelect: "none" }}>❯</span>
                <span style={{ flex: 1, wordBreak: "break-word" }}>{line}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", opacity: 0.7, color: "var(--accent-cyan)", fontSize: "0.76rem" }}>
              <span style={{ color: "var(--text-dim)" }}>agent@hirepilot:~$</span>
              <span style={{ animation: "pulseRunning 1s infinite" }}>▋</span>
            </div>
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>

      {/* Upload Schedule Modal */}
      {showUploadModal &&
        createPortal(
          <div
            className="modal-backdrop"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(8px)",
              padding: "1rem",
            }}
            onClick={() => setShowUploadModal(false)}
          >
            <div
              className="modal-dialog glass-card"
              style={{
                width: "100%",
                maxWidth: "580px",
                padding: "1.5rem",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <UploadCloud style={{ width: "20px", height: "20px", color: "#10b981" }} />
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>Upload Scraping Schedule</h3>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="btn-icon-ghost">
                  <X style={{ width: "16px", height: "16px" }} />
                </button>
              </div>

              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "1rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                <div><strong>Supported Formats:</strong> CSV or Excel (<code>.csv</code>, <code>.xlsx</code>, <code>.xls</code>)</div>
                <div style={{ marginTop: "4px" }}>
                  <strong>Required Columns:</strong> <code>ID | JobTitle | Target Location | Company Size | Scraping Limit | Scheduled date</code>
                </div>
                <div style={{ marginTop: "4px", color: "var(--accent-cyan)" }}>
                  ⏰ The autonomous pipeline will match the scheduled date and start automatically everyday @ <strong>10:00 PM</strong> (or on demand via 'Run Now' in Discovered Leads).
                </div>
              </div>

              {/* Sample Template Downloads */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.2rem" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Download template:</span>
                <a
                  href={api.getSampleScheduleTemplateUrl("csv")}
                  download="hirepilot_scraping_schedule_template.csv"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <Download style={{ width: "12px", height: "12px" }} /> CSV Template
                </a>
                <a
                  href={api.getSampleScheduleTemplateUrl("xlsx")}
                  download="hirepilot_scraping_schedule_template.xlsx"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <Download style={{ width: "12px", height: "12px" }} /> Excel (.xlsx)
                </a>
              </div>

              <form onSubmit={handleUploadSchedule}>
                <div
                  style={{
                    border: "2px dashed var(--border-color)",
                    borderRadius: "10px",
                    padding: "24px",
                    textAlign: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    marginBottom: "1.2rem",
                    cursor: "pointer",
                  }}
                  onClick={() => document.getElementById("pipeline-file-input")?.click()}
                >
                  <FileSpreadsheet style={{ width: "36px", height: "36px", color: "#10b981", margin: "0 auto 8px", opacity: 0.8 }} />
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    {uploadFile ? uploadFile.name : "Click or drag & drop CSV or Excel file here"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB` : "Supports .csv, .xlsx, .xls"}
                  </div>
                  <input
                    id="pipeline-file-input"
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => setShowUploadModal(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !uploadFile}
                    className="btn btn-primary btn-sm"
                    style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    {isUploading ? "Importing Tasks..." : "Import Schedule into Database"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
