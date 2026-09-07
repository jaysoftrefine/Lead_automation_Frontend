import React, { useState, useEffect } from "react";
import { Database, Search, Download, Globe, Eye, RefreshCw } from "lucide-react";
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

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="modal-backdrop" onClick={() => setSelectedLead(null)}>
          <div className="modal-dialog glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="platform-badge accent">Research Report</span>
                <h2>{selectedLead.company}</h2>
              </div>
              <button className="btn-close" onClick={() => setSelectedLead(null)}>
                &times;
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.86rem" }}>
              <div>
                <strong>Location:</strong> {selectedLead.location || "N/A"} • <strong>Domain:</strong>{" "}
                {selectedLead.company_domain || "N/A"}
              </div>

              {selectedLead.contacts && selectedLead.contacts.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: "0.4rem", color: "var(--accent-cyan)" }}>Discovered Contacts</h4>
                  {selectedLead.contacts.map((c: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px",
                        background: "var(--chip-bg)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                        marginBottom: "6px",
                      }}
                    >
                      <div>
                        <strong>{c.name}</strong> - <span>{c.role}</span>
                      </div>
                      {c.email && (
                        <div style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                          ✉ {c.email}
                        </div>
                      )}
                      {c.linkedin && (
                        <a
                          href={c.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--accent-indigo)", fontSize: "0.78rem" }}
                        >
                          LinkedIn Profile →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedLead.thinking_process && (
                <div>
                  <h4 style={{ marginBottom: "0.4rem", color: "var(--accent-emerald)" }}>AI Thinking &amp; Reasoning</h4>
                  <pre
                    style={{
                      background: "var(--terminal-bg)",
                      border: "1px solid var(--border-subtle)",
                      padding: "10px",
                      borderRadius: "8px",
                      fontSize: "0.78rem",
                      whiteSpace: "pre-wrap",
                      color: "var(--terminal-text)",
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    {selectedLead.thinking_process}
                  </pre>
                </div>
              )}

              {selectedLead.sources && selectedLead.sources.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: "0.4rem", color: "var(--accent-amber)" }}>Source Evidence Links</h4>
                  <ul style={{ paddingLeft: "20px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                    {selectedLead.sources.map((s: string, i: number) => (
                      <li key={i}>
                        <a href={s} target="_blank" rel="noreferrer" style={{ color: "var(--accent-cyan)" }}>
                          {s}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
