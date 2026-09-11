import React, { useState, useEffect, useMemo } from "react";
import {
  Zap,
  Clock,
  RefreshCw,
  Send,
  PlayCircle,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Mail,
  Search,
  ExternalLink,
  Trash2,
  Activity,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Check,
  ChevronDown,
  Globe,
  User,
  Building,
  MapPin,
  Copy,
  Tag,
  Briefcase,
  Sliders,
  CheckCheck,
  ListFilter,
  FileSpreadsheet,
} from "lucide-react";
import { api } from "../services/api";

export interface AutomationHubProps {
  onToast: (message: string, type?: string) => void;
  onUpdateBadge?: (count: number) => void;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateStr);
  }
}

export function AutomationHub({ onToast, onUpdateBadge }: AutomationHubProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Top level view mode: "batches" (matching Leads Explorer) vs "flat"
  const [hubViewMode, setHubViewMode] = useState<"batches" | "flat">("batches");

  // Expanded Job ID in batches view
  const [expandedJobId, setExpandedJobId] = useState<string | null>("JOB-20260910074640");
  const [jobLeadsMap, setJobLeadsMap] = useState<Record<string, any[]>>({});
  const [jobLoadingMap, setJobLoadingMap] = useState<Record<string, boolean>>({});

  // Filter inside expanded job: "all" | "upcoming" | "history"
  const [innerLeadFilter, setInnerLeadFilter] = useState<"all" | "upcoming" | "history">("all");

  // Expanded individual lead inside job or flat view
  const [expandedLeadUrl, setExpandedLeadUrl] = useState<string | null>(null);

  // Flat view state
  const [flatMainTab, setFlatMainTab] = useState<"upcoming" | "history">("upcoming");
  const [typeFilter, setTypeFilter] = useState<"all" | "email" | "scraping">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [runningOutreach, setRunningOutreach] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const fetchOverview = async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const res = await api.getAutomationsOverview();
      if (res && res.success) {
        setData(res);
        if (onUpdateBadge && res.counts?.total_upcoming !== undefined) {
          onUpdateBadge(res.counts.total_upcoming);
        }

        // If there is an expanded job, ensure its leads are loaded
        const defaultJobId = res.jobs?.[0]?.id || "JOB-20260910074640";
        loadLeadsForJob(defaultJobId, res);
      } else {
        throw new Error(res?.detail || "Failed to load automations data");
      }
    } catch (e: any) {
      console.error("Error loading automations overview:", e);
      setError(e.message || "Could not retrieve automation records.");
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const loadLeadsForJob = async (jobId: string, currentData = data) => {
    if (!jobId) return;
    setJobLoadingMap((prev) => ({ ...prev, [jobId]: true }));
    try {
      // First gather any leads already embedded in currentData
      const upcomingDrips = currentData?.upcoming?.outreach_drips || [];
      const historyDrips = currentData?.history?.outreach_sent || [];
      const allDrips = [...upcomingDrips, ...historyDrips];

      const res = await api.getLeads({ scheduled_job_id: jobId, limit: 100 });
      let leads = res.leads || res.data || [];

      // Fallback if leads is empty and it's JOB-001
      if (leads.length === 0 && jobId === "JOB-001") {
        const fallback = await api.getLeads({ limit: 100 });
        leads = fallback.leads || fallback.data || [];
      }

      // Merge enriched details (contacts, outreach_mode, next_send_at, last_sent_at)
      const merged = leads.map((l: any) => {
        const dripMatch = allDrips.find((d: any) => d.job_url === l.job_url);
        return dripMatch ? { ...l, ...dripMatch } : l;
      });

      setJobLeadsMap((prev) => ({ ...prev, [jobId]: merged }));
    } catch (e) {
      console.error(`Error loading leads for ${jobId}:`, e);
    } finally {
      setJobLoadingMap((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const toggleExpandJob = (jobId: string) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
      if (!jobLeadsMap[jobId]) {
        loadLeadsForJob(jobId);
      }
    }
  };

  const toggleExpandLead = (job_url: string) => {
    setExpandedLeadUrl((prev) => (prev === job_url ? null : job_url));
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    onToast(`Copied to clipboard: ${text}`, "info");
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleRunDueOutreach = async () => {
    setRunningOutreach(true);
    try {
      const res = await api.runDueOutreach();
      if (res && res.success) {
        onToast(
          `Outreach process complete: ${res.sent ?? 0} sent, ${res.failed ?? 0} failed, ${res.due ?? 0} due processed.`,
          res.sent > 0 ? "success" : "info"
        );
        fetchOverview(true);
        if (expandedJobId) loadLeadsForJob(expandedJobId);
      } else {
        throw new Error(res?.detail || "Outreach execution failed");
      }
    } catch (e: any) {
      onToast(e.message || "Failed to run due outreach", "error");
    } finally {
      setRunningOutreach(false);
    }
  };

  const handleRunScheduledJob = async (jobId: string, title: string) => {
    setRunningJobId(jobId);
    try {
      const res = await api.runScheduledJobNow(jobId);
      onToast(res?.message || `Scheduled job "${title}" started!`, "success");
      fetchOverview(true);
    } catch (e: any) {
      onToast(e.message || `Failed to run job "${title}"`, "error");
    } finally {
      setRunningJobId(null);
    }
  };

  const handleDeleteScheduledJob = async (jobId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete scheduled job "${title}"?`)) return;
    setDeletingJobId(jobId);
    try {
      await api.deleteScheduledJob(jobId);
      onToast(`Deleted scheduled scraping job "${title}"`, "info");
      fetchOverview(true);
    } catch (e: any) {
      onToast(e.message || `Failed to delete scheduled job`, "error");
    } finally {
      setDeletingJobId(null);
    }
  };

  const counts = data?.counts || {
    total_upcoming: 0,
    upcoming_emails: 0,
    upcoming_outreach: 0,
    upcoming_scraping: 0,
    total_history: 0,
    history_emails: 0,
    history_outreach: 0,
    history_scraping: 0,
    campaign_logs: 0,
    sent_queue: 0,
  };

  const jobsList = data?.jobs || [];

  const getStageLabel = (stage: number) => {
    if (stage === 1) return "Stage 1: Initial Outreach";
    if (stage === 2) return "Stage 2: Follow-up";
    if (stage === 3) return "Stage 3: Final Touch";
    return `Stage ${stage}`;
  };

  return (
    <div style={{ maxWidth: "1480px", margin: "0 auto", padding: "1.5rem 1rem", animation: "fadeIn 0.25s ease-in-out" }}>
      {/* Top Banner & Hub Title */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 4px 14px rgba(6, 182, 212, 0.3)",
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                Automation Hub
              </h1>
              <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                Extraction Batches, Lead Extraction Timestamps, and Upcoming &amp; Past Email Automations
              </p>
            </div>
          </div>
        </div>

        {/* Global Hub Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {/* View Mode Switcher */}
          <div style={{ display: "flex", background: "var(--bg-card-subtle)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <button
              onClick={() => setHubViewMode("batches")}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                background: hubViewMode === "batches" ? "var(--bg-surface-hover)" : "transparent",
                color: hubViewMode === "batches" ? "var(--accent-cyan)" : "var(--text-muted)",
                boxShadow: hubViewMode === "batches" ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <FileSpreadsheet size={14} />
              <span>Extraction Batches Table</span>
            </button>
            <button
              onClick={() => setHubViewMode("flat")}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                background: hubViewMode === "flat" ? "var(--bg-surface-hover)" : "transparent",
                color: hubViewMode === "flat" ? "var(--accent-cyan)" : "var(--text-muted)",
                boxShadow: hubViewMode === "flat" ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <ListFilter size={14} />
              <span>Flat Feed</span>
            </button>
          </div>

          <button
            onClick={() => fetchOverview(false)}
            disabled={loading}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.85rem", fontSize: "0.84rem" }}
            title="Reload automations overview"
          >
            <RefreshCw size={14} className={loading ? "spin-animation" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleRunDueOutreach}
            disabled={runningOutreach || loading}
            className="btn btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1.05rem",
              fontSize: "0.84rem",
              background: "linear-gradient(135deg, #0284c7, #2563eb)",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
            }}
            title="Execute any cold outreach emails whose next send date is due today or past"
          >
            <Send size={14} className={runningOutreach ? "spin-animation" : ""} />
            <span>{runningOutreach ? "Sending Due Mails..." : "Trigger Due Outreach Now"}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Card 1: Upcoming Automations */}
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            padding: "1.1rem 1.25rem",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Upcoming Automations
            </span>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(6, 182, 212, 0.12)",
                color: "var(--accent-cyan)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
            {counts.total_upcoming || 0}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.35rem" }}>
            <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>{counts.upcoming_emails || 0} emails</span> (
            {counts.upcoming_outreach || 0} cold drips) • {counts.upcoming_scraping || 0} scraping
          </div>
        </div>

        {/* Card 2: Past Automations */}
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            padding: "1.1rem 1.25rem",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Past Automations (Sent)
            </span>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(16, 185, 129, 0.12)",
                color: "var(--accent-emerald)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
            {counts.total_history || 0}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.35rem" }}>
            <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>{counts.history_emails || 0} emails sent</span> •{" "}
            {counts.history_scraping || 0} scrapes run
          </div>
        </div>

        {/* Card 3: Extraction Batches */}
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            padding: "1.1rem 1.25rem",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Extraction Batches
            </span>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.12)",
                color: "var(--accent-indigo)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Layers size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
            {jobsList.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.35rem" }}>
            {jobsList.filter((j: any) => j.status === "completed").length} completed batches • {jobsList.filter((j: any) => j.status !== "completed").length} pending
          </div>
        </div>

        {/* Card 4: Background Schedulers */}
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            padding: "1.1rem 1.25rem",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Background Engines
            </span>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(16, 185, 129, 0.12)",
                color: "var(--accent-emerald)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Activity size={16} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>2</span>
            <span
              style={{
                fontSize: "0.72rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "999px",
                background: "rgba(16, 185, 129, 0.15)",
                color: "var(--accent-emerald)",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              ● 24/7 ACTIVE
            </span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.35rem" }}>
            Outreach @ {data?.schedulers?.outreach?.daily_time || "09:00"} • Scraping @{" "}
            {data?.schedulers?.scraping?.daily_time || "22:00"}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div
          style={{
            padding: "4rem 2rem",
            textAlign: "center",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <RefreshCw size={28} className="spin-animation" style={{ color: "var(--accent-cyan)", marginBottom: "1rem" }} />
          <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>Loading Automation Hub...</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Querying scheduled jobs, extraction batches, and email drip logs
          </div>
        </div>
      ) : error ? (
        <div
          style={{
            padding: "2.5rem 2rem",
            textAlign: "center",
            background: "rgba(244, 63, 94, 0.08)",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(244, 63, 94, 0.25)",
            color: "var(--accent-rose)",
          }}
        >
          <AlertCircle size={32} style={{ marginBottom: "0.5rem" }} />
          <div style={{ fontSize: "1rem", fontWeight: 700 }}>Unable to Load Automation Data</div>
          <div style={{ fontSize: "0.85rem", marginTop: "0.25rem", color: "var(--text-muted)" }}>{error}</div>
          <button onClick={() => fetchOverview(false)} className="btn btn-secondary" style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
            Retry Loading
          </button>
        </div>
      ) : (
        /* The Exact Batch Table from Leads Explorer requested by the User */
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--table-header-bg)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ width: "160px", padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    ID
                  </th>
                  <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    JOB TITLE
                  </th>
                  <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    TARGET LOCATION
                  </th>
                  <th style={{ width: "135px", padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    COMPANY SIZE
                  </th>
                  <th style={{ width: "130px", padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    SCRAPING LIMIT
                  </th>
                  <th style={{ width: "155px", padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    SCHEDULED DATE
                  </th>
                  <th style={{ width: "165px", padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    CREATED AT
                  </th>
                  <th style={{ width: "165px", padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    UPDATED AT
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      No scheduled extraction batches found in database.
                    </td>
                  </tr>
                ) : (
                  jobsList.map((job: any) => {
                    const isExpanded = expandedJobId === job.id;
                    const jobLeads = jobLeadsMap[job.id] || [];
                    const isLeadsLoading = jobLoadingMap[job.id];

                    // Filter leads for this job
                    const upcomingJobLeads = jobLeads.filter((l: any) => l.next_send_at && l.outreach_state !== "closed");
                    const pastJobLeads = jobLeads.filter((l: any) => l.last_sent_at);

                    const displayedLeads =
                      innerLeadFilter === "upcoming"
                        ? upcomingJobLeads
                        : innerLeadFilter === "history"
                        ? pastJobLeads
                        : jobLeads;

                    return (
                      <React.Fragment key={job.id}>
                        {/* Main Batch Row Matching the User's Screenshot */}
                        <tr
                          onClick={() => toggleExpandJob(job.id)}
                          style={{
                            cursor: "pointer",
                            background: isExpanded ? "rgba(6, 182, 212, 0.06)" : undefined,
                            borderBottom: isExpanded ? "none" : "1px solid var(--table-border)",
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isExpanded) e.currentTarget.style.background = "var(--table-row-hover)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isExpanded) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {/* 1. ID with Chevron */}
                          <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandJob(job.id);
                                }}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "6px",
                                  background: isExpanded ? "rgba(6, 182, 212, 0.2)" : "rgba(255, 255, 255, 0.06)",
                                  border: "1px solid",
                                  borderColor: isExpanded ? "rgba(6, 182, 212, 0.45)" : "var(--border-subtle)",
                                  color: isExpanded ? "var(--accent-cyan)" : "var(--text-primary)",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  flexShrink: 0,
                                }}
                                title={isExpanded ? "Collapse extracted leads list" : "Expand extracted leads & automations list"}
                              >
                                <ChevronDown
                                  style={{
                                    width: "15px",
                                    height: "15px",
                                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.25s ease",
                                  }}
                                />
                              </button>
                              <span
                                style={{
                                  fontFamily: "ui-monospace, monospace",
                                  fontWeight: 700,
                                  fontSize: "0.82rem",
                                  color: "var(--accent-cyan)",
                                  background: "rgba(6, 182, 212, 0.12)",
                                  border: "1px solid rgba(6, 182, 212, 0.25)",
                                  padding: "2px 7px",
                                  borderRadius: "5px",
                                  display: "inline-block",
                                }}
                              >
                                {job.id}
                              </span>
                            </div>
                          </td>

                          {/* 2. JobTitle */}
                          <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                              {job.job_title}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                              {job.status === "completed" ? (
                                <span style={{ fontSize: "0.72rem", color: "#10b981", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                  <CheckCircle style={{ width: "11px", height: "11px" }} /> Completed
                                </span>
                              ) : job.status === "running" ? (
                                <span style={{ fontSize: "0.72rem", color: "#06b6d4", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                  <div className="spinner" style={{ width: "10px", height: "10px" }} /> Scraping &amp; Enriching...
                                </span>
                              ) : job.status === "failed" ? (
                                <span style={{ fontSize: "0.72rem", color: "#ef4444", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                  <AlertCircle style={{ width: "11px", height: "11px" }} /> Failed
                                </span>
                              ) : (
                                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                  <Clock style={{ width: "11px", height: "11px" }} /> Pending
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Target Location */}
                          <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                              <MapPin style={{ width: "13px", height: "13px", color: "var(--accent-cyan)", flexShrink: 0 }} />
                              <span>{job.target_location || "Worldwide (Remote)"}</span>
                            </div>
                          </td>

                          {/* 4. Company Size */}
                          <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "var(--accent-cyan)",
                                background: "rgba(6, 182, 212, 0.08)",
                                padding: "3px 8px",
                                borderRadius: "999px",
                                border: "1px solid rgba(6, 182, 212, 0.2)",
                                display: "inline-block",
                              }}
                            >
                              {job.company_size || "Small (1-50)"}
                            </span>
                          </td>

                          {/* 5. Scraping Limit */}
                          <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                            <span
                              style={{
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                background: "rgba(255, 255, 255, 0.05)",
                                padding: "3px 9px",
                                borderRadius: "6px",
                                border: "1px solid var(--border-subtle)",
                                display: "inline-block",
                              }}
                            >
                              {job.scraping_limit} leads
                            </span>
                          </td>

                          {/* 6. Scheduled Date */}
                          <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", fontWeight: 500 }}>
                                <Calendar style={{ width: "13px", height: "13px", color: "var(--text-dim)" }} />
                                {formatDate(job.scheduled_date)}
                              </span>
                            </div>
                          </td>

                          {/* 7. Created At (When did they extract / scheduled) */}
                          <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {formatDateTime(job.created_at)}
                          </td>

                          {/* 8. Updated At */}
                          <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {formatDateTime(job.updated_at)}
                          </td>
                        </tr>

                        {/* Inline Dropdown Panel Showing Extracted Leads & Upcoming / Past Automations */}
                        {isExpanded && (
                          <tr key={`${job.id}-dropdown`}>
                            <td
                              colSpan={8}
                              style={{
                                padding: "0 0 16px 0",
                                background: "var(--bg-secondary)",
                                borderBottom: "2px solid rgba(6, 182, 212, 0.3)",
                              }}
                            >
                              <div
                                style={{
                                  margin: "8px 16px",
                                  borderRadius: "10px",
                                  background: "var(--bg-card)",
                                  border: "1px solid var(--border-subtle)",
                                  boxShadow: "var(--shadow-card)",
                                  overflow: "hidden",
                                }}
                              >
                                {/* Header banner section */}
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "12px 16px",
                                    background: "linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(99, 102, 241, 0.04))",
                                    borderBottom: "1px solid var(--border-subtle)",
                                    flexWrap: "wrap",
                                    gap: "10px",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                    <div
                                      style={{
                                        width: "28px",
                                        height: "28px",
                                        borderRadius: "6px",
                                        background: "rgba(6, 182, 212, 0.15)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "var(--accent-cyan)",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <Layers style={{ width: "16px", height: "16px" }} />
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>
                                      Extracted Leads &amp; Automations for "{job.job_title}"
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "0.74rem",
                                        fontWeight: 600,
                                        color: "var(--accent-cyan)",
                                        background: "rgba(6, 182, 212, 0.12)",
                                        border: "1px solid rgba(6, 182, 212, 0.25)",
                                        padding: "2px 8px",
                                        borderRadius: "999px",
                                      }}
                                    >
                                      {jobLeads.length} leads extracted
                                    </span>
                                  </div>

                                  {/* Sub-tabs inside batch: All vs Upcoming vs Past */}
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                    <div style={{ display: "flex", background: "var(--bg-surface)", padding: "2px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                                      <button
                                        onClick={() => setInnerLeadFilter("all")}
                                        style={{
                                          padding: "3px 8px",
                                          borderRadius: "4px",
                                          border: "none",
                                          fontSize: "0.75rem",
                                          fontWeight: 600,
                                          cursor: "pointer",
                                          background: innerLeadFilter === "all" ? "var(--bg-surface-hover)" : "transparent",
                                          color: innerLeadFilter === "all" ? "var(--accent-cyan)" : "var(--text-muted)",
                                        }}
                                      >
                                        All Leads ({jobLeads.length})
                                      </button>
                                      <button
                                        onClick={() => setInnerLeadFilter("upcoming")}
                                        style={{
                                          padding: "3px 8px",
                                          borderRadius: "4px",
                                          border: "none",
                                          fontSize: "0.75rem",
                                          fontWeight: 600,
                                          cursor: "pointer",
                                          background: innerLeadFilter === "upcoming" ? "var(--bg-surface-hover)" : "transparent",
                                          color: innerLeadFilter === "upcoming" ? "var(--accent-cyan)" : "var(--text-muted)",
                                        }}
                                      >
                                        Upcoming Mails to Send ({upcomingJobLeads.length})
                                      </button>
                                      <button
                                        onClick={() => setInnerLeadFilter("history")}
                                        style={{
                                          padding: "3px 8px",
                                          borderRadius: "4px",
                                          border: "none",
                                          fontSize: "0.75rem",
                                          fontWeight: 600,
                                          cursor: "pointer",
                                          background: innerLeadFilter === "history" ? "var(--bg-surface-hover)" : "transparent",
                                          color: innerLeadFilter === "history" ? "var(--accent-emerald)" : "var(--text-muted)",
                                        }}
                                      >
                                        Past Sent Mails ({pastJobLeads.length})
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => handleRunDueOutreach()}
                                      disabled={runningOutreach}
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                                    >
                                      <Send size={12} /> Dispatch Due
                                    </button>
                                  </div>
                                </div>

                                {/* Inner Table of Extracted Leads for this Batch */}
                                <div style={{ padding: "12px 16px" }}>
                                  {isLeadsLoading ? (
                                    <div style={{ textAlign: "center", padding: "30px" }}>
                                      <RefreshCw size={20} className="spin-animation" style={{ color: "var(--accent-cyan)", marginBottom: "8px" }} />
                                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Loading extracted leads for {job.id}...</div>
                                    </div>
                                  ) : displayedLeads.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                      {innerLeadFilter === "upcoming"
                                        ? "No upcoming emails pending to be sent for this batch."
                                        : innerLeadFilter === "history"
                                        ? "No outreach emails have been sent yet for this batch."
                                        : "No leads extracted yet for this job."}
                                    </div>
                                  ) : (
                                    <div style={{ overflowX: "auto" }}>
                                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                                        <thead>
                                          <tr style={{ background: "var(--table-header-bg)", borderBottom: "1px solid var(--border-subtle)" }}>
                                            <th style={{ width: "32px", padding: "6px 8px" }}></th>
                                            <th style={{ padding: "6px 10px", fontWeight: 600, color: "var(--text-secondary)" }}>Company &amp; Website</th>
                                            <th style={{ padding: "6px 10px", fontWeight: 600, color: "var(--text-secondary)" }}>Decision Maker &amp; Verified Email</th>
                                            <th style={{ padding: "6px 10px", fontWeight: 600, color: "var(--text-secondary)" }}>When Extracted</th>
                                            <th style={{ padding: "6px 10px", fontWeight: 600, color: "var(--text-secondary)" }}>Email Automation (Upcoming / Past)</th>
                                            <th style={{ padding: "6px 10px", fontWeight: 600, color: "var(--text-secondary)", textAlign: "right" }}>Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {displayedLeads.map((lead: any, li: number) => {
                                            const contact = Array.isArray(lead.contacts) && lead.contacts.length > 0 ? lead.contacts[0] : null;
                                            const isLeadExpanded = expandedLeadUrl === lead.job_url;
                                            const extractionDate = lead.scraped_at || lead.created_at || job.created_at;

                                            return (
                                              <React.Fragment key={lead.job_url || li}>
                                                <tr
                                                  onClick={() => toggleExpandLead(lead.job_url)}
                                                  style={{
                                                    borderBottom: isLeadExpanded ? "none" : "1px solid var(--table-border)",
                                                    cursor: "pointer",
                                                    background: isLeadExpanded ? "rgba(6, 182, 212, 0.05)" : "transparent",
                                                  }}
                                                  onMouseEnter={(e) => {
                                                    if (!isLeadExpanded) e.currentTarget.style.background = "var(--table-row-hover)";
                                                  }}
                                                  onMouseLeave={(e) => {
                                                    if (!isLeadExpanded) e.currentTarget.style.background = "transparent";
                                                  }}
                                                >
                                                  {/* Expand Lead Details Arrow */}
                                                  <td style={{ padding: "6px 8px", textAlign: "center", verticalAlign: "middle" }}>
                                                    <ChevronDown
                                                      style={{
                                                        width: "14px",
                                                        height: "14px",
                                                        color: isLeadExpanded ? "var(--accent-cyan)" : "var(--text-muted)",
                                                        transform: isLeadExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                                        transition: "transform 0.2s ease",
                                                      }}
                                                    />
                                                  </td>

                                                  {/* Company & Domain */}
                                                  <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                                                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                                                      {lead.company}
                                                    </div>
                                                    {lead.company_domain && (
                                                      <a
                                                        href={lead.company_domain.startsWith("http") ? lead.company_domain : `https://${lead.company_domain}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ fontSize: "0.74rem", color: "var(--accent-cyan)", display: "inline-flex", alignItems: "center", gap: "3px", marginTop: "2px" }}
                                                      >
                                                        <Globe style={{ width: "11px", height: "11px" }} />
                                                        <span>{lead.company_domain}</span>
                                                      </a>
                                                    )}
                                                  </td>

                                                  {/* Decision Maker & Email */}
                                                  <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                                                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                                      {contact?.name || "Executive Team"}
                                                      {contact?.role && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> ({contact.role})</span>}
                                                    </div>
                                                    {contact?.email ? (
                                                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                                                        <span style={{ color: "var(--accent-cyan)", fontFamily: "monospace", fontSize: "0.78rem" }}>
                                                          ✉ {contact.email}
                                                        </span>
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            copyToClipboard(contact.email);
                                                          }}
                                                          style={{
                                                            background: "none",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            color: copiedEmail === contact.email ? "var(--accent-emerald)" : "var(--text-muted)",
                                                          }}
                                                          title="Copy email"
                                                        >
                                                          {copiedEmail === contact.email ? <Check size={11} /> : <Copy size={11} />}
                                                        </button>
                                                        {contact.is_verified && (
                                                          <span style={{ fontSize: "0.65rem", padding: "1px 4px", borderRadius: "3px", background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)", fontWeight: 700 }}>
                                                            SMTP 250 OK
                                                          </span>
                                                        )}
                                                      </div>
                                                    ) : (
                                                      <span style={{ color: "var(--text-dim)", fontSize: "0.74rem" }}>Email pending research</span>
                                                    )}
                                                  </td>

                                                  {/* When Extracted */}
                                                  <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)", fontSize: "0.76rem" }}>
                                                      <Clock size={12} style={{ color: "var(--accent-indigo)" }} />
                                                      <span>{formatDateTime(extractionDate)}</span>
                                                    </div>
                                                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "1px" }}>
                                                      Batch: {job.id}
                                                    </div>
                                                  </td>

                                                  {/* Email Automation Status */}
                                                  <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                                                    {lead.last_sent_at ? (
                                                      <div>
                                                        <span style={{ color: "var(--accent-emerald)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                                          <Check size={12} /> Sent: {formatDateTime(lead.last_sent_at)}
                                                        </span>
                                                        <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "1px" }}>
                                                          {getStageLabel(lead.outreach_stage || 1)}
                                                        </div>
                                                      </div>
                                                    ) : lead.next_send_at ? (
                                                      <div>
                                                        <span style={{ color: "var(--accent-cyan)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                                          <Calendar size={12} /> Next Send: {formatDate(lead.next_send_at)}
                                                        </span>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                                                          <span style={{ fontSize: "0.68rem", padding: "1px 5px", borderRadius: "3px", background: "rgba(99, 102, 241, 0.12)", color: "var(--accent-indigo)", fontWeight: 600 }}>
                                                            {getStageLabel(lead.outreach_stage || 1)}
                                                          </span>
                                                          <span style={{ fontSize: "0.68rem", padding: "1px 5px", borderRadius: "3px", background: "rgba(16, 185, 129, 0.12)", color: "var(--accent-emerald)", fontWeight: 700 }}>
                                                            AUTO
                                                          </span>
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <span style={{ color: "var(--text-dim)", fontSize: "0.74rem" }}>Manual outreach</span>
                                                    )}
                                                  </td>

                                                  {/* Actions */}
                                                  <td style={{ padding: "8px 10px", verticalAlign: "middle", textAlign: "right" }}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                                                      {lead.job_url && (
                                                        <a
                                                          href={lead.job_url}
                                                          target="_blank"
                                                          rel="noreferrer"
                                                          onClick={(e) => e.stopPropagation()}
                                                          className="btn btn-secondary btn-sm"
                                                          style={{ fontSize: "0.72rem", padding: "2px 6px" }}
                                                          title="Open LinkedIn posting"
                                                        >
                                                          <ExternalLink size={11} />
                                                        </a>
                                                      )}
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          toggleExpandLead(lead.job_url);
                                                        }}
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ fontSize: "0.72rem", padding: "2px 6px" }}
                                                      >
                                                        {isLeadExpanded ? "Hide Details" : "Details"}
                                                      </button>
                                                    </div>
                                                  </td>
                                                </tr>

                                                {/* Full Lead Intelligence Expanded Sub-Panel */}
                                                {isLeadExpanded && (
                                                  <tr key={`${lead.job_url}-full`}>
                                                    <td colSpan={6} style={{ padding: "10px 14px", background: "var(--bg-card-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
                                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                                                        {/* Contacts */}
                                                        <div style={{ background: "var(--bg-card)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                                                          <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-primary)", marginBottom: "6px" }}>
                                                            Contacts ({lead.contacts?.length || 0})
                                                          </div>
                                                          {(lead.contacts || []).map((c: any, ci: number) => (
                                                            <div key={ci} style={{ fontSize: "0.76rem", marginBottom: "4px" }}>
                                                              <strong>{c.name || "Contact"}</strong> — <span style={{ color: "var(--text-muted)" }}>{c.role}</span>
                                                              {c.email && (
                                                                <div style={{ color: "var(--accent-cyan)", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "4px" }}>
                                                                  ✉ {c.email}
                                                                  {c.is_verified && <span style={{ color: "var(--accent-emerald)" }}>✓ 250 OK</span>}
                                                                </div>
                                                              )}
                                                            </div>
                                                          ))}
                                                        </div>

                                                        {/* Company & Job Intel */}
                                                        <div style={{ background: "var(--bg-card)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-subtle)", fontSize: "0.76rem" }}>
                                                          <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-primary)", marginBottom: "6px" }}>
                                                            Job Intel &amp; Synthesis
                                                          </div>
                                                          <div>📍 Location: <strong>{lead.location || "Worldwide"}</strong></div>
                                                          <div>🏢 Size: <strong>{lead.company_size || "1-50"}</strong></div>
                                                          {lead.company_summary && (
                                                            <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                                                              {lead.company_summary}
                                                            </p>
                                                          )}
                                                        </div>

                                                        {/* Multi-Stage Automation Drip */}
                                                        <div style={{ background: "var(--bg-card)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-subtle)", fontSize: "0.76rem" }}>
                                                          <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-primary)", marginBottom: "6px" }}>
                                                            Drip Journey &amp; Triggers
                                                          </div>
                                                          <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                                                            {[1, 2, 3].map((st) => (
                                                              <div
                                                                key={st}
                                                                style={{
                                                                  flex: 1,
                                                                  textAlign: "center",
                                                                  padding: "4px",
                                                                  borderRadius: "4px",
                                                                  background: (lead.outreach_stage || 1) >= st ? "rgba(16, 185, 129, 0.15)" : "var(--bg-surface)",
                                                                  color: (lead.outreach_stage || 1) >= st ? "var(--accent-emerald)" : "var(--text-muted)",
                                                                  fontWeight: 600,
                                                                  fontSize: "0.68rem",
                                                                }}
                                                              >
                                                                Step {st}
                                                              </div>
                                                            ))}
                                                          </div>
                                                          <div>Next Send: <strong>{lead.next_send_at ? formatDate(lead.next_send_at) : "None scheduled"}</strong></div>
                                                          <div>Last Sent: <strong>{lead.last_sent_at ? formatDateTime(lead.last_sent_at) : "Not sent yet"}</strong></div>
                                                          <button
                                                            onClick={handleRunDueOutreach}
                                                            className="btn btn-primary btn-sm"
                                                            style={{ marginTop: "6px", width: "100%", fontSize: "0.75rem" }}
                                                          >
                                                            Dispatch Due Outreach
                                                          </button>
                                                        </div>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                              </React.Fragment>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Bar */}
          <div
            style={{
              padding: "0.75rem 1rem",
              borderTop: "1px solid var(--border-subtle)",
              background: "var(--bg-card-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.78rem",
              color: "var(--text-dim)",
            }}
          >
            <div>
              Showing <strong>{jobsList.length}</strong> extraction batches • Click any batch row to inspect extracted leads, extraction timestamps, and upcoming / past mail automations
            </div>
            <div>
              Auto-refreshed with centralized SQLite database &amp; background schedulers
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomationHub;
