import React, { useState, useEffect } from "react";
import {
  List,
  CheckSquare,
  Plus,
  RefreshCw,
  Users,
  Filter,
  Search,
  Save,
  Edit3,
  Trash2,
  Rocket,
  Calendar,
  Clock,
} from "lucide-react";
import { api } from "../../../services/api";
import type { Audience } from "../../../types/email";
import { Pagination } from "../../common/Pagination";

function formatContactDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const clean = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T");
    const d = new Date(clean);
    if (isNaN(d.getTime())) {
      const d2 = new Date(dateStr);
      if (isNaN(d2.getTime())) return String(dateStr);
      return d2.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(dateStr);
  }
}

export interface AudiencesPanelProps {
  audiences: Audience[];
  onAudiencesChange: () => void;
  onSelectForReview: (aud: Audience) => void;
  onSelectForBulk: (aud: Audience) => void;
  onToast: (msg: string, type?: string) => void;
}

export function AudiencesPanel({
  audiences,
  onAudiencesChange,
  onSelectForReview,
  onSelectForBulk,
  onToast,
}: AudiencesPanelProps) {
  const [audViewMode, setAudViewMode] = useState<"directory" | "builder">("directory");
  const [loadingAudiences, setLoadingAudiences] = useState(false);
  const [editingAudienceId, setEditingAudienceId] = useState<string | null>(null);

  const handleRefreshAudiences = async () => {
    if (loadingAudiences) return;
    setLoadingAudiences(true);
    const start = Date.now();
    try {
      await Promise.resolve(onAudiencesChange());
    } catch {
      // ignore
    } finally {
      const elapsed = Date.now() - start;
      const minDelay = 350;
      const remaining = Math.max(0, minDelay - elapsed);
      setTimeout(() => {
        setLoadingAudiences(false);
      }, remaining);
    }
  };

  // Form Fields
  const [audName, setAudName] = useState("");
  const [audDescription, setAudDescription] = useState("");
  const [audSources, setAudSources] = useState({
    sqlite: true,
    mongo: false,
    manual: false,
  });
  const [audCountry, setAudCountry] = useState("");
  const [audCategory, setAudCategory] = useState("");
  const [audLeadType, setAudLeadType] = useState("all");
  const [audManualEmails, setAudManualEmails] = useState("");
  const [audSelectedContacts, setAudSelectedContacts] = useState<any[]>([]);
  const [savingAudience, setSavingAudience] = useState(false);

  // Lead Browser table states
  const [audBrowseContacts, setAudBrowseContacts] = useState<any[]>([]);
  const [audBrowseTotal, setAudBrowseTotal] = useState(0);
  const [audBrowsePage, setAudBrowsePage] = useState(1);
  const [audBrowseTotalPages, setAudBrowseTotalPages] = useState(1);
  const [audBrowseSearch, setAudBrowseSearch] = useState("");
  const [loadingBrowseContacts, setLoadingBrowseContacts] = useState(false);
  const [audSelectedMap, setAudSelectedMap] = useState<Record<string, any>>({});

  // Date Filter states
  const [audDatePreset, setAudDatePreset] = useState<string>("all");
  const [audDateFrom, setAudDateFrom] = useState<string>("");
  const [audDateTo, setAudDateTo] = useState<string>("");
  const [audDateField, setAudDateField] = useState<string>("any");
  const [audSortBy, setAudSortBy] = useState<string>("date");
  const [audSortDir, setAudSortDir] = useState<"asc" | "desc">("desc");

  const loadBrowseContacts = async (page = 1) => {
    setLoadingBrowseContacts(true);
    try {
      const srcs: string[] = [];
      if (audSources.sqlite) srcs.push("sqlite");
      if (audSources.mongo) srcs.push("mongo");
      if (srcs.length === 0) {
        setAudBrowseContacts([]);
        setAudBrowseTotal(0);
        setAudBrowseTotalPages(1);
        setLoadingBrowseContacts(false);
        return;
      }
      const params: Record<string, any> = {
        sources: srcs.join(","),
        country: audCountry.trim(),
        category: audCategory.trim(),
        search: audBrowseSearch.trim(),
        lead_type: audSources.mongo && audLeadType !== "all" ? audLeadType : "",
        sort_by: audSortBy,
        sort_dir: audSortDir,
        page,
        per_page: 25,
      };
      if (audDatePreset && audDatePreset !== "all") {
        params.date_preset = audDatePreset;
      }
      if (audDateFrom) params.date_from = audDateFrom;
      if (audDateTo) params.date_to = audDateTo;
      if (audDateField && audDateField !== "any") params.date_field = audDateField;

      const res = await api.browseRecipients(params);
      if (res.status === "success" && res.data) {
        setAudBrowseContacts(res.data.items || []);
        setAudBrowseTotal(res.data.total || 0);
        setAudBrowsePage(res.data.page || 1);
        setAudBrowseTotalPages(res.data.total_pages || 1);
      }
    } catch (e) {
      console.error("Browse contacts error:", e);
    } finally {
      setLoadingBrowseContacts(false);
    }
  };

  useEffect(() => {
    if (audViewMode === "builder") {
      const timer = setTimeout(() => {
        loadBrowseContacts(1);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [
    audViewMode,
    audSources.sqlite,
    audSources.mongo,
    audCountry,
    audCategory,
    audBrowseSearch,
    audLeadType,
    audDatePreset,
    audDateFrom,
    audDateTo,
    audDateField,
    audSortBy,
    audSortDir,
  ]);

  const handleToggleDateSort = () => {
    if (audSortBy === "date") {
      setAudSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setAudSortBy("date");
      setAudSortDir("desc");
    }
  };

  const toggleSelectBrowseContact = (contact: any) => {
    const key = (contact.email || contact.id).toLowerCase();
    setAudSelectedMap((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          id: contact.id,
          name: contact.person_name || contact.name,
          person_name: contact.person_name || contact.name,
          company: contact.company_name || contact.company,
          company_name: contact.company_name || contact.company,
          email: contact.email,
          role: contact.role,
          website: contact.website,
          city: contact.city,
          country: contact.country,
          category: contact.category,
          source: contact.source,
          date: contact.date,
          date_posted: contact.date_posted,
          scraped_at: contact.scraped_at,
          created_at: contact.created_at,
        };
      }
      setAudSelectedContacts(Object.values(next));
      return next;
    });
  };

  const handleSelectAllBrowsePage = () => {
    setAudSelectedMap((prev) => {
      const next = { ...prev };
      audBrowseContacts.forEach((c) => {
        const key = (c.email || c.id).toLowerCase();
        next[key] = {
          id: c.id,
          name: c.person_name || c.name,
          person_name: c.person_name || c.name,
          company: c.company_name || c.company,
          company_name: c.company_name || c.company,
          email: c.email,
          role: c.role,
          website: c.website,
          city: c.city,
          country: c.country,
          category: c.category,
          source: c.source,
          date: c.date,
          date_posted: c.date_posted,
          scraped_at: c.scraped_at,
          created_at: c.created_at,
        };
      });
      setAudSelectedContacts(Object.values(next));
      return next;
    });
  };

  const handleDeselectAllBrowsePage = () => {
    setAudSelectedMap((prev) => {
      const next = { ...prev };
      audBrowseContacts.forEach((c) => {
        const key = (c.email || c.id).toLowerCase();
        delete next[key];
      });
      setAudSelectedContacts(Object.values(next));
      return next;
    });
  };

  const handleClearAllSelectedContacts = () => {
    setAudSelectedMap({});
    setAudSelectedContacts([]);
  };

  const handleResetAudienceForm = () => {
    setEditingAudienceId(null);
    setAudName("");
    setAudDescription("");
    setAudSources({ sqlite: true, mongo: false, manual: false });
    setAudCountry("");
    setAudCategory("");
    setAudLeadType("all");
    setAudDatePreset("all");
    setAudDateFrom("");
    setAudDateTo("");
    setAudDateField("any");
    setAudManualEmails("");
    setAudSelectedContacts([]);
    setAudSelectedMap({});
  };

  const handleEditAudience = (aud: any) => {
    setEditingAudienceId(aud.id);
    setAudName(aud.name);
    setAudDescription(aud.description || "");
    const srcList = aud.sources || [];
    setAudSources({
      sqlite: srcList.includes("sqlite"),
      mongo: srcList.includes("mongo"),
      manual: srcList.includes("manual"),
    });
    setAudCountry(aud.filters?.country || "");
    setAudCategory(aud.filters?.category || "");
    setAudLeadType(aud.filters?.lead_type || "all");
    setAudDatePreset(aud.filters?.date_preset || "all");
    setAudDateFrom(aud.filters?.date_from || "");
    setAudDateTo(aud.filters?.date_to || "");
    setAudDateField(aud.filters?.date_field || "any");
    setAudManualEmails((aud.manual_recipients || []).join("\n"));

    const sel = aud.selected_recipients || [];
    setAudSelectedContacts(sel);
    const selMap: Record<string, any> = {};
    sel.forEach((c: any) => {
      const k = (c.email || c.id || "").toLowerCase();
      if (k) selMap[k] = c;
    });
    setAudSelectedMap(selMap);

    setAudViewMode("builder");
  };

  const handleDeleteAudience = async (audId: string) => {
    if (!window.confirm("Are you sure you want to delete this audience?")) return;
    try {
      await api.deleteAudience(audId);
      onToast("Audience deleted successfully.", "info");
      onAudiencesChange();
    } catch (e: any) {
      onToast(e.message || "Failed to delete audience", "error");
    }
  };

  const handleSaveAudience = async () => {
    if (!audName.trim()) {
      onToast("Please enter an Audience Name", "error");
      return;
    }
    const sources: string[] = [];
    if (audSources.sqlite) sources.push("sqlite");
    if (audSources.mongo) sources.push("mongo");
    if (audSources.manual && audManualEmails.trim()) sources.push("manual");
    if (audSelectedContacts.length > 0) sources.push("selected");

    if (sources.length === 0 && audSelectedContacts.length === 0) {
      onToast("Select at least one audience source or handpick specific companies", "error");
      return;
    }

    const manualList = audManualEmails
      ? audManualEmails
          .split(/[\n,]/)
          .map((e) => e.trim())
          .filter((e) => e.length > 0)
      : [];

    setSavingAudience(true);
    try {
      const payload = {
        name: audName.trim(),
        description: audDescription.trim(),
        sources,
        filters: {
          country: audCountry.trim(),
          category: audCategory.trim(),
          lead_type: audLeadType,
          date_preset: audDatePreset,
          date_from: audDateFrom,
          date_to: audDateTo,
          date_field: audDateField,
        },
        manual_recipients: manualList,
        selected_recipients: audSelectedContacts.map((c) => ({
          person_name: c.name || c.person_name || "",
          company_name: c.company || c.company_name || "",
          email: c.email || "",
          role: c.role || "",
          website: c.website || "",
          city: c.city || "",
          country: c.country || "",
          category: c.category || "",
          source: c.source || "eu",
        })),
      };

      if (editingAudienceId) {
        await api.updateAudience(editingAudienceId, payload);
        onToast("Audience updated successfully!", "success");
      } else {
        await api.createAudience(payload);
        onToast("Audience saved successfully!", "success");
      }
      handleResetAudienceForm();
      onAudiencesChange();
      setAudViewMode("directory");
    } catch (e: any) {
      onToast(e.message || "Failed to save audience", "error");
    } finally {
      setSavingAudience(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Sub-navigation: Studio vs Saved Audiences Directory */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          background: "var(--bg-surface)",
          padding: "8px 14px",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            gap: "4px",
            background: "var(--bg-secondary)",
            padding: "4px",
            borderRadius: "9px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <button
            type="button"
            onClick={() => setAudViewMode("directory")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "7px",
              border:
                audViewMode === "directory"
                  ? "1px solid var(--border-subtle)"
                  : "1px solid transparent",
              cursor: "pointer",
              fontSize: "0.84rem",
              fontWeight: 600,
              transition: "all 0.15s ease",
              background:
                audViewMode === "directory" ? "var(--bg-card)" : "transparent",
              color:
                audViewMode === "directory"
                  ? "var(--accent-blue)"
                  : "var(--text-muted)",
              boxShadow:
                audViewMode === "directory"
                  ? "0 2px 8px rgba(0,0,0,0.06)"
                  : "none",
            }}
          >
            <List style={{ width: "15px", height: "15px" }} />
            <span>Saved Audiences Directory ({audiences.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAudViewMode("builder")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "7px",
              border:
                audViewMode === "builder"
                  ? "1px solid var(--border-subtle)"
                  : "1px solid transparent",
              cursor: "pointer",
              fontSize: "0.84rem",
              fontWeight: 600,
              transition: "all 0.15s ease",
              background:
                audViewMode === "builder" ? "var(--bg-card)" : "transparent",
              color: audViewMode === "builder" ? "#ea580c" : "var(--text-muted)",
              boxShadow:
                audViewMode === "builder"
                  ? "0 2px 8px rgba(0,0,0,0.06)"
                  : "none",
            }}
          >
            <CheckSquare style={{ width: "15px", height: "15px" }} />
            <span>
              {editingAudienceId
                ? "Edit Audience in Studio"
                : "Audience Selection Studio"}
            </span>
            {audSelectedContacts.length > 0 && (
              <span
                style={{
                  background: "#ea580c",
                  color: "#fff",
                  fontSize: "0.72rem",
                  padding: "1px 7px",
                  borderRadius: "10px",
                  fontWeight: 700,
                }}
              >
                {audSelectedContacts.length}
              </span>
            )}
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {audViewMode === "directory" ? (
            <button
              type="button"
              onClick={() => {
                handleResetAudienceForm();
                setAudViewMode("builder");
              }}
              className="btn btn-primary btn-sm"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#ea580c",
                borderColor: "#ea580c",
                padding: "7px 14px",
                fontWeight: 600,
              }}
            >
              <Plus style={{ width: "14px", height: "14px" }} />
              <span>Create New Audience</span>
            </button>
          ) : (
            audiences.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  Quick Load:
                </span>
                <select
                  className="eu-input"
                  style={{
                    padding: "6px 12px",
                    fontSize: "0.8rem",
                    width: "auto",
                    minWidth: "210px",
                    borderRadius: "8px",
                  }}
                  value={editingAudienceId || ""}
                  onChange={(e) => {
                    const found = audiences.find((a) => a.id === e.target.value);
                    if (found) handleEditAudience(found);
                  }}
                >
                  <option value="">-- Choose saved audience to edit --</option>
                  {audiences.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.contact_count || 0} contacts)
                    </option>
                  ))}
                </select>
              </div>
            )
          )}
        </div>
      </div>

      {/* VIEW: Studio Builder Mode (Filter Sidebar + Lead Table) */}
      {audViewMode === "builder" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "330px 1fr",
            gap: "1.25rem",
            alignItems: "flex-start",
          }}
        >
          {/* Left Column: Filter Sidebar */}
          <div
            className="glass-card"
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.1rem",
              borderRadius: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "0.7rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                }}
              >
                <Filter
                  style={{
                    width: "16px",
                    height: "16px",
                    color: "#ea580c",
                  }}
                />
                <span>
                  {editingAudienceId
                    ? "Edit Target Audience"
                    : "Filter & Audience Setup"}
                </span>
              </div>
              {editingAudienceId && (
                <button
                  type="button"
                  onClick={handleResetAudienceForm}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--accent-rose)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  ✕ Cancel Edit
                </button>
              )}
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                Audience Name *
              </label>
              <input
                type="text"
                className="eu-input"
                placeholder="e.g. UK AI Founders, German Biotech"
                value={audName}
                onChange={(e) => setAudName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                Description / Notes
              </label>
              <input
                type="text"
                className="eu-input"
                placeholder="e.g. Handpicked Series A AI founders"
                value={audDescription}
                onChange={(e) => setAudDescription(e.target.value)}
              />
            </div>

            {/* Data Source Checkboxes */}
            <div className="form-group">
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  marginBottom: "6px",
                }}
              >
                <span>Data Sources</span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    fontWeight: 400,
                  }}
                >
                  (Updates directory live)
                </span>
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <label
                  className="checkbox-chip"
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: audSources.sqlite
                      ? "1px solid rgba(6, 182, 212, 0.4)"
                      : "1px solid var(--border-subtle)",
                    background: audSources.sqlite
                      ? "rgba(6, 182, 212, 0.08)"
                      : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={audSources.sqlite}
                    onChange={(e) =>
                      setAudSources((s) => ({
                        ...s,
                        sqlite: e.target.checked,
                      }))
                    }
                  />
                  <span className="chip-content" style={{ fontWeight: 500 }}>
                    EU Startups
                  </span>
                </label>

                <label
                  className="checkbox-chip"
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: audSources.mongo
                      ? "1px solid rgba(16, 185, 129, 0.4)"
                      : "1px solid var(--border-subtle)",
                    background: audSources.mongo
                      ? "rgba(16, 185, 129, 0.08)"
                      : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={audSources.mongo}
                    onChange={(e) =>
                      setAudSources((s) => ({
                        ...s,
                        mongo: e.target.checked,
                      }))
                    }
                  />
                  <span className="chip-content" style={{ fontWeight: 500 }}>
                    LinkedIn Leads
                  </span>
                </label>

                {audSources.mongo && (
                  <div
                    style={{
                      marginTop: "-2px",
                      marginBottom: "4px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "rgba(16, 185, 129, 0.05)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--accent-emerald)",
                        fontWeight: 700,
                      }}
                    >
                      LinkedIn Lead Type:
                    </span>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "5px",
                      }}
                    >
                      {[
                        { key: "all", label: "All Leads" },
                        { key: "company", label: "🏢 Company" },
                        { key: "personal", label: "👤 Personal" },
                        { key: "others", label: "❓ Others" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setAudLeadType(opt.key)}
                          style={{
                            padding: "6px 8px",
                            fontSize: "0.75rem",
                            borderRadius: "6px",
                            border:
                              audLeadType === opt.key
                                ? "1.5px solid var(--accent-emerald)"
                                : "1px solid var(--border-subtle)",
                            background:
                              audLeadType === opt.key
                                ? "rgba(16, 185, 129, 0.18)"
                                : "var(--chip-bg)",
                            color:
                              audLeadType === opt.key
                                ? "var(--accent-emerald)"
                                : "var(--text-secondary)",
                            fontWeight: audLeadType === opt.key ? 700 : 500,
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label
                  className="checkbox-chip"
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: audSources.manual
                      ? "1px solid rgba(245, 158, 11, 0.4)"
                      : "1px solid var(--border-subtle)",
                    background: audSources.manual
                      ? "rgba(245, 158, 11, 0.08)"
                      : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={audSources.manual}
                    onChange={(e) =>
                      setAudSources((s) => ({
                        ...s,
                        manual: e.target.checked,
                      }))
                    }
                  />
                  <span className="chip-content" style={{ fontWeight: 500 }}>
                    Manual / Direct Contacts
                  </span>
                </label>
              </div>
            </div>

            {/* Granular Filters */}
            {(audSources.sqlite || audSources.mongo) && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  paddingTop: "10px",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                    Filter by Country
                  </label>
                  <input
                    type="text"
                    className="eu-input"
                    placeholder="e.g. United Kingdom, Germany"
                    value={audCountry}
                    onChange={(e) => setAudCountry(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                    Filter by Category / Industry
                  </label>
                  <input
                    type="text"
                    className="eu-input"
                    placeholder="e.g. Artificial Intelligence, SaaS"
                    value={audCategory}
                    onChange={(e) => setAudCategory(e.target.value)}
                  />
                </div>

                {/* Filter by Date */}
                <div className="form-group">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <label
                      style={{
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        margin: 0,
                      }}
                    >
                      <Calendar
                        style={{
                          width: "13px",
                          height: "13px",
                          color: "#ea580c",
                        }}
                      />
                      <span>Filter by Date</span>
                    </label>
                    {(audDatePreset !== "all" || audDateFrom || audDateTo) && (
                      <button
                        type="button"
                        onClick={() => {
                          setAudDatePreset("all");
                          setAudDateFrom("");
                          setAudDateTo("");
                          setAudDateField("any");
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--accent-rose)",
                          fontSize: "0.72rem",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        ✕ Clear Date
                      </button>
                    )}
                  </div>

                  {/* Date preset chips */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "5px",
                    }}
                  >
                    {[
                      { key: "all", label: "All Time" },
                      { key: "today", label: "Past 24h" },
                      { key: "7d", label: "7 Days" },
                      { key: "30d", label: "30 Days" },
                      { key: "90d", label: "90 Days" },
                      { key: "custom", label: "Custom..." },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          setAudDatePreset(p.key);
                          if (p.key !== "custom") {
                            setAudDateFrom("");
                            setAudDateTo("");
                          }
                        }}
                        style={{
                          padding: "5px 4px",
                          fontSize: "0.72rem",
                          borderRadius: "6px",
                          border:
                            audDatePreset === p.key
                              ? "1.5px solid #ea580c"
                              : "1px solid var(--border-subtle)",
                          background:
                            audDatePreset === p.key
                              ? "rgba(234, 88, 12, 0.14)"
                              : "var(--chip-bg, transparent)",
                          color:
                            audDatePreset === p.key
                              ? "#ea580c"
                              : "var(--text-secondary)",
                          fontWeight: audDatePreset === p.key ? 700 : 500,
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Pickers */}
                  {audDatePreset === "custom" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px",
                        marginTop: "8px",
                        padding: "8px",
                        background: "rgba(234, 88, 12, 0.04)",
                        borderRadius: "8px",
                        border: "1px dashed rgba(234, 88, 12, 0.3)",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            display: "block",
                            marginBottom: "2px",
                            fontWeight: 500,
                          }}
                        >
                          From:
                        </span>
                        <input
                          type="date"
                          className="eu-input"
                          style={{
                            padding: "4px 6px",
                            fontSize: "0.75rem",
                            width: "100%",
                          }}
                          value={audDateFrom}
                          onChange={(e) => setAudDateFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            display: "block",
                            marginBottom: "2px",
                            fontWeight: 500,
                          }}
                        >
                          To:
                        </span>
                        <input
                          type="date"
                          className="eu-input"
                          style={{
                            padding: "4px 6px",
                            fontSize: "0.75rem",
                            width: "100%",
                          }}
                          value={audDateTo}
                          onChange={(e) => setAudDateTo(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Date Target Field (Any, Posted, Scraped) */}
                  {audSources.mongo && (
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        marginTop: "5px",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Target:
                      </span>
                      {[
                        { key: "any", label: "Any" },
                        { key: "posted", label: "Posted" },
                        { key: "scraped", label: "Scraped" },
                      ].map((tf) => (
                        <button
                          key={tf.key}
                          type="button"
                          onClick={() => setAudDateField(tf.key)}
                          style={{
                            padding: "2px 8px",
                            fontSize: "0.7rem",
                            borderRadius: "4px",
                            border:
                              audDateField === tf.key
                                ? "1px solid #ea580c"
                                : "1px solid var(--border-subtle)",
                            background:
                              audDateField === tf.key
                                ? "rgba(234, 88, 12, 0.15)"
                                : "transparent",
                            color:
                              audDateField === tf.key
                                ? "#ea580c"
                                : "var(--text-muted)",
                            fontWeight: audDateField === tf.key ? 700 : 500,
                            cursor: "pointer",
                          }}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                    Search Contacts &amp; Companies
                  </label>
                  <div style={{ position: "relative" }}>
                    <Search
                      style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "13px",
                        color: "var(--text-dim)",
                      }}
                    />
                    <input
                      type="text"
                      className="eu-input"
                      style={{ paddingLeft: "30px" }}
                      placeholder="Search name, company, email, role..."
                      value={audBrowseSearch}
                      onChange={(e) => setAudBrowseSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Manual contacts list */}
            {audSources.manual && (
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                  Manual Contacts
                </label>
                <textarea
                  className="eu-textarea"
                  rows={3}
                  placeholder="Name, Company, email@domain.com&#10;or founder@example.com"
                  value={audManualEmails}
                  onChange={(e) => setAudManualEmails(e.target.value)}
                  style={{ fontSize: "0.8rem", fontFamily: "monospace" }}
                />
              </div>
            )}

            {/* Selection Counter Card */}
            <div
              style={{
                background: "rgba(234, 88, 12, 0.06)",
                border: "1px solid rgba(234, 88, 12, 0.25)",
                borderRadius: "10px",
                padding: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    color: "#ea580c",
                  }}
                >
                  ✓ {audSelectedContacts.length} Contacts Selected
                </span>
                {audSelectedContacts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllSelectedContacts}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--accent-rose)",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div
                style={{
                  fontSize: "0.74rem",
                  color: "var(--text-muted)",
                  marginTop: "3px",
                }}
              >
                Check or uncheck contacts in the table on the right to handpick
                companies.
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              disabled={savingAudience}
              onClick={handleSaveAudience}
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "10px 16px",
                fontWeight: 700,
                background: "#ea580c",
                borderColor: "#ea580c",
                color: "#fff",
                boxShadow: "0 4px 14px rgba(234, 88, 12, 0.3)",
              }}
            >
              <Save style={{ width: "15px", height: "15px" }} />
              <span>
                {savingAudience
                  ? "Saving..."
                  : editingAudienceId
                  ? `Update Audience (${audSelectedContacts.length})`
                  : `Save Target Audience (${audSelectedContacts.length})`}
              </span>
            </button>
          </div>

          {/* Right Column: ImHUB Style Lead Table */}
          <div
            className="glass-card"
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              minHeight: "680px",
              borderRadius: "14px",
            }}
          >
            {/* Table Top Action Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "0.75rem",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Users
                    style={{
                      width: "18px",
                      height: "18px",
                      color: "#ea580c",
                    }}
                  />
                  <span>Selected Audience / Directory</span>
                </h3>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    Showing {audBrowseContacts.length} of {audBrowseTotal} available
                    leads across selected sources. Check boxes to partially select
                    companies.
                  </span>
                  {(audDatePreset !== "all" || audDateFrom || audDateTo) && (
                    <span
                      style={{
                        background: "rgba(234, 88, 12, 0.12)",
                        color: "#ea580c",
                        padding: "1px 8px",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Calendar style={{ width: "11px", height: "11px" }} />
                      <span>
                        Date: {audDatePreset !== "custom" ? audDatePreset.toUpperCase() : `${audDateFrom || "Start"} → ${audDateTo || "Now"}`}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleSelectAllBrowsePage}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.77rem", fontWeight: 600 }}
                >
                  <CheckSquare style={{ width: "13px", height: "13px" }} />
                  <span>Select All on Page</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllBrowsePage}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.77rem" }}
                >
                  <span>Deselect Page</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadBrowseContacts(audBrowsePage)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.77rem" }}
                  title="Refresh Directory"
                >
                  <RefreshCw
                    style={{
                      width: "13px",
                      height: "13px",
                      animation: loadingBrowseContacts
                        ? "spin 1s linear infinite"
                        : "none",
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Lead Type Tabs Filter when LinkedIn Leads selected */}
            {audSources.mongo && (
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "2px",
                  marginBottom: "-4px",
                }}
              >
                {[
                  { key: "all", label: "All Leads" },
                  { key: "company", label: "🏢 Company" },
                  { key: "personal", label: "👤 Personal" },
                  { key: "others", label: "❓ Others" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setAudLeadType(tab.key);
                      setAudBrowsePage(1);
                    }}
                    style={{
                      padding: "0.42rem 0.85rem",
                      border: "none",
                      borderBottom:
                        audLeadType === tab.key
                          ? "2.5px solid var(--accent-emerald)"
                          : "2.5px solid transparent",
                      background:
                        audLeadType === tab.key
                          ? "rgba(16, 185, 129, 0.08)"
                          : "transparent",
                      color:
                        audLeadType === tab.key
                          ? "var(--accent-emerald)"
                          : "var(--text-muted)",
                      fontWeight: audLeadType === tab.key ? 700 : 500,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      borderRadius: "6px 6px 0 0",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* ImHUB Style Table */}
            <div
              style={{
                overflowX: "auto",
                borderRadius: "10px",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  tableLayout: "fixed",
                  borderCollapse: "collapse",
                  fontSize: "0.83rem",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "var(--table-header-bg)",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <th style={{ width: "42px", minWidth: "42px", padding: "11px 12px" }}>
                      <input
                        type="checkbox"
                        style={{
                          cursor: "pointer",
                          width: "16px",
                          height: "16px",
                        }}
                        checked={
                          audBrowseContacts.length > 0 &&
                          audBrowseContacts.every(
                            (c) =>
                              !!audSelectedMap[(c.email || c.id).toLowerCase()]
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) handleSelectAllBrowsePage();
                          else handleDeselectAllBrowsePage();
                        }}
                      />
                    </th>
                    <th
                      style={{
                        width: "18%",
                        padding: "11px 12px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      User Name
                    </th>
                    <th
                      style={{
                        width: "17%",
                        padding: "11px 12px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      Company
                    </th>
                    <th
                      style={{
                        width: "23%",
                        padding: "11px 12px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      Email
                    </th>
                    <th
                      onClick={handleToggleDateSort}
                      style={{
                        width: "14%",
                        padding: "11px 12px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                      title="Click to toggle newest / oldest"
                    >
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <span>Date Scraped</span>
                        <span style={{ color: "#ea580c", fontSize: "0.82rem", fontWeight: 800 }}>
                          {audSortDir === "desc" ? "↓" : "↑"}
                        </span>
                      </div>
                    </th>
                    <th
                      style={{
                        width: "14%",
                        padding: "11px 12px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      Filter / Source
                    </th>
                    <th
                      style={{
                        width: "14%",
                        padding: "11px 12px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingBrowseContacts ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ textAlign: "center", padding: "50px 20px" }}
                      >
                        <div
                          className="spinner"
                          style={{ margin: "0 auto 12px" }}
                        />
                        <span
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Loading leads...
                        </span>
                      </td>
                    </tr>
                  ) : audBrowseContacts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          padding: "60px 20px",
                          color: "var(--text-muted)",
                        }}
                      >
                        No contacts match the current data sources and filters.
                      </td>
                    </tr>
                  ) : (
                    audBrowseContacts.map((c) => {
                      const isChecked = !!audSelectedMap[
                        (c.email || c.id).toLowerCase()
                      ];
                      return (
                        <tr
                          key={c.id}
                          onClick={() => toggleSelectBrowseContact(c)}
                          style={{
                            cursor: "pointer",
                            borderBottom: "1px solid var(--border-subtle)",
                            background: isChecked
                              ? "rgba(234, 88, 12, 0.08)"
                              : "transparent",
                            borderLeft: isChecked
                              ? "3px solid #ea580c"
                              : "3px solid transparent",
                            transition: "background 0.12s ease",
                          }}
                        >
                          <td
                            style={{ width: "42px", minWidth: "42px", padding: "11px 12px" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              style={{
                                cursor: "pointer",
                                width: "16px",
                                height: "16px",
                              }}
                              checked={isChecked}
                              onChange={() => toggleSelectBrowseContact(c)}
                            />
                          </td>
                          <td
                            style={{
                              padding: "11px 12px",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={c.person_name || "Leadership"}
                          >
                            {c.person_name || "Leadership"}
                          </td>
                          <td
                            style={{
                              padding: "11px 12px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={c.company_name}
                          >
                            {c.website ? (
                              <a
                                href={
                                  c.website.startsWith("http")
                                    ? c.website
                                    : `https://${c.website}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "var(--accent-blue)",
                                  textDecoration: "underline",
                                  fontWeight: 600,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {c.company_name}
                              </a>
                            ) : (
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: "var(--text-primary)",
                                }}
                              >
                                {c.company_name}
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "11px 12px",
                              fontFamily: "monospace",
                              fontSize: "0.8rem",
                              color: "var(--text-secondary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={c.email}
                          >
                            {c.email}
                          </td>
                          <td
                            style={{
                              padding: "11px 12px",
                              fontSize: "0.78rem",
                              color: "var(--text-secondary)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {c.date ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontWeight: 600,
                                  color: "var(--text-primary)",
                                }}
                              >
                                <Calendar
                                  style={{
                                    width: "11px",
                                    height: "11px",
                                    color: "#ea580c",
                                    flexShrink: 0,
                                  }}
                                />
                                {formatContactDate(c.date)}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-dim)" }}>—</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "11px 12px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  padding: "2px 7px",
                                  borderRadius: "5px",
                                  background:
                                    c.source === "sqlite"
                                      ? "rgba(6, 182, 212, 0.15)"
                                      : "rgba(16, 185, 129, 0.15)",
                                  color:
                                    c.source === "sqlite"
                                      ? "var(--accent-cyan)"
                                      : "var(--accent-emerald)",
                                  border:
                                    c.source === "sqlite"
                                      ? "1px solid rgba(6, 182, 212, 0.3)"
                                      : "1px solid rgba(16, 185, 129, 0.3)",
                                  fontWeight: 600,
                                }}
                              >
                                {c.source === "sqlite"
                                  ? "EU Startups"
                                  : "LinkedIn Leads"}
                              </span>
                              {c.source !== "sqlite" && c.lead_type && (
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    padding: "2px 7px",
                                    borderRadius: "5px",
                                    background:
                                      c.lead_type === "company"
                                        ? "rgba(59, 130, 246, 0.15)"
                                        : c.lead_type === "personal"
                                        ? "rgba(168, 85, 247, 0.15)"
                                        : "rgba(107, 114, 128, 0.15)",
                                    color:
                                      c.lead_type === "company"
                                        ? "#3b82f6"
                                        : c.lead_type === "personal"
                                        ? "#a855f7"
                                        : "var(--text-muted)",
                                    border:
                                      c.lead_type === "company"
                                        ? "1px solid rgba(59, 130, 246, 0.3)"
                                        : c.lead_type === "personal"
                                        ? "1px solid rgba(168, 85, 247, 0.3)"
                                        : "1px solid rgba(107, 114, 128, 0.3)",
                                    fontWeight: 600,
                                  }}
                                >
                                  {c.lead_type === "company"
                                    ? "Company"
                                    : c.lead_type === "personal"
                                    ? "Personal"
                                    : "General"}
                                </span>
                              )}
                              {c.country && (
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    padding: "2px 7px",
                                    borderRadius: "5px",
                                    background: "var(--chip-bg)",
                                    color: "var(--text-secondary)",
                                    border: "1px solid var(--border-subtle)",
                                  }}
                                >
                                  {c.country}
                                </span>
                              )}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              color: "var(--text-muted)",
                              fontSize: "0.78rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={c.role || "Executive"}
                          >
                            {c.role || "Executive"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls using reusable component */}
            <Pagination
              page={audBrowsePage}
              totalPages={audBrowseTotalPages}
              totalResults={audBrowseTotal}
              perPage={25}
              itemLabel="leads"
              onPageChange={(newPage) => {
                setAudBrowsePage(newPage);
                loadBrowseContacts(newPage);
              }}
            />
          </div>
        </div>
      )}

      {/* VIEW: Saved Audiences Directory */}
      {audViewMode === "directory" && (
        <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: "0.85rem",
              marginBottom: "1.25rem",
            }}
          >
            <div className="card-title-group">
              <List
                style={{
                  width: "18px",
                  height: "18px",
                  color: "var(--accent-blue)",
                }}
              />
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                Saved Audiences Directory ({audiences.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={handleRefreshAudiences}
              disabled={loadingAudiences}
              className="btn btn-secondary btn-sm"
              style={{
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                opacity: loadingAudiences ? 0.8 : 1,
                cursor: loadingAudiences ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
              title="Refresh Saved Audiences"
            >
              <RefreshCw
                style={{
                  width: "13px",
                  height: "13px",
                  animation: loadingAudiences ? "spin 0.75s linear infinite" : "none",
                }}
              />
              <span>{loadingAudiences ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>

          {loadingAudiences ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <div className="spinner" />
            </div>
          ) : audiences.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "var(--text-muted)",
                border: "1px dashed var(--border-subtle)",
                borderRadius: "12px",
              }}
            >
              <Users
                style={{
                  width: "40px",
                  height: "40px",
                  margin: "0 auto 12px",
                  opacity: 0.4,
                }}
              />
              <p style={{ fontSize: "0.92rem", marginBottom: "12px" }}>
                No saved audiences yet.
              </p>
              <button
                type="button"
                onClick={() => {
                  handleResetAudienceForm();
                  setAudViewMode("builder");
                }}
                className="btn btn-primary btn-sm"
                style={{ background: "#ea580c", borderColor: "#ea580c" }}
              >
                Create Your First Audience
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {audiences.map((aud: any) => (
                <div
                  key={aud.id}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "12px",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.02rem",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {aud.name}
                      </h3>
                      {aud.description ? (
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "0.82rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {aud.description}
                        </p>
                      ) : (
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "0.78rem",
                            color: "var(--text-dim)",
                            fontStyle: "italic",
                          }}
                        >
                          No description
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: "14px",
                        background: "rgba(6, 182, 212, 0.12)",
                        color: "var(--accent-cyan)",
                        border: "1px solid rgba(6, 182, 212, 0.25)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ~{aud.contact_count || 0} Contacts
                    </span>
                  </div>

                  {/* Tags */}
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      flexWrap: "wrap",
                      fontSize: "0.73rem",
                    }}
                  >
                    {aud.selected_recipients?.length > 0 && (
                      <span
                        style={{
                          background: "rgba(16, 185, 129, 0.15)",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          color: "#10b981",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          fontWeight: 700,
                        }}
                      >
                        🎯 {aud.selected_recipients.length} Handpicked
                      </span>
                    )}
                    {(aud.sources || []).map((s: string) => (
                      <span
                        key={s}
                        style={{
                          background: "var(--chip-bg)",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                          fontWeight: 500,
                        }}
                      >
                        Source: {s}
                      </span>
                    ))}
                    {aud.filters?.country && (
                      <span
                        style={{
                          background: "var(--chip-bg)",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        Country: {aud.filters.country}
                      </span>
                    )}
                    {aud.filters?.category && (
                      <span
                        style={{
                          background: "var(--chip-bg)",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        Category: {aud.filters.category}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      borderTop: "1px solid var(--border-subtle)",
                      paddingTop: "10px",
                      marginTop: "auto",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => onSelectForReview(aud)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: "0.77rem",
                          fontWeight: 600,
                          borderColor: "rgba(6, 182, 212, 0.4)",
                          color: "var(--accent-cyan)",
                        }}
                        title="Generate personalized emails and review 1-by-1"
                      >
                        <Edit3 style={{ width: "12px", height: "12px" }} />
                        <span>Review &amp; Send</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectForBulk(aud)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.77rem", fontWeight: 600 }}
                        title="Send bulk campaign to this audience"
                      >
                        <Rocket
                          style={{
                            width: "12px",
                            height: "12px",
                            color: "var(--accent-amber)",
                          }}
                        />
                        <span>Bulk Send</span>
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleEditAudience(aud)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.77rem" }}
                        title="Edit in Studio"
                      >
                        <Edit3 style={{ width: "12px", height: "12px" }} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAudience(aud.id)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: "0.77rem",
                          color: "#ef4444",
                          borderColor: "rgba(239, 68, 68, 0.2)",
                          padding: "5px 8px",
                        }}
                        title="Delete audience"
                      >
                        <Trash2 style={{ width: "13px", height: "13px" }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AudiencesPanel;
