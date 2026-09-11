import React, { useState, useEffect, useMemo } from "react";
import {
  Zap,
  Clock,
  RefreshCw,
  Send,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Mail,
  Filter,
  Search,
  ExternalLink,
  Trash2,
  Activity,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { api } from "../services/api";

export interface AutomationHubProps {
  onToast: (message: string, type?: string) => void;
  onUpdateBadge?: (count: number) => void;
}

export function AutomationHub({ onToast, onUpdateBadge }: AutomationHubProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<"upcoming" | "history">("upcoming");
  const [typeFilter, setTypeFilter] = useState<"all" | "email" | "scraping">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [runningOutreach, setRunningOutreach] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

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

  // Compile combined Upcoming items
  const upcomingItems = useMemo(() => {
    if (!data?.upcoming) return [];
    const items: any[] = [];

    // Outreach Drips
    (data.upcoming.outreach_drips || []).forEach((lead: any) => {
      const contact = Array.isArray(lead.contacts) && lead.contacts.length > 0 ? lead.contacts[0] : null;
      items.push({
        id: `outreach-${lead.id || lead.job_url}`,
        category: "email",
        kind: "Cold Outreach Drip",
        title: lead.title || "Job Lead",
        company: lead.company || "Company",
        domain: lead.company_domain,
        contactName: contact?.name || "Executive Team",
        contactEmail: contact?.email || "Email pending",
        stage: lead.outreach_stage || 1,
        mode: lead.outreach_mode || "auto",
        state: lead.outreach_state || "open",
        scheduledTime: lead.next_send_at,
        leadType: lead.lead_type || "others",
        rawUrl: lead.job_url,
      });
    });

    // Campaign Sequences
    (data.upcoming.campaign_steps || []).forEach((step: any) => {
      items.push({
        id: `seq-${step.id}`,
        category: "email",
        kind: "Sequence Step",
        title: step.campaign_name || `Sequence Step #${step.step_number}`,
        company: "Campaign Sequence",
        contactName: step.template_name || "Template",
        contactEmail: `Step #${step.step_number}`,
        stage: step.step_number,
        scheduledTime: step.scheduled_at,
        subject: step.subject,
      });
    });

    // Queue items
    (data.upcoming.queue_items || []).forEach((q: any) => {
      items.push({
        id: `queue-${q.id}`,
        category: "email",
        kind: "Email Queue Item",
        title: q.subject || "Queued Email",
        company: q.company_name || "Queued Recipient",
        contactName: q.recipient_name || "Recipient",
        contactEmail: q.recipient_email,
        scheduledTime: q.created_at,
        status: q.status,
      });
    });

    // Scraping jobs
    (data.upcoming.scraping_jobs || []).forEach((job: any) => {
      items.push({
        id: `scraping-${job.id}`,
        category: "scraping",
        kind: "Scheduled Scraping",
        title: job.job_title,
        company: `${job.company_size || "Any size"} • ${job.scraping_limit || 15} limit`,
        targetLocation: job.target_location,
        scheduledTime: job.scheduled_date,
        status: job.status || "pending",
        rawJob: job,
      });
    });

    // Sort by scheduledTime ascending (earliest first)
    return items.sort((a, b) => {
      const ta = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 9999999999999;
      const tb = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 9999999999999;
      return ta - tb;
    });
  }, [data]);

  // Compile combined History items
  const historyItems = useMemo(() => {
    if (!data?.history) return [];
    const items: any[] = [];

    // Outreach Sent
    (data.history.outreach_sent || []).forEach((lead: any) => {
      const contact = Array.isArray(lead.contacts) && lead.contacts.length > 0 ? lead.contacts[0] : null;
      items.push({
        id: `hist-outreach-${lead.id || lead.job_url}`,
        category: "email",
        kind: "Outreach Drip Sent",
        title: lead.title || "Job Lead",
        company: lead.company || "Company",
        domain: lead.company_domain,
        contactName: contact?.name || "Executive Team",
        contactEmail: contact?.email || "Outreach Recipient",
        stage: lead.outreach_stage || 1,
        executedTime: lead.last_sent_at,
        status: "sent",
        rawUrl: lead.job_url,
      });
    });

    // Campaign Logs
    (data.history.campaign_logs || []).forEach((log: any) => {
      items.push({
        id: `hist-log-${log.id}`,
        category: "email",
        kind: "Campaign Email",
        title: log.campaign_name || "Campaign Email",
        company: log.company_name || "Target Company",
        contactName: log.recipient_name || "Contact",
        contactEmail: log.recipient_email,
        executedTime: log.sent_at,
        status: log.status || "sent",
        error: log.error_message,
      });
    });

    // Sent Queue
    (data.history.queue_sent || []).forEach((q: any) => {
      items.push({
        id: `hist-queue-${q.id}`,
        category: "email",
        kind: "Queue Send",
        title: q.subject || q.template_name || "Email",
        company: q.company_name || "Company",
        contactName: q.recipient_name || "Recipient",
        contactEmail: q.recipient_email,
        executedTime: q.sent_at,
        status: q.status || "sent",
        error: q.error_message,
      });
    });

    // Past Scraping Runs
    (data.history.scraping_runs || []).forEach((job: any) => {
      items.push({
        id: `hist-scrape-${job.id}`,
        category: "scraping",
        kind: "Scraping Job",
        title: job.job_title,
        company: `${job.target_location || "Global"} • ${job.leads_found || 0} leads`,
        targetLocation: job.target_location,
        executedTime: job.completed_at || job.created_at,
        status: job.status || "completed",
        leadsFound: job.leads_found,
        leadsEnriched: job.leads_enriched,
        error: job.error_message,
        rawJob: job,
      });
    });

    // Sort by executedTime descending (latest first)
    return items.sort((a, b) => {
      const ta = a.executedTime ? new Date(a.executedTime).getTime() : 0;
      const tb = b.executedTime ? new Date(b.executedTime).getTime() : 0;
      return tb - ta;
    });
  }, [data]);

  // Apply filters and search
  const currentList = mainTab === "upcoming" ? upcomingItems : historyItems;

  const filteredList = useMemo(() => {
    return currentList.filter((item) => {
      // Type filter
      if (typeFilter !== "all" && item.category !== typeFilter) {
        return false;
      }
      // Search filter
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.company?.toLowerCase().includes(q) ||
        item.contactName?.toLowerCase().includes(q) ||
        item.contactEmail?.toLowerCase().includes(q) ||
        item.targetLocation?.toLowerCase().includes(q) ||
        item.kind?.toLowerCase().includes(q)
      );
    });
  }, [currentList, typeFilter, searchTerm]);

  // Relative / friendly date formatting
  const formatFriendlyDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Not specified";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;

      const now = new Date();
      const diffMs = d.getTime() - now.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      const formatted = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });

      if (mainTab === "upcoming") {
        if (diffDays < 0) return `Due / Overdue (${formatted})`;
        if (diffDays === 0) return `Today (${formatted})`;
        if (diffDays === 1) return `Tomorrow (${formatted})`;
        return `In ${diffDays} days (${formatted})`;
      } else {
        const timePart = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
        return `${formatted} at ${timePart}`;
      }
    } catch {
      return dateStr;
    }
  };

  const getStageLabel = (stage: number) => {
    if (stage === 1) return "Stage 1: Initial Outreach";
    if (stage === 2) return "Stage 2: Follow-up";
    if (stage === 3) return "Stage 3: Final Touch";
    return `Stage ${stage}`;
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem 1rem", animation: "fadeIn 0.25s ease-in-out" }}>
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
                Upcoming & past autonomous workflows across Cold Outreach Drips, Email Sequences, and Scraping Jobs
              </p>
            </div>
          </div>
        </div>

        {/* Global Hub Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button
            onClick={() => fetchOverview(false)}
            disabled={loading}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 0.9rem", fontSize: "0.85rem" }}
            title="Reload automations overview"
          >
            <RefreshCw size={15} className={loading ? "spin-animation" : ""} />
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
              padding: "0.55rem 1.1rem",
              fontSize: "0.85rem",
              background: "linear-gradient(135deg, #0284c7, #2563eb)",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
            }}
            title="Execute any cold outreach emails whose next send date is due today or past"
          >
            <Send size={15} className={runningOutreach ? "spin-animation" : ""} />
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
          className="metric-card"
          onClick={() => setMainTab("upcoming")}
          style={{
            cursor: "pointer",
            border: mainTab === "upcoming" ? "1.5px solid var(--accent-cyan)" : "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            padding: "1.1rem 1.25rem",
            position: "relative",
            overflow: "hidden",
            boxShadow: mainTab === "upcoming" ? "0 8px 24px rgba(6, 182, 212, 0.15)" : "var(--shadow-card)",
            transition: "all 0.2s ease",
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
          className="metric-card"
          onClick={() => setMainTab("history")}
          style={{
            cursor: "pointer",
            border: mainTab === "history" ? "1.5px solid var(--accent-emerald)" : "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            padding: "1.1rem 1.25rem",
            position: "relative",
            overflow: "hidden",
            boxShadow: mainTab === "history" ? "0 8px 24px rgba(16, 185, 129, 0.15)" : "var(--shadow-card)",
            transition: "all 0.2s ease",
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

        {/* Card 3: Active Schedulers */}
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
                background: "rgba(99, 102, 241, 0.12)",
                color: "var(--accent-indigo)",
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

        {/* Card 4: Upcoming Highlights */}
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
              Next Scheduled Send
            </span>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(245, 158, 11, 0.12)",
                color: "var(--accent-amber)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar size={16} />
            </div>
          </div>
          <div
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.3,
              marginTop: "0.2rem",
            }}
          >
            {upcomingItems[0]?.scheduledTime ? formatFriendlyDate(upcomingItems[0].scheduledTime) : "Daily @ 09:00 AM"}
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-dim)",
              marginTop: "0.35rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {upcomingItems[0]?.title ? `Target: ${upcomingItems[0].company || upcomingItems[0].title}` : "All automations caught up"}
          </div>
        </div>
      </div>

      {/* Autonomous Schedulers Status Ribbon */}
      <div
        style={{
          background: "var(--bg-card-subtle)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* Scraping Engine Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(59, 130, 246, 0.12)",
                color: "var(--accent-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PlayCircle size={17} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Autonomous Scraping Engine
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "var(--accent-emerald)",
                    fontWeight: 700,
                  }}
                >
                  ACTIVE
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Runs daily at{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {data?.schedulers?.scraping?.daily_time || "22:00"}
                </strong>{" "}
                • Batch scrapes LinkedIn & enriches candidate leads
              </div>
            </div>
          </div>

          <div style={{ width: "1px", height: "30px", background: "var(--border-subtle)" }} className="hidden-mobile" />

          {/* Outreach Drip Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(16, 185, 129, 0.12)",
                color: "var(--accent-emerald)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mail size={17} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Daily Outreach Drip Mailer
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "var(--accent-emerald)",
                    fontWeight: 700,
                  }}
                >
                  ACTIVE
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Runs daily at{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {data?.schedulers?.outreach?.daily_time || "09:00"}
                </strong>{" "}
                • Automatically dispatches 3-stage drip sequences
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <ShieldCheck size={14} style={{ color: "var(--accent-emerald)" }} />
          <span>Centralized scheduler thread running</span>
        </div>
      </div>

      {/* Primary Section Controls: Upcoming vs Past Tabs + Filters + Search */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1.2rem",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "0.75rem 1rem",
        }}
      >
        {/* Main Tab Toggle: Upcoming vs History */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--bg-card-subtle)", padding: "0.25rem", borderRadius: "8px" }}>
          <button
            onClick={() => setMainTab("upcoming")}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: mainTab === "upcoming" ? "var(--bg-surface-hover)" : "transparent",
              color: mainTab === "upcoming" ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: mainTab === "upcoming" ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
            }}
          >
            <Clock size={15} style={{ color: mainTab === "upcoming" ? "var(--accent-cyan)" : "inherit" }} />
            <span>Upcoming Automations</span>
            <span
              style={{
                fontSize: "0.72rem",
                padding: "0.1rem 0.45rem",
                borderRadius: "999px",
                background: mainTab === "upcoming" ? "var(--accent-cyan)" : "var(--chip-bg)",
                color: mainTab === "upcoming" ? "#fff" : "var(--text-dim)",
                fontWeight: 700,
              }}
            >
              {counts.total_upcoming || 0}
            </span>
          </button>

          <button
            onClick={() => setMainTab("history")}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: mainTab === "history" ? "var(--bg-surface-hover)" : "transparent",
              color: mainTab === "history" ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: mainTab === "history" ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
            }}
          >
            <CheckCircle2 size={15} style={{ color: mainTab === "history" ? "var(--accent-emerald)" : "inherit" }} />
            <span>Past Automations (History)</span>
            <span
              style={{
                fontSize: "0.72rem",
                padding: "0.1rem 0.45rem",
                borderRadius: "999px",
                background: mainTab === "history" ? "var(--accent-emerald)" : "var(--chip-bg)",
                color: mainTab === "history" ? "#fff" : "var(--text-dim)",
                fontWeight: 700,
              }}
            >
              {counts.total_history || 0}
            </span>
          </button>
        </div>

        {/* Right side: Type Filters & Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* Category Pill Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <button
              onClick={() => setTypeFilter("all")}
              style={{
                padding: "0.35rem 0.7rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: "1px solid",
                borderColor: typeFilter === "all" ? "var(--accent-cyan)" : "var(--border-subtle)",
                background: typeFilter === "all" ? "rgba(6, 182, 212, 0.12)" : "transparent",
                color: typeFilter === "all" ? "var(--accent-cyan)" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              All ({currentList.length})
            </button>
            <button
              onClick={() => setTypeFilter("email")}
              style={{
                padding: "0.35rem 0.7rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: "1px solid",
                borderColor: typeFilter === "email" ? "var(--accent-indigo)" : "var(--border-subtle)",
                background: typeFilter === "email" ? "rgba(99, 102, 241, 0.12)" : "transparent",
                color: typeFilter === "email" ? "var(--accent-indigo)" : "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Mail size={13} />
              <span>Emails ({currentList.filter((i) => i.category === "email").length})</span>
            </button>
            <button
              onClick={() => setTypeFilter("scraping")}
              style={{
                padding: "0.35rem 0.7rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: "1px solid",
                borderColor: typeFilter === "scraping" ? "var(--accent-blue)" : "var(--border-subtle)",
                background: typeFilter === "scraping" ? "rgba(59, 130, 246, 0.12)" : "transparent",
                color: typeFilter === "scraping" ? "var(--accent-blue)" : "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <PlayCircle size={13} />
              <span>Scraping ({currentList.filter((i) => i.category === "scraping").length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              minWidth: "220px",
            }}
          >
            <Search size={14} style={{ position: "absolute", left: "10px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by contact, company, or job..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{
                paddingLeft: "2rem",
                paddingTop: "0.35rem",
                paddingBottom: "0.35rem",
                fontSize: "0.82rem",
                width: "100%",
                borderRadius: "6px",
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main List Table / Cards */}
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
            Querying upcoming schedules, cold drip leads, and sent execution logs
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
      ) : filteredList.length === 0 ? (
        <div
          style={{
            padding: "4rem 2rem",
            textAlign: "center",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "var(--bg-card-subtle)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              marginBottom: "1rem",
            }}
          >
            <Clock size={24} />
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
            No {mainTab === "upcoming" ? "upcoming" : "past"} automations found
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "440px", margin: "0.5rem auto 1.5rem" }}>
            {searchTerm
              ? `No records match "${searchTerm}". Try resetting your search query or filter.`
              : mainTab === "upcoming"
              ? "All scheduled scraping tasks and email drip sends have already fired or no automated outreach is queued."
              : "No historical executions have been recorded yet."}
          </p>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
              }}
              className="btn btn-secondary"
              style={{ fontSize: "0.85rem" }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
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
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "var(--text-secondary)" }}>Category & Type</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "var(--text-secondary)" }}>Target / Recipient</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "var(--text-secondary)" }}>Company / Location</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                    {mainTab === "upcoming" ? "Schedule / Stage" : "Executed Time & Stage"}
                  </th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "var(--text-secondary)" }}>Status</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "var(--text-secondary)", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, idx) => {
                  const isScraping = item.category === "scraping";
                  return (
                    <tr
                      key={item.id || idx}
                      style={{
                        borderBottom: "1px solid var(--table-border)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--table-row-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Column 1: Category & Type */}
                      <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "6px",
                              background: isScraping ? "rgba(59, 130, 246, 0.12)" : "rgba(99, 102, 241, 0.12)",
                              color: isScraping ? "var(--accent-blue)" : "var(--accent-indigo)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {isScraping ? <PlayCircle size={15} /> : <Mail size={15} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.82rem" }}>
                              {item.kind}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                              {isScraping ? "Autonomous Scraping" : "Autonomous Email"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Target / Recipient */}
                      <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {isScraping ? item.title : item.contactName}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            {isScraping ? (
                              <span>{item.rawJob?.company_size || "All sizes"}</span>
                            ) : (
                              <span>{item.contactEmail}</span>
                            )}
                            {item.rawUrl && (
                              <a
                                href={item.rawUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Open Job Posting"
                                style={{ color: "var(--accent-cyan)", display: "inline-flex" }}
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Company / Location */}
                      <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {isScraping ? item.targetLocation || "Global / Remote" : item.company}
                          </div>
                          {item.domain && (
                            <div style={{ fontSize: "0.74rem", color: "var(--text-dim)" }}>
                              {item.domain}
                            </div>
                          )}
                          {!isScraping && item.title && (
                            <div style={{ fontSize: "0.74rem", color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "220px" }}>
                              {item.title}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Schedule / Stage */}
                      <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                            <Clock size={13} style={{ color: "var(--accent-cyan)" }} />
                            <span>
                              {mainTab === "upcoming"
                                ? formatFriendlyDate(item.scheduledTime)
                                : formatFriendlyDate(item.executedTime)}
                            </span>
                          </div>
                          {item.stage && (
                            <div style={{ marginTop: "0.2rem" }}>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  padding: "0.1rem 0.45rem",
                                  borderRadius: "4px",
                                  background: "rgba(99, 102, 241, 0.12)",
                                  color: "var(--accent-indigo)",
                                  fontWeight: 600,
                                }}
                              >
                                {getStageLabel(item.stage)}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Status */}
                      <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                        {mainTab === "upcoming" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.75rem",
                              padding: "0.2rem 0.55rem",
                              borderRadius: "999px",
                              background: "rgba(6, 182, 212, 0.12)",
                              color: "var(--accent-cyan)",
                              fontWeight: 700,
                            }}
                          >
                            ● SCHEDULED
                          </span>
                        ) : item.status === "failed" ? (
                          <span
                            title={item.error || "Failed send"}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.75rem",
                              padding: "0.2rem 0.55rem",
                              borderRadius: "999px",
                              background: "rgba(244, 63, 94, 0.15)",
                              color: "var(--accent-rose)",
                              fontWeight: 700,
                            }}
                          >
                            <AlertCircle size={12} /> FAILED
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.75rem",
                              padding: "0.2rem 0.55rem",
                              borderRadius: "999px",
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "var(--accent-emerald)",
                              fontWeight: 700,
                            }}
                          >
                            <Check size={12} /> {isScraping ? "COMPLETED" : "SENT"}
                          </span>
                        )}
                      </td>

                      {/* Column 6: Actions */}
                      <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                          {isScraping && mainTab === "upcoming" && item.rawJob?.id && (
                            <>
                              <button
                                onClick={() => handleRunScheduledJob(item.rawJob.id, item.title)}
                                disabled={runningJobId === item.rawJob.id}
                                className="btn btn-secondary"
                                style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                                title="Run this scraping task right now"
                              >
                                <PlayCircle size={13} className={runningJobId === item.rawJob.id ? "spin-animation" : ""} />
                                <span>{runningJobId === item.rawJob.id ? "Running..." : "Run Now"}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteScheduledJob(item.rawJob.id, item.title)}
                                disabled={deletingJobId === item.rawJob.id}
                                className="btn btn-secondary"
                                style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem", color: "var(--accent-rose)" }}
                                title="Delete scheduled task"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}

                          {!isScraping && mainTab === "upcoming" && (
                            <button
                              onClick={handleRunDueOutreach}
                              disabled={runningOutreach}
                              className="btn btn-secondary"
                              style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                              title="Trigger due mail sending"
                            >
                              <Send size={12} />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {mainTab === "history" && item.rawUrl && (
                            <a
                              href={item.rawUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                            >
                              <span>View Job</span>
                              <ArrowUpRight size={12} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
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
              Showing <strong>{filteredList.length}</strong> of <strong>{currentList.length}</strong> {mainTab} automations
            </div>
            <div>
              Auto-refreshed with centralized SQLite database & background schedulers
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomationHub;
