import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Database, Search, Download, Globe, Eye, RefreshCw, Plus, UserPlus } from "lucide-react";
import { api } from "../services/api";

export interface LeadsExplorerProps {
  onToast: (message: string, type?: string) => void;
}

export function LeadsExplorer({ onToast }: LeadsExplorerProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [manualForm, setManualForm] = useState({
    company: "",
    title: "",
    company_domain: "",
    location: "Remote",
    company_size: "Small (1-50)",
    job_type: "Full-time",
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
      if (manualForm.contact_name.trim() || manualForm.contact_email.trim()) {
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
        company_domain: manualForm.company_domain.trim(),
        location: manualForm.location.trim() || "Remote",
        company_size: manualForm.company_size,
        job_type: manualForm.job_type,
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
        company_domain: "",
        location: "Remote",
        company_size: "Small (1-50)",
        job_type: "Full-time",
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

  const loadLeads = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (companySize) params.company_size = companySize;
      const res = await api.getLeads(params);
      setLeads(res.leads || res.data || []);
    } catch (e: any) {
      onToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [companySize]);

  // Filter in memory for instantaneous search
  const filteredLeads = leads.filter((l) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const company = (l.company || "").toLowerCase();
    const location = (l.location || "").toLowerCase();
    const roles = (l.contacts || []).map((c: any) => (c.name || "") + " " + (c.role || "")).join(" ").toLowerCase();
    return company.includes(term) || location.includes(term) || roles.includes(term);
  });

  const exportData = (format: "json" | "csv") => {
    if (filteredLeads.length === 0) {
      onToast("No leads to export", "error");
      return;
    }
    if (format === "json") {
      const blob = new Blob([JSON.stringify(filteredLeads, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_export_${Date.now()}.json`;
      a.click();
    } else {
      // CSV
      const headers = ["Company", "Location", "Website", "Size", "Contacts", "Confidence"];
      const rows = filteredLeads.map((l) => [
        `"${(l.company || "").replace(/"/g, '""')}"`,
        `"${(l.location || "").replace(/"/g, '""')}"`,
        `"${l.company_domain || ""}"`,
        `"${l.company_size || ""}"`,
        `"${(l.contacts || []).map((c: any) => `${c.name || ""} (${c.role || ""}): ${c.email || ""}`).join("; ").replace(/"/g, '""')}"`,
        `"${l.confidence || ""}"`,
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_export_${Date.now()}.csv`;
      a.click();
    }
    onToast(`Exported ${filteredLeads.length} leads as ${format.toUpperCase()}`, "success");
  };

  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Top Filter Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div className="card-title-group">
          <Database style={{ width: "18px", height: "18px", color: "var(--accent-cyan)" }} />
          <h2>Discovered Leads ({filteredLeads.length})</h2>
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

          {/* Refresh */}
          <button onClick={loadLeads} className="btn-icon-ghost" title="Refresh Leads">
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

      {/* Leads Table */}
      <div className="eu-table-wrapper">
        <table className="eu-startups-table">
          <thead>
            <tr>
              <th>Company &amp; Domain</th>
              <th>Location</th>
              <th>Key Decision Makers &amp; Contacts</th>
              <th>Size</th>
              <th>Confidence</th>
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
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No leads found. Run the Pipeline Runner to scrape and discover B2B leads.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead, idx) => (
                <tr key={lead._id || idx}>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.92rem" }}>
                      {lead.company || "Unnamed Company"}
                    </div>
                    {lead.company_domain && (
                      <a
                        href={`https://${lead.company_domain}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--accent-cyan)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          textDecoration: "none",
                          marginTop: "2px",
                        }}
                      >
                        <Globe style={{ width: "11px", height: "11px" }} />
                        <span>{lead.company_domain}</span>
                      </a>
                    )}
                  </td>

                  <td style={{ color: "var(--text-secondary)" }}>{lead.location || "—"}</td>

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
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.name || "Executive"}</span>
                          {c.role && <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>({c.role})</span>}
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
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color:
                          lead.confidence === "high"
                            ? "#10b981"
                            : lead.confidence === "medium"
                            ? "#f59e0b"
                            : "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      {lead.confidence || "Medium"}
                    </span>
                  </td>

                  <td>
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="btn btn-sm btn-secondary"
                      title="View Lead Research Details"
                    >
                      <Eye style={{ width: "13px", height: "13px" }} />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: selectedLead.confidence === "high" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: selectedLead.confidence === "high" ? "#10b981" : "#f59e0b",
                      }}
                    >
                      {selectedLead.confidence ? `${selectedLead.confidence.toUpperCase()} CONFIDENCE` : "VALIDATED"}
                    </span>
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
                          {c.linkedin && (
                            <a
                              href={c.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: "0.74rem", padding: "4px 8px", textDecoration: "none" }}
                            >
                              LinkedIn →
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
