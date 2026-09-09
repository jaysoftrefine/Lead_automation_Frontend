import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Database, Search, Download, Globe, Eye, RefreshCw, Plus, UserPlus, ExternalLink, Calendar, Clock } from "lucide-react";
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

export interface LeadsExplorerProps {
  onToast: (message: string, type?: string) => void;
}

export function LeadsExplorer({ onToast }: LeadsExplorerProps) {
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
    } catch (err: any) {
      onToast(err.message || "Failed to create manual lead", "error");
    } finally {
      setSubmittingLead(false);
    }
  };

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (selectedLead || showAddModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedLead, showAddModal]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeads(1, activeLeadType, companySize, searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, companySize, activeLeadType, datePreset, dateFrom, dateTo, dateField]);

  const handleLeadTypeChange = async (job_url: string, newType: string) => {
    // Optimistically update local state
    setLeads((prev) =>
      prev.map((l) => (l.job_url === job_url ? { ...l, lead_type: newType } : l))
    );
    try {
      await (api as any).updateLeadType(job_url, newType);
      onToast(`Lead type updated to "${newType}"`, "success");
      // Reload in background to sync counts & pagination
      loadLeads(page, activeLeadType, companySize, searchTerm);
    } catch (e: any) {
      onToast(e.message || "Failed to update lead type", "error");
      loadLeads(page, activeLeadType, companySize, searchTerm);
    }
  };

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
      // CSV
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

  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Top Filter Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div className="card-title-group">
          <Database style={{ width: "18px", height: "18px", color: "var(--accent-cyan)" }} />
          <h2>Discovered Leads ({typeCounts.all || totalResults})</h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* Search Box */}
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
              style={{ paddingLeft: "30px" }}
              placeholder="Filter leads by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Company Size */}
          <select
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
            style={{ width: "auto" }}
          >
            <option value="">All Sizes</option>
            <option value="small">Small (1-50)</option>
            <option value="medium">Medium (51-500)</option>
            <option value="large">Large (500+)</option>
          </select>

          {/* Date Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <select
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value);
                if (e.target.value !== "custom") {
                  setDateFrom("");
                  setDateTo("");
                }
              }}
              style={{ width: "auto" }}
            >
              <option value="all">📅 All Dates</option>
              <option value="today">Past 24 Hours</option>
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
              <option value="90d">Past 90 Days</option>
              <option value="custom">Custom Date Range...</option>
            </select>

            {datePreset === "custom" && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="date"
                  className="eu-input"
                  style={{ width: "125px", padding: "4px 6px", fontSize: "0.78rem" }}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="From"
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>to</span>
                <input
                  type="date"
                  className="eu-input"
                  style={{ width: "125px", padding: "4px 6px", fontSize: "0.78rem" }}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="To"
                />
              </div>
            )}
          </div>

          {/* Refresh */}
          <button onClick={() => loadLeads(page)} className="btn-icon-ghost" title="Refresh Leads">
            <RefreshCw style={{ width: "14px", height: "14px" }} />
          </button>

          {/* Export Buttons */}
          <button onClick={() => exportData("csv")} className="btn btn-secondary btn-sm">
            <Download style={{ width: "13px", height: "13px" }} /> CSV
          </button>
          <button onClick={() => exportData("json")} className="btn btn-secondary btn-sm">
            <Download style={{ width: "13px", height: "13px" }} /> JSON
          </button>

          {/* Manual Entry Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)", display: "flex", alignItems: "center", gap: "5px" }}
          >
            <Plus style={{ width: "14px", height: "14px" }} /> Add Lead
          </button>
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
            <span style={{
              background: activeLeadType === tab.key ? "var(--accent-cyan)" : "var(--border-color)",
              color: activeLeadType === tab.key ? "#fff" : "var(--text-muted)",
              borderRadius: "999px",
              padding: "1px 7px",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Leads Table */}
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
                  No leads found. Run the Pipeline Runner to scrape and discover B2B leads.
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
                      {/* Company LinkedIn or Job Posting Link */}
                      {(() => {
                        const isHttp =
                          lead.job_url &&
                          (lead.job_url.startsWith("http://") || lead.job_url.startsWith("https://"));
                        const isAgent =
                          lead.site === "instant_agent" ||
                          (lead.job_url && lead.job_url.startsWith("agent://"));
                        const isManual =
                          lead.site === "manual" ||
                          (lead.job_url && lead.job_url.startsWith("manual://"));

                        if (isHttp) {
                          const isLinkedIn = lead.job_url.includes("linkedin.com");
                          return (
                            <a
                              href={lead.job_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: "0.75rem",
                                color: isLinkedIn ? "#0a66c2" : "var(--accent-cyan)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                textDecoration: "none",
                                fontWeight: 600,
                              }}
                              title={isLinkedIn ? "Open LinkedIn Job Posting" : "Open Original Job Posting"}
                            >
                              <ExternalLink style={{ width: "11px", height: "11px" }} />
                              <span>{isLinkedIn ? "LinkedIn Job" : "Job Posting"}</span>
                            </a>
                          );
                        }

                        // For agent-researched or manual leads: provide real working LinkedIn company search link
                        const linkedinSearchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.company)}`;

                        return (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <a
                              href={linkedinSearchUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: "0.75rem",
                                color: "#0a66c2",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                textDecoration: "none",
                                fontWeight: 600,
                              }}
                              title={`Search ${lead.company} on LinkedIn`}
                            >
                              <ExternalLink style={{ width: "11px", height: "11px" }} />
                              <span>LinkedIn</span>
                            </a>

                            {isAgent && (
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(168, 85, 247, 0.12)",
                                  color: "var(--accent-violet)",
                                  border: "1px solid rgba(168, 85, 247, 0.3)",
                                  fontWeight: 600,
                                }}
                                title="Discovered via Autonomous Research Agent"
                              >
                                AI Agent
                              </span>
                            )}
                            {isManual && (
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(245, 158, 11, 0.12)",
                                  color: "#f59e0b",
                                  border: "1px solid rgba(245, 158, 11, 0.3)",
                                  fontWeight: 600,
                                }}
                                title="Manually Added Lead"
                              >
                                Manual
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </td>

                  <td style={{ color: "var(--text-secondary)" }}>{lead.location || "—"}</td>

                  <td style={{ whiteSpace: "nowrap" }}>
                    <div style={{ fontSize: "0.78rem", color: lead.date_posted ? "var(--text-primary)" : "var(--text-dim)", display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
                      <Calendar style={{ width: "12px", height: "12px", color: lead.date_posted ? "var(--accent-cyan)" : "var(--text-muted)", flexShrink: 0 }} />
                      <span>
                        <strong style={{ color: "var(--text-muted)", fontWeight: 500 }}>Posted:</strong>{" "}
                        {formatDate(lead.date_posted)}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Clock style={{ width: "12px", height: "12px", color: "var(--accent-emerald)", flexShrink: 0 }} />
                      <span>
                        <strong style={{ color: "var(--text-muted)", fontWeight: 500 }}>Scraped:</strong>{" "}
                        {formatDate(lead.scraped_at || lead.created_at)}
                      </span>
                    </div>
                  </td>

                  <td>
                    {(lead.contacts || []).length === 0 ? (
                      <span style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>No contacts discovered</span>
                    ) : (
                      (lead.contacts || []).map((c: any, cIdx: number) => (
                        <div
                          key={cIdx}
                          style={{
                            marginBottom: "4px",
                            padding: "4px 8px",
                            background: "var(--chip-bg)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                            <div>
                              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.name || "Executive"}</span>
                              {c.role && <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>({c.role})</span>}
                            </div>
                            {(c.linkedin_url || c.linkedin) && (
                              <a
                                href={c.linkedin_url || c.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: "0.72rem",
                                  color: "#0a66c2",
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "2px",
                                  fontWeight: 600,
                                  background: "rgba(10, 102, 194, 0.1)",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  flexShrink: 0,
                                }}
                                title="Open Contact's LinkedIn Profile"
                              >
                                <span>LinkedIn ↗</span>
                              </a>
                            )}
                          </div>
                          {c.email && (
                            <div style={{ fontSize: "0.74rem", color: "var(--accent-cyan)", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                              ✉ {c.email}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </td>

                  <td>
                    <span className="platform-badge" style={{ fontSize: "0.7rem", textTransform: "capitalize" }}>
                      {lead.company_size || "Standard"}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="btn btn-sm btn-secondary"
                        title="View Lead Research Details"
                      >
                        <Eye style={{ width: "13px", height: "13px" }} />
                        <span>Details</span>
                      </button>
                      <select
                        value={lead.lead_type || "others"}
                        onChange={(e) => handleLeadTypeChange(lead.job_url, e.target.value)}
                        style={{
                          fontSize: "0.72rem",
                          padding: "3px 7px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-color)",
                          background: lead.lead_type === "company"
                            ? "rgba(6,182,212,0.12)"
                            : lead.lead_type === "personal"
                            ? "rgba(139,92,246,0.12)"
                            : "var(--chip-bg)",
                          color: lead.lead_type === "company"
                            ? "var(--accent-cyan)"
                            : lead.lead_type === "personal"
                            ? "#a78bfa"
                            : "var(--text-muted)",
                          cursor: "pointer",
                          fontWeight: 600,
                          width: "100%",
                        }}
                        title="Change lead type"
                      >
                        <option value="company">🏢 Company</option>
                        <option value="personal">👤 Personal</option>
                        <option value="others">❓ Others</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Results Summary */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
          {totalResults > 0
            ? `Showing ${Math.min((page - 1) * perPage + 1, totalResults)}–${Math.min(page * perPage, totalResults)} of ${totalResults} leads`
            : "0 leads"}
        </div>
        {totalPages > 1 && (
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              disabled={page <= 1 || loading}
              onClick={() => loadLeads(page - 1)}
              className="btn btn-secondary btn-sm"
            >
              ‹ Previous
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

      {/* Lead Detail Modal (Rendered to body via createPortal) */}
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
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(15, 23, 42, 0.7)",
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
                borderRadius: "16px",
                padding: "1.5rem",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span className="platform-badge accent" style={{ fontSize: "0.72rem" }}>Verified Lead Profile</span>
                    {selectedLead.company_size && (
                      <span className="platform-badge" style={{ fontSize: "0.72rem" }}>
                        {selectedLead.company_size}
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    {selectedLead.company}
                  </h2>
                  {selectedLead.title && (
                    <div style={{ color: "var(--accent-cyan)", fontSize: "0.9rem", fontWeight: 500, marginTop: "2px" }}>
                      {selectedLead.title}
                    </div>
                  )}
                </div>
                <button
                  className="btn-close"
                  onClick={() => setSelectedLead(null)}
                  style={{
                    fontSize: "1.4rem",
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    padding: "4px 8px",
                    borderRadius: "6px",
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Quick Info Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "0.75rem",
                  padding: "0.85rem",
                  background: "var(--chip-bg)",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.82rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.74rem" }}>LOCATION</span>
                  <strong>{selectedLead.location || "Remote / Unspecified"}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.74rem" }}>WEBSITE</span>
                  {selectedLead.company_domain ? (
                    <a
                      href={selectedLead.company_domain.startsWith("http") ? selectedLead.company_domain : `https://${selectedLead.company_domain}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--accent-cyan)", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                    >
                      <Globe style={{ width: "12px", height: "12px" }} />
                      {selectedLead.company_domain}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </div>
                {selectedLead.site && (
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.74rem" }}>SOURCE</span>
                    <strong style={{ textTransform: "capitalize" }}>{selectedLead.site}</strong>
                  </div>
                )}
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.74rem" }}>DATE POSTED</span>
                  <strong>{formatDate(selectedLead.date_posted)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.74rem" }}>DATE SCRAPED</span>
                  <strong>{formatDate(selectedLead.scraped_at || selectedLead.created_at)}</strong>
                </div>
                {selectedLead.job_url && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.74rem" }}>
                      {selectedLead.job_url.startsWith("http")
                        ? "LINKEDIN / JOB URL"
                        : selectedLead.job_url.startsWith("agent://")
                        ? "LEAD SOURCE (AUTONOMOUS RESEARCH AGENT)"
                        : "MANUAL LEAD IDENTIFIER"}
                    </span>
                    {selectedLead.job_url.startsWith("http") ? (
                      <a
                        href={selectedLead.job_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#0a66c2",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontWeight: 600,
                          wordBreak: "break-all",
                          fontSize: "0.82rem",
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                        <span>{selectedLead.job_url}</span>
                      </a>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px", flexWrap: "wrap" }}>
                        <code
                          style={{
                            fontSize: "0.76rem",
                            background: "var(--chip-bg)",
                            padding: "3px 8px",
                            borderRadius: "5px",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          {selectedLead.job_url}
                        </code>
                        <a
                          href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(selectedLead.company)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#0a66c2",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                          title={`Search ${selectedLead.company} on LinkedIn`}
                        >
                          <ExternalLink style={{ width: "12px", height: "12px" }} />
                          <span>Search {selectedLead.company} on LinkedIn</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Contacts Section */}
              <div style={{ marginBottom: "1.2rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--accent-cyan)", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>Key Decision Makers &amp; Contacts</span>
                    <span style={{ fontSize: "0.75rem", padding: "1px 6px", borderRadius: "10px", background: "var(--chip-bg)" }}>
                      {selectedLead.contacts?.length || 0}
                    </span>
                  </h4>
                </div>

                {selectedLead.contacts && selectedLead.contacts.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {selectedLead.contacts.map((c: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          padding: "10px 12px",
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                            {c.name || "Contact Person"}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {c.role || "Executive / Hiring Manager"}
                          </div>
                          {c.email && (
                            <div
                              style={{
                                color: "var(--accent-cyan)",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.8rem",
                                marginTop: "3px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <span>✉</span>
                              <span>{c.email}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {(c.linkedin_url || c.linkedin) && (
                            <a
                              href={c.linkedin_url || c.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: "0.74rem", padding: "4px 8px", textDecoration: "none", color: "#0a66c2", fontWeight: 600 }}
                            >
                              LinkedIn Profile →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic", padding: "8px 0" }}>
                    No direct executive contacts discovered yet.
                  </div>
                )}
              </div>

              {/* Summary / Notes */}
              {(selectedLead.lead_summary || selectedLead.description || selectedLead.job_description) && (
                <div style={{ marginBottom: "1.2rem" }}>
                  <h4 style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-primary)" }}>
                    Opportunity Overview &amp; Description
                  </h4>
                  <div
                    style={{
                      background: "var(--chip-bg)",
                      border: "1px solid var(--border-subtle)",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      fontSize: "0.82rem",
                      lineHeight: "1.5",
                      color: "var(--text-secondary)",
                      maxHeight: "180px",
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedLead.lead_summary || selectedLead.description || selectedLead.job_description}
                  </div>
                </div>
              )}

              {/* Technologies */}
              {selectedLead.key_technologies && selectedLead.key_technologies.length > 0 && (
                <div style={{ marginBottom: "1.2rem" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-muted)" }}>
                    Technologies &amp; Skills
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {selectedLead.key_technologies.map((tech: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "0.74rem",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "rgba(6, 182, 212, 0.1)",
                          color: "var(--accent-cyan)",
                          border: "1px solid rgba(6, 182, 212, 0.25)",
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Thinking Process */}
              {selectedLead.thinking_process && (
                <div style={{ marginBottom: "1.2rem" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--accent-emerald)" }}>
                    AI Reasoning &amp; Enrichment Log
                  </h4>
                  <pre
                    style={{
                      background: "var(--terminal-bg)",
                      border: "1px solid var(--border-subtle)",
                      padding: "10px",
                      borderRadius: "8px",
                      fontSize: "0.76rem",
                      whiteSpace: "pre-wrap",
                      color: "var(--terminal-text)",
                      maxHeight: "160px",
                      overflowY: "auto",
                    }}
                  >
                    {selectedLead.thinking_process}
                  </pre>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.85rem", marginTop: "0.5rem" }}>
                <button onClick={() => setSelectedLead(null)} className="btn btn-secondary btn-sm" style={{ padding: "6px 16px" }}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Manual Lead Entry Modal (Rendered to body via createPortal) */}
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
            onClick={() => !submittingLead && setShowAddModal(false)}
          >
            <div
              className="modal-dialog glass-card"
              style={{
                width: "100%",
                maxWidth: "640px",
                maxHeight: "88vh",
                overflowY: "auto",
                borderRadius: "16px",
                padding: "1.5rem",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title-group">
                  <span className="platform-badge accent">
                    <UserPlus style={{ width: "12px", height: "12px" }} /> Manual Entry
                  </span>
                  <h2>Add New Lead to SQLite</h2>
                </div>
                <button className="btn-close" disabled={submittingLead} onClick={() => setShowAddModal(false)}>
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateManualLead} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      required
                      className="eu-input"
                      placeholder="e.g. Acme Corp"
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Company Website / Domain</label>
                    <input
                      type="text"
                      className="eu-input"
                      placeholder="e.g. acme.com"
                      value={manualForm.company_domain}
                      onChange={(e) => setManualForm({ ...manualForm, company_domain: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>LinkedIn / Job URL</label>
                    <input
                      type="url"
                      className="eu-input"
                      placeholder="https://www.linkedin.com/jobs/view/..."
                      value={manualForm.job_url}
                      onChange={(e) => setManualForm({ ...manualForm, job_url: e.target.value })}
                    />
                  </div>
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

                {/* Lead Type Classification */}
                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600 }}>Lead Type *</span>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Target Classification</span>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
                    {[
                      { key: "company", icon: "🏢", label: "Company", desc: "Finding a company / agency" },
                      { key: "personal", icon: "👤", label: "Personal", desc: "Finding person / freelancer" },
                      { key: "others", icon: "❓", label: "Others", desc: "Unspecified / General" },
                    ].map((t) => (
                      <div
                        key={t.key}
                        onClick={() => setManualForm({ ...manualForm, lead_type: t.key })}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: manualForm.lead_type === t.key ? "2px solid var(--accent-cyan)" : "1px solid var(--border-color)",
                          background: manualForm.lead_type === t.key ? "rgba(6, 182, 212, 0.12)" : "var(--chip-bg)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "1rem" }}>{t.icon}</span>
                          <span style={{
                            fontWeight: manualForm.lead_type === t.key ? 700 : 600,
                            fontSize: "0.86rem",
                            color: manualForm.lead_type === t.key ? "var(--accent-cyan)" : "var(--text-primary)"
                          }}>
                            {t.label}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                          {t.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Company Size</label>
                    <select
                      className="eu-input"
                      value={manualForm.company_size}
                      onChange={(e) => setManualForm({ ...manualForm, company_size: e.target.value })}
                    >
                      <option value="1-10 Employees">1-10 Employees</option>
                      <option value="11-50 Employees">11-50 Employees</option>
                      <option value="51-200 Employees">51-200 Employees</option>
                      <option value="201-500 Employees">201-500 Employees</option>
                      <option value="500+ Employees">500+ Employees</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Employment Type</label>
                    <select
                      className="eu-input"
                      value={manualForm.job_type}
                      onChange={(e) => setManualForm({ ...manualForm, job_type: e.target.value })}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Contract / Freelance">Contract / Freelance</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Key Technologies (comma-separated)</label>
                  <input
                    type="text"
                    className="eu-input"
                    placeholder="e.g. Python, FastAPI, React, PostgreSQL"
                    value={manualForm.key_technologies}
                    onChange={(e) => setManualForm({ ...manualForm, key_technologies: e.target.value })}
                  />
                </div>

                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.8rem" }}>
                  <h4 style={{ fontSize: "0.88rem", marginBottom: "0.6rem", color: "var(--accent-cyan)" }}>
                    Primary Contact / Decision Maker
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                    <div className="form-group">
                      <label>Contact Full Name</label>
                      <input
                        type="text"
                        className="eu-input"
                        placeholder="e.g. Alex Mercer"
                        value={manualForm.contact_name}
                        onChange={(e) => setManualForm({ ...manualForm, contact_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Role / Position</label>
                      <input
                        type="text"
                        className="eu-input"
                        placeholder="e.g. VP of Engineering / CTO"
                        value={manualForm.contact_role}
                        onChange={(e) => setManualForm({ ...manualForm, contact_role: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginTop: "0.6rem" }}>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        className="eu-input"
                        placeholder="e.g. alex@acme.com"
                        value={manualForm.contact_email}
                        onChange={(e) => setManualForm({ ...manualForm, contact_email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>LinkedIn Profile URL</label>
                      <input
                        type="text"
                        className="eu-input"
                        placeholder="https://linkedin.com/in/..."
                        value={manualForm.contact_linkedin}
                        onChange={(e) => setManualForm({ ...manualForm, contact_linkedin: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Opportunity / Lead Summary</label>
                  <textarea
                    className="eu-input"
                    rows={3}
                    placeholder="Notes, project requirements, or outreach strategy..."
                    value={manualForm.lead_summary}
                    onChange={(e) => setManualForm({ ...manualForm, lead_summary: e.target.value })}
                  />
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
