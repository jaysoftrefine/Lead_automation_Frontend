import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Database,
  Search,
  Download,
  Globe,
  Eye,
  RefreshCw,
  Plus,
  ExternalLink,
  Calendar,
  Clock,
  UploadCloud,
  Play,
  Trash2,
  Layers,
  MapPin,
  X,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api } from "../services/api";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

export interface LeadsExplorerProps {
  onToast: (message: string, type?: string) => void;
}

export function LeadsExplorer({ onToast }: LeadsExplorerProps) {
  // Main view mode: "scheduled_jobs" (the redesigned view) vs "all_leads" (flat leads list)
  const [viewMode, setViewMode] = useState<"scheduled_jobs" | "all_leads">("scheduled_jobs");

  // --- Scheduled Jobs State ---
  const [scheduledJobs, setScheduledJobs] = useState<any[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [scheduledSearch, setScheduledSearch] = useState("");
  const [scheduledStatus, setScheduledStatus] = useState("all");
  const [scheduledPage, setScheduledPage] = useState(1);
  const [scheduledTotal, setScheduledTotal] = useState(0);

  // --- Upload Schedule Modal State ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- Scraped Data Inline Dropdown State (for a specific scheduled job) ---
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [expandedLeads, setExpandedLeads] = useState<any[]>([]);
  const [expandedLoading, setExpandedLoading] = useState(false);

  // --- Flat Leads Explorer State ---
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateField, setDateField] = useState("any");
  const [activeLeadType, setActiveLeadType] = useState<"all" | "company" | "personal" | "others">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [typeCounts, setTypeCounts] = useState({ all: 0, company: 0, personal: 0, others: 0 });
  const perPage = 50;

  // --- Lead Detail & Manual Entry Modals ---
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [manualForm, setManualForm] = useState({
    company: "",
    title: "",
    job_url: "",
    company_domain: "",
    location: "Remote",
    company_size: "Small (1-50)",
    job_type: "Full-time",
    lead_type: "company",
    lead_summary: "",
    key_technologies: "",
    contact_name: "",
    contact_role: "Hiring Manager",
    contact_email: "",
    contact_linkedin: "",
  });

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (selectedLead || showAddModal || showUploadModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedLead, showAddModal, showUploadModal]);

  // Load Scheduled Jobs
  const loadScheduledJobs = async (
    targetPage = scheduledPage,
    targetSearch = scheduledSearch,
    targetStatus = scheduledStatus
  ) => {
    setScheduledLoading(true);
    setScheduledPage(targetPage);
    try {
      const params: Record<string, any> = {
        page: targetPage,
        limit: 50,
      };
      if (targetSearch.trim()) params.search = targetSearch.trim();
      if (targetStatus && targetStatus !== "all") params.status = targetStatus;

      const res = await api.getScheduledJobs(params);
      setScheduledJobs(res.jobs || []);
      setScheduledTotal(res.total ?? (res.jobs ? res.jobs.length : 0));
    } catch (e: any) {
      onToast(e.message || "Failed to load scheduled jobs", "error");
    } finally {
      setScheduledLoading(false);
    }
  };

  // Load Flat Leads
  const loadLeads = async (
    targetPage = page,
    targetType = activeLeadType,
    targetCompanySize = companySize,
    targetSearch = searchTerm
  ) => {
    setLoading(true);
    setPage(targetPage);
    try {
      const params: Record<string, any> = {
        page: targetPage,
        limit: perPage,
      };
      if (targetCompanySize) params.company_size = targetCompanySize;
      if (targetType && targetType !== "all") params.lead_type = targetType;
      if (targetSearch.trim()) params.search = targetSearch.trim();

      if (datePreset && datePreset !== "all" && datePreset !== "custom") {
        if (datePreset === "today") params.hours_old = 24;
        else if (datePreset === "7d") params.hours_old = 168;
        else if (datePreset === "30d") params.hours_old = 720;
        else if (datePreset === "90d") params.hours_old = 2160;
      }
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (dateField && dateField !== "any") params.date_field = dateField;

      const res = await api.getLeads(params);
      setLeads(res.leads || res.data || []);
      setTotalPages(res.total_pages || 1);
      setTotalResults(res.total ?? 0);
      if (res.type_counts) {
        setTypeCounts(res.type_counts);
      }
    } catch (e: any) {
      onToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Load data on initial mount and when filter criteria changes
  useEffect(() => {
    loadScheduledJobs(1, scheduledSearch, scheduledStatus);
  }, [scheduledSearch, scheduledStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeads(1, activeLeadType, companySize, searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, companySize, activeLeadType, datePreset, dateFrom, dateTo, dateField]);

  // Toggle inline dropdown: Load and display scraped leads beneath the selected job row
  const toggleExpandJob = async (job: any) => {
    if (expandedJobId === job.id) {
      setExpandedJobId(null);
      return;
    }
    setExpandedJobId(job.id);
    setExpandedLoading(true);
    try {
      const res = await api.getLeads({ scheduled_job_id: job.id, limit: 100 });
      let jobLeads = res.leads || res.data || [];

      // Fallback for baseline JOB-001 if needed
      if (jobLeads.length === 0 && job.id === "JOB-001") {
        const fallbackRes = await api.getLeads({ limit: 100 });
        jobLeads = fallbackRes.leads || fallbackRes.data || [];
      }

      setExpandedLeads(jobLeads);
    } catch (e: any) {
      onToast(e.message || "Failed to load scraped leads for job", "error");
    } finally {
      setExpandedLoading(false);
    }
  };

  // Handle immediate trigger for a scheduled job
  const handleRunJobNow = async (jobId: string) => {
    try {
      const res = await api.runScheduledJobNow(jobId);
      onToast(res.message || `Started autonomous pipeline for job ${jobId}!`, "success");
      loadScheduledJobs(scheduledPage, scheduledSearch, scheduledStatus);
    } catch (e: any) {
      onToast(e.message || "Failed to start pipeline for this job", "error");
    }
  };

  // Handle deleting a scheduled job
  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm(`Are you sure you want to delete scheduled task ${jobId}?`)) return;
    try {
      await api.deleteScheduledJob(jobId);
      onToast(`Scheduled job ${jobId} deleted successfully.`, "success");
      loadScheduledJobs(scheduledPage, scheduledSearch, scheduledStatus);
    } catch (e: any) {
      onToast(e.message || "Failed to delete job", "error");
    }
  };

  // Handle CSV/Excel File Upload
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
      loadScheduledJobs(1, "", "all");
    } catch (err: any) {
      onToast(err.message || "Failed to upload schedule file", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Manual Lead Creation
  const handleCreateManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.company.trim() || !manualForm.title.trim()) {
      onToast("Company Name and Title are required", "error");
      return;
    }
    setSubmittingLead(true);
    try {
      const contacts: any[] = [];
      if (manualForm.contact_name.trim() || manualForm.contact_email.trim() || manualForm.contact_linkedin.trim()) {
        contacts.push({
          name: manualForm.contact_name.trim(),
          role: manualForm.contact_role.trim() || "Decision Maker",
          email: manualForm.contact_email.trim(),
          linkedin_url: manualForm.contact_linkedin.trim(),
        });
      }

      await (api as any).createManualLead({
        company: manualForm.company.trim(),
        title: manualForm.title.trim(),
        job_url: manualForm.job_url.trim() || undefined,
        company_domain: manualForm.company_domain.trim(),
        location: manualForm.location.trim() || "Remote",
        company_size: manualForm.company_size,
        job_type: manualForm.job_type,
        lead_type: manualForm.lead_type,
        lead_summary: manualForm.lead_summary.trim(),
        key_technologies: manualForm.key_technologies
          ? manualForm.key_technologies.split(",").map((t: string) => t.trim()).filter(Boolean)
          : [],
        contacts,
      });

      onToast(`Lead for '${manualForm.company}' added to SQLite database!`, "success");
      setShowAddModal(false);
      setManualForm({
        company: "",
        title: "",
        job_url: "",
        company_domain: "",
        location: "Remote",
        company_size: "Small (1-50)",
        job_type: "Full-time",
        lead_type: "company",
        lead_summary: "",
        key_technologies: "",
        contact_name: "",
        contact_role: "Hiring Manager",
        contact_email: "",
        contact_linkedin: "",
      });
      loadLeads();
      loadScheduledJobs();
    } catch (err: any) {
      onToast(err.message || "Failed to create manual lead", "error");
    } finally {
      setSubmittingLead(false);
    }
  };

  // Export Data
  const exportData = (format: "json" | "csv") => {
    if (leads.length === 0) {
      onToast("No leads to export", "error");
      return;
    }
    if (format === "json") {
      const blob = new Blob([JSON.stringify(leads, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_export_${Date.now()}.json`;
      a.click();
    } else {
      const headers = ["Company", "Location", "Website", "LinkedIn / Job URL", "Size", "Date Posted", "Date Scraped", "Contacts", "Contact LinkedIn URLs"];
      const rows = leads.map((l) => [
        `"${(l.company || "").replace(/"/g, '""')}"`,
        `"${(l.location || "").replace(/"/g, '""')}"`,
        `"${l.company_domain || ""}"`,
        `"${l.job_url || ""}"`,
        `"${l.company_size || ""}"`,
        `"${formatDate(l.date_posted)}"`,
        `"${formatDate(l.scraped_at || l.created_at)}"`,
        `"${(l.contacts || []).map((c: any) => `${c.name || ""} (${c.role || ""}): ${c.email || ""}`).join("; ").replace(/"/g, '""')}"`,
        `"${(l.contacts || []).map((c: any) => c.linkedin_url || c.linkedin || "").filter(Boolean).join("; ").replace(/"/g, '""')}"`,
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_export_${Date.now()}.csv`;
      a.click();
    }
    onToast(`Exported ${leads.length} leads as ${format.toUpperCase()}`, "success");
  };

  // Check if a scheduled job is due today
  const isJobDueToday = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().slice(0, 10);
    return dateStr.slice(0, 10) === today;
  };

  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
      {/* Top Header & View Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div className="card-title-group" style={{ margin: 0 }}>
            <Database style={{ width: "20px", height: "20px", color: "var(--accent-cyan)" }} />
            <h2 style={{ margin: 0 }}>Discovered Leads ({typeCounts.all || totalResults})</h2>
          </div>

          {/* View Mode Toggle Pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              background: "var(--bg-secondary)",
              padding: "4px",
              borderRadius: "10px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              onClick={() => setViewMode("scheduled_jobs")}
              style={{
                padding: "7px 14px",
                border: "none",
                borderRadius: "7px",
                background:
                  viewMode === "scheduled_jobs"
                    ? "linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))"
                    : "transparent",
                color: viewMode === "scheduled_jobs" ? "#fff" : "var(--text-secondary)",
                fontWeight: viewMode === "scheduled_jobs" ? 600 : 500,
                cursor: "pointer",
                fontSize: "0.84rem",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow:
                  viewMode === "scheduled_jobs"
                    ? "0 1px 4px rgba(6, 182, 212, 0.35)"
                    : "none",
                transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
              }}
            >
              <Calendar style={{ width: "14px", height: "14px", flexShrink: 0 }} />
              Scraping Tasks ({scheduledTotal})
            </button>
            <button
              onClick={() => setViewMode("all_leads")}
              style={{
                padding: "7px 14px",
                border: "none",
                borderRadius: "7px",
                background:
                  viewMode === "all_leads"
                    ? "linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))"
                    : "transparent",
                color: viewMode === "all_leads" ? "#fff" : "var(--text-secondary)",
                fontWeight: viewMode === "all_leads" ? 600 : 500,
                cursor: "pointer",
                fontSize: "0.84rem",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow:
                  viewMode === "all_leads"
                    ? "0 1px 4px rgba(6, 182, 212, 0.35)"
                    : "none",
                transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
              }}
            >
              <Database style={{ width: "14px", height: "14px", flexShrink: 0 }} />
              All Leads View ({typeCounts.all || totalResults})
            </button>
          </div>
        </div>

        {/* Action Buttons: Upload CSV/Excel, Add Lead, Export */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* Upload CSV / Excel Schedule Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary btn-sm"
            style={{
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
            }}
          >
            <UploadCloud style={{ width: "15px", height: "15px" }} />
            Upload CSV / Excel
          </button>

          {/* Refresh Current View */}
          <button
            onClick={() => {
              if (viewMode === "scheduled_jobs") loadScheduledJobs(scheduledPage, scheduledSearch, scheduledStatus);
              else loadLeads(page);
            }}
            className="btn-icon-ghost"
            title="Refresh"
          >
            <RefreshCw style={{ width: "14px", height: "14px" }} />
          </button>

          {/* Export Buttons */}
          <button onClick={() => exportData("csv")} className="btn btn-secondary btn-sm" title="Export leads as CSV">
            <Download style={{ width: "13px", height: "13px" }} /> CSV
          </button>
          <button onClick={() => exportData("json")} className="btn btn-secondary btn-sm" title="Export leads as JSON">
            <Download style={{ width: "13px", height: "13px" }} /> JSON
          </button>

          {/* Manual Entry Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "5px" }}
          >
            <Plus style={{ width: "14px", height: "14px" }} /> Add Lead
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: SCHEDULED SCRAPING JOBS TABLE (The exact requested primary view)  */}
      {/* Columns: ID | JObTiTle | Target Location | Company Size | Scraping Limit | Scheduled date | created at | Updated at | Actions */}
      {/* ========================================================================= */}
      {viewMode === "scheduled_jobs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Subheader & Filters Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.8rem" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock style={{ width: "14px", height: "14px", color: "var(--accent-cyan)" }} />
              <span>
                Daily Autonomous Engine scheduled to run automatically everyday at <strong>10:00 PM</strong> for matching jobs.
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              {/* Search scheduled jobs */}
              <div style={{ position: "relative", minWidth: "220px" }}>
                <Search
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "14px",
                    height: "14px",
                    color: "var(--text-dim)",
                  }}
                />
                <input
                  type="text"
                  className="eu-input"
                  style={{ paddingLeft: "30px", width: "100%", fontSize: "0.82rem" }}
                  placeholder="Search Job Title, Location, ID..."
                  value={scheduledSearch}
                  onChange={(e) => setScheduledSearch(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                className="eu-select"
                style={{ width: "135px", fontSize: "0.82rem" }}
                value={scheduledStatus}
                onChange={(e) => setScheduledStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Scheduled Jobs Table */}
          <div className="eu-table-wrapper">
            <table className="eu-startups-table">
              <thead>
                <tr>
                  <th style={{ width: "135px" }}>ID</th>
                  <th>Job Title</th>
                  <th>Target Location</th>
                  <th style={{ width: "130px" }}>Company Size</th>
                  <th style={{ width: "120px" }}>Scraping Limit</th>
                  <th style={{ width: "150px" }}>Scheduled Date</th>
                  <th style={{ width: "140px" }}>Created At</th>
                  <th style={{ width: "150px" }}>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {scheduledLoading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                        <div className="spinner" />
                        <span>Loading scheduled scraping tasks...</span>
                      </div>
                    </td>
                  </tr>
                ) : scheduledJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "50px", color: "var(--text-muted)" }}>
                      <FileSpreadsheet style={{ width: "36px", height: "36px", opacity: 0.4, margin: "0 auto 10px" }} />
                      <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>No Scheduled Scraping Tasks Found</div>
                      <div style={{ fontSize: "0.82rem", marginTop: "4px" }}>
                        Upload a CSV or Excel file containing your job targets or run the autonomous pipeline manually.
                      </div>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: "12px", background: "linear-gradient(135deg, #10b981, #06b6d4)" }}
                      >
                        <UploadCloud style={{ width: "14px", height: "14px" }} /> Upload Schedule File
                      </button>
                    </td>
                  </tr>
                ) : (
                  scheduledJobs.map((job) => {
                    const isDueToday = isJobDueToday(job.scheduled_date);
                    return (
                      <React.Fragment key={job.id}>
                        <tr
                          style={{
                            cursor: "pointer",
                            background: expandedJobId === job.id ? "rgba(6, 182, 212, 0.06)" : undefined,
                          }}
                          onClick={() => toggleExpandJob(job)}
                        >
                          {/* 1. ID with Down Arrow on Left */}
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandJob(job);
                                }}
                                className="btn-icon-ghost"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "6px",
                                  background: expandedJobId === job.id ? "rgba(6, 182, 212, 0.2)" : "rgba(255, 255, 255, 0.06)",
                                  border: "1px solid",
                                  borderColor: expandedJobId === job.id ? "rgba(6, 182, 212, 0.45)" : "var(--border-color)",
                                  color: expandedJobId === job.id ? "var(--accent-cyan)" : "var(--text-primary)",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  flexShrink: 0,
                                }}
                                title={expandedJobId === job.id ? "Collapse scraped leads list" : "Show whole list of scraped leads"}
                              >
                                <ChevronDown
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    transform: expandedJobId === job.id ? "rotate(180deg)" : "rotate(0deg)",
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
                          <td>
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
                          <td>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                              <MapPin style={{ width: "13px", height: "13px", color: "var(--accent-cyan)", flexShrink: 0 }} />
                              <span>{job.target_location || "Worldwide (Remote)"}</span>
                            </div>
                          </td>

                          {/* 4. Company Size */}
                          <td>
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
                          <td>
                            <span
                              style={{
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                background: "rgba(255, 255, 255, 0.05)",
                                padding: "3px 9px",
                                borderRadius: "6px",
                                border: "1px solid var(--border-color)",
                                display: "inline-block",
                              }}
                            >
                              {job.scraping_limit} leads
                            </span>
                          </td>

                          {/* 6. Scheduled Date */}
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", fontWeight: 500 }}>
                                <Calendar style={{ width: "13px", height: "13px", color: "var(--text-dim)" }} />
                                {formatDate(job.scheduled_date)}
                              </span>
                              {isDueToday && job.status === "pending" && (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    fontWeight: 600,
                                    color: "#f59e0b",
                                    background: "rgba(245, 158, 11, 0.12)",
                                    border: "1px solid rgba(245, 158, 11, 0.25)",
                                    padding: "1px 5px",
                                    borderRadius: "4px",
                                    display: "inline-block",
                                    width: "fit-content",
                                  }}
                                >
                                  Runs @ 10:00 PM
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 7. Created At */}
                          <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {formatDateTime(job.created_at)}
                          </td>

                          {/* 8. Updated At */}
                          <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {formatDateTime(job.updated_at)}
                          </td>
                        </tr>

                        {/* Inline Dropdown Panel for Scraped Data */}
                        {expandedJobId === job.id && (
                          <tr key={`${job.id}-dropdown`}>
                            <td
                              colSpan={8}
                              style={{
                                padding: "0 0 16px 0",
                                background: "var(--bg-secondary)",
                                borderBottom: "2px solid rgba(6, 182, 212, 0.25)",
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
                                      Scraped Leads for "{job.job_title}"
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
                                      {expandedLeads.length} leads discovered
                                    </span>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "0.76rem",
                                        color: "var(--text-secondary)",
                                        background: "var(--bg-surface)",
                                        padding: "3px 9px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border-subtle)",
                                      }}
                                    >
                                      📍 {job.target_location}
                                    </span>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "0.76rem",
                                        color: "var(--text-secondary)",
                                        background: "var(--bg-surface)",
                                        padding: "3px 9px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border-subtle)",
                                      }}
                                    >
                                      🏢 {job.company_size}
                                    </span>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "0.76rem",
                                        fontWeight: 600,
                                        color: "var(--accent-cyan)",
                                        background: "rgba(6, 182, 212, 0.1)",
                                        padding: "3px 9px",
                                        borderRadius: "6px",
                                        border: "1px solid rgba(6, 182, 212, 0.25)",
                                      }}
                                    >
                                      🎯 Goal: {job.scraping_limit} leads
                                    </span>
                                  </div>
                                </div>

                                {/* Inner Content Area */}
                                <div style={{ padding: "12px 16px" }}>
                                  {expandedLoading ? (
                                    <div style={{ textAlign: "center", padding: "30px" }}>
                                      <div className="spinner" style={{ margin: "0 auto 8px" }} />
                                      <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Loading scraped leads...</span>
                                    </div>
                                  ) : expandedLeads.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                      No leads scraped yet for this job. Scheduled to run automatically on {formatDate(job.scheduled_date)} at 10:00 PM.
                                    </div>
                                  ) : (
                                    <div className="eu-table-wrapper" style={{ maxHeight: "380px", overflowY: "auto", border: "1px solid var(--border-subtle)", borderRadius: "8px" }}>
                                      <table className="eu-startups-table" style={{ width: "100%", fontSize: "0.82rem" }}>
                                        <thead>
                                          <tr>
                                            <th>Company &amp; Website</th>
                                            <th>Location</th>
                                            <th>Key Decision Makers &amp; Direct Emails</th>
                                            <th style={{ width: "90px" }}>Size</th>
                                            <th style={{ width: "80px" }}>Score</th>
                                            <th style={{ width: "80px" }}>Action</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {expandedLeads.map((lead: any, li: number) => (
                                            <tr key={lead._id || li}>
                                              <td>
                                                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{lead.company}</div>
                                                {lead.company_domain && (
                                                  <a
                                                    href={lead.company_domain.startsWith("http") ? lead.company_domain : `https://${lead.company_domain}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ fontSize: "0.74rem", color: "var(--accent-cyan)", display: "inline-flex", alignItems: "center", gap: "3px" }}
                                                  >
                                                    <Globe style={{ width: "10px", height: "10px" }} />
                                                    {lead.company_domain}
                                                  </a>
                                                )}
                                              </td>
                                              <td style={{ color: "var(--text-secondary)" }}>{lead.location || "Remote"}</td>
                                              <td>
                                                {lead.contacts && lead.contacts.length > 0 ? (
                                                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                    {lead.contacts.slice(0, 2).map((c: any, ci: number) => (
                                                      <div key={ci} style={{ fontSize: "0.78rem" }}>
                                                        <span style={{ fontWeight: 600 }}>{c.name || "Executive"}</span>
                                                        <span style={{ color: "var(--text-muted)" }}> ({c.role || "Lead"})</span>
                                                        {c.email && <div style={{ color: "var(--accent-cyan)" }}>✉ {c.email}</div>}
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <span style={{ color: "var(--text-dim)", fontSize: "0.74rem" }}>Domain / No direct contact</span>
                                                )}
                                              </td>
                                              <td>
                                                <span className="size-badge" style={{ fontSize: "0.72rem" }}>{lead.company_size || "1-50"}</span>
                                              </td>
                                              <td>
                                                <span style={{ fontWeight: 700, color: lead.relevance_score >= 70 ? "#10b981" : "#f59e0b" }}>
                                                  {lead.relevance_score}/100
                                                </span>
                                              </td>
                                              <td>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedLead(lead);
                                                  }}
                                                  className="btn btn-secondary btn-sm"
                                                  style={{ fontSize: "0.72rem", padding: "2px 7px" }}
                                                >
                                                  Details
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ALL SCRAPED LEADS (Flat list view with filters & tabs)            */}
      {/* ========================================================================= */}
      {viewMode === "all_leads" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Top Filter Bar for Flat Leads */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", width: "100%" }}>
              {/* Search Box */}
              <div style={{ position: "relative", minWidth: "220px", flex: 1 }}>
                <Search
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "14px",
                    height: "14px",
                    color: "var(--text-dim)",
                  }}
                />
                <input
                  type="text"
                  className="eu-input"
                  style={{ paddingLeft: "30px", width: "100%", fontSize: "0.82rem" }}
                  placeholder="Filter leads by company, title, domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Company Size Filter */}
              <select
                className="eu-select"
                style={{ width: "140px", fontSize: "0.82rem" }}
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
              >
                <option value="">All Sizes</option>
                <option value="small">Small (1–50)</option>
                <option value="medium">Medium (51–500)</option>
                <option value="large">Large (500+)</option>
              </select>

              {/* Date Filter Dropdown */}
              <select
                className="eu-select"
                style={{ width: "125px", fontSize: "0.82rem" }}
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="today">Past 24 Hours</option>
                <option value="7d">Past 7 Days</option>
                <option value="30d">Past 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>

              {datePreset === "custom" && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="date"
                    className="eu-input"
                    style={{ width: "125px", padding: "4px 6px", fontSize: "0.78rem" }}
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>to</span>
                  <input
                    type="date"
                    className="eu-input"
                    style={{ width: "125px", padding: "4px 6px", fontSize: "0.78rem" }}
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Lead Type Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0" }}>
            {([
              { key: "all", label: "All Leads", count: typeCounts.all },
              { key: "company", label: "🏢 Company", count: typeCounts.company },
              { key: "personal", label: "👤 Personal", count: typeCounts.personal },
              { key: "others", label: "❓ Others", count: typeCounts.others },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveLeadType(tab.key);
                  setPage(1);
                }}
                style={{
                  padding: "0.5rem 1rem",
                  border: "none",
                  borderBottom: activeLeadType === tab.key ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                  background: "transparent",
                  color: activeLeadType === tab.key ? "var(--accent-cyan)" : "var(--text-muted)",
                  fontWeight: activeLeadType === tab.key ? 600 : 400,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
                <span
                  style={{
                    background: activeLeadType === tab.key ? "var(--accent-cyan)" : "var(--border-color)",
                    color: activeLeadType === tab.key ? "#fff" : "var(--text-muted)",
                    borderRadius: "999px",
                    padding: "1px 7px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Flat Leads Table */}
          <div className="eu-table-wrapper">
            <table className="eu-startups-table">
              <thead>
                <tr>
                  <th>Company &amp; Domain</th>
                  <th>Location</th>
                  <th>Date Posted &amp; Scraped</th>
                  <th>Key Decision Makers &amp; Contacts</th>
                  <th>Size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                        <div className="spinner" />
                        <span>Loading database leads...</span>
                      </div>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      No leads found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead, idx) => (
                    <tr key={lead._id || idx}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.92rem" }}>
                          {lead.company || "Unnamed Company"}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                          {lead.company_domain && (
                            <a
                              href={lead.company_domain.startsWith("http") ? lead.company_domain : `https://${lead.company_domain}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--accent-cyan)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                textDecoration: "none",
                              }}
                            >
                              <Globe style={{ width: "11px", height: "11px" }} />
                              <span>{lead.company_domain}</span>
                            </a>
                          )}
                          {lead.job_url && (
                            <a
                              href={lead.job_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                textDecoration: "none",
                              }}
                            >
                              <ExternalLink style={{ width: "11px", height: "11px" }} />
                              <span>Job Posting</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {lead.location || "Remote"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                          <div>Posted: {formatDate(lead.date_posted)}</div>
                          <div>Scraped: {formatDate(lead.scraped_at || lead.created_at)}</div>
                        </div>
                      </td>
                      <td>
                        {lead.contacts && lead.contacts.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {lead.contacts.slice(0, 2).map((c: any, ci: number) => (
                              <div key={ci} style={{ fontSize: "0.8rem" }}>
                                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.name || "Executive"}</span>
                                <span style={{ color: "var(--text-muted)" }}> ({c.role || "Contact"})</span>
                                {c.email && (
                                  <div style={{ color: "var(--accent-cyan)", fontSize: "0.75rem" }}>
                                    ✉ {c.email}
                                  </div>
                                )}
                              </div>
                            ))}
                            {lead.contacts.length > 2 && (
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                +{lead.contacts.length - 2} more contacts
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>Domain / No direct contact</span>
                        )}
                      </td>
                      <td>
                        <span className="size-badge">{lead.company_size || "1-50"}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Eye style={{ width: "12px", height: "12px" }} /> Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination for flat leads */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button
                disabled={page <= 1 || loading}
                onClick={() => loadLeads(page - 1)}
                className="btn btn-secondary btn-sm"
              >
                ‹ Prev
              </button>
              <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => loadLeads(page + 1)}
                className="btn btn-secondary btn-sm"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}



      {/* ========================================================================= */}
      {/* MODAL 2: UPLOAD CSV / EXCEL SCHEDULE MODAL                                */}
      {/* ========================================================================= */}
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
                  ⏰ The autonomous pipeline will match the scheduled date and start automatically everyday @ <strong>10:00 PM</strong> (or on demand via 'Run Now').
                </div>
              </div>

              {/* Sample Template Downloads */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.2rem" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Download sample template:</span>
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
                {/* File Dropzone / Selector */}
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
                  onClick={() => document.getElementById("schedule-file-input")?.click()}
                >
                  <FileSpreadsheet style={{ width: "36px", height: "36px", color: "#10b981", margin: "0 auto 8px", opacity: 0.8 }} />
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    {uploadFile ? uploadFile.name : "Click or drag & drop CSV or Excel file here"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB` : "Supports .csv, .xlsx, .xls"}
                  </div>
                  <input
                    id="schedule-file-input"
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

      {/* ========================================================================= */}
      {/* MODAL 3: LEAD DETAIL MODAL                                                */}
      {/* ========================================================================= */}
      {selectedLead &&
        createPortal(
          <div
            className="modal-backdrop"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(8px)",
              padding: "1rem",
            }}
            onClick={() => setSelectedLead(null)}
          >
            <div
              className="modal-dialog glass-card"
              style={{
                width: "100%",
                maxWidth: "680px",
                maxHeight: "88vh",
                overflowY: "auto",
                padding: "1.5rem",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>{selectedLead.company}</h3>
                  <div style={{ color: "var(--accent-cyan)", fontSize: "0.85rem", marginTop: "2px" }}>{selectedLead.title}</div>
                </div>
                <button onClick={() => setSelectedLead(null)} className="btn-icon-ghost">
                  <X style={{ width: "16px", height: "16px" }} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1rem", fontSize: "0.82rem" }}>
                <div><strong>Location:</strong> {selectedLead.location || "Remote"}</div>
                <div><strong>Company Size:</strong> {selectedLead.company_size || "Unspecified"}</div>
                <div><strong>Domain:</strong> {selectedLead.company_domain || "—"}</div>
                <div><strong>Relevance Score:</strong> {selectedLead.relevance_score || 50}/100</div>
              </div>

              {selectedLead.contacts && selectedLead.contacts.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <h4 style={{ fontSize: "0.9rem", marginBottom: "0.5rem", color: "var(--accent-cyan)" }}>Discovered Contacts ({selectedLead.contacts.length})</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedLead.contacts.map((c: any, i: number) => (
                      <div key={i} style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-color)", padding: "8px 12px", borderRadius: "6px", fontSize: "0.82rem" }}>
                        <div style={{ fontWeight: 600 }}>{c.name} — <span style={{ color: "var(--text-muted)" }}>{c.role}</span></div>
                        {c.email && <div style={{ color: "var(--accent-cyan)", marginTop: "2px" }}>✉ {c.email}</div>}
                        {c.linkedin_url && (
                          <a href={c.linkedin_url} target="_blank" rel="noreferrer" style={{ color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "3px", marginTop: "2px", textDecoration: "none" }}>
                            <ExternalLink style={{ width: "11px", height: "11px" }} /> LinkedIn Profile
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLead.lead_summary && (
                <div style={{ marginBottom: "1rem" }}>
                  <h4 style={{ fontSize: "0.9rem", marginBottom: "0.4rem", color: "var(--accent-cyan)" }}>Opportunity Summary</h4>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, background: "rgba(255, 255, 255, 0.02)", padding: "10px", borderRadius: "6px" }}>
                    {selectedLead.lead_summary}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button onClick={() => setSelectedLead(null)} className="btn btn-secondary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL 4: MANUAL LEAD CREATION MODAL                                       */}
      {/* ========================================================================= */}
      {showAddModal &&
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
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              backdropFilter: "blur(8px)",
              padding: "1rem",
            }}
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="modal-dialog glass-card"
              style={{
                width: "100%",
                maxWidth: "620px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "1.5rem",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Plus style={{ width: "18px", height: "18px", color: "var(--accent-cyan)" }} />
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>Add Manual Lead to SQLite</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="btn-icon-ghost">
                  <X style={{ width: "16px", height: "16px" }} />
                </button>
              </div>

              <form onSubmit={handleCreateManualLead} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      required
                      className="eu-input"
                      placeholder="e.g. Stripe, Acme Corp"
                      value={manualForm.company}
                      onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Job / Opportunity Title *</label>
                    <input
                      type="text"
                      required
                      className="eu-input"
                      placeholder="e.g. Senior Backend Engineer"
                      value={manualForm.title}
                      onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                  <div className="form-group">
                    <label>Company Domain / Website</label>
                    <input
                      type="text"
                      className="eu-input"
                      placeholder="e.g. acme.com"
                      value={manualForm.company_domain}
                      onChange={(e) => setManualForm({ ...manualForm, company_domain: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      className="eu-input"
                      placeholder="e.g. Remote, San Francisco, CA"
                      value={manualForm.location}
                      onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    disabled={submittingLead}
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingLead}
                    className="btn btn-primary btn-sm"
                    style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
                  >
                    {submittingLead ? "Saving to DB..." : "Save Lead to Database"}
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
