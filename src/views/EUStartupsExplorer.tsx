// @ts-nocheck
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Sparkles,
  Search,
  RotateCcw,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  Zap,
  Filter,
  CheckCircle,
  Users,
  Plus,
  UserPlus,
} from "lucide-react";
import { api } from "../services/api";

export function EUStartupsExplorer({ onToast }) {
  const [stats, setStats] = useState({ total: 0, countries: 0, categories: 0, people: 0, emails: 0 });
  const [options, setOptions] = useState({ countries: [], states: [], cities: [], categories: [], roles: [] });
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [role, setRole] = useState("");
  const [foundedMin, setFoundedMin] = useState("");
  const [foundedMax, setFoundedMax] = useState("");
  const [hasWebsite, setHasWebsite] = useState("");
  const [hasEmail, setHasEmail] = useState("");
  const [sort, setSort] = useState("updated_at|desc");
  const [perPage, setPerPage] = useState(25);

  // Manual Entry Modal
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [showAddStartupModal, setShowAddStartupModal] = useState(false);
  const [submittingStartup, setSubmittingStartup] = useState(false);
  const [startupForm, setStartupForm] = useState({
    company_name: "",
    website: "",
    country: "Germany",
    city: "Berlin",
    category: "AI & Automation",
    founded_year: "2023",
    description: "",
    tags: "",
    person_name: "",
    person_role: "Founder & CEO",
    person_email: "",
    person_linkedin: "",
  });

  const handleCreateManualStartup = async (e) => {
    e.preventDefault();
    if (!startupForm.company_name.trim()) {
      onToast("Company Name is required", "error");
      return;
    }
    setSubmittingStartup(true);
    try {
      const people = [];
      if (startupForm.person_name.trim() || startupForm.person_email.trim()) {
        people.push({
          name: startupForm.person_name.trim(),
          role: startupForm.person_role.trim() || "Founder",
          email: startupForm.person_email.trim(),
          linkedin: startupForm.person_linkedin.trim(),
        });
      }

      await api.createManualStartup({
        company_name: startupForm.company_name.trim(),
        website: startupForm.website.trim(),
        country: startupForm.country.trim(),
        city: startupForm.city.trim(),
        category: startupForm.category.trim(),
        founded_year: startupForm.founded_year ? parseInt(startupForm.founded_year) : null,
        description: startupForm.description.trim(),
        tags: startupForm.tags.trim(),
        people,
      });

      onToast(`Startup '${startupForm.company_name}' successfully added to database!`, "success");
      setShowAddStartupModal(false);
      setStartupForm({
        company_name: "",
        website: "",
        country: "Germany",
        city: "Berlin",
        category: "AI & Automation",
        founded_year: "2023",
        description: "",
        tags: "",
        person_name: "",
        person_role: "Founder & CEO",
        person_email: "",
        person_linkedin: "",
      });
      loadStats();
      loadStartups(1);
    } catch (err) {
      onToast(err.message || "Failed to create manual startup", "error");
    } finally {
      setSubmittingStartup(false);
    }
  };

  // Discovery Modal
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [discoverTopic, setDiscoverTopic] = useState("AI & Automation");
  const [discoverCountry, setDiscoverCountry] = useState("");
  const [discoverLimit, setDiscoverLimit] = useState(5);
  const [discovering, setDiscovering] = useState(false);
  const [activeTopics, setActiveTopics] = useState(["AI & Automation"]);
  const [enrichingId, setEnrichingId] = useState(null);

  const topicOptions = [
    "AI & Automation",
    "Web Development & Full-Stack Apps",
    "Android App & Mobile Development",
    "iOS & Apple Ecosystem Apps",
    "B2B SaaS",
    "Fintech & Payments",
    "Cybersecurity",
    "HealthTech",
    "CleanTech & Energy",
    "Robotics & Hardware",
  ];

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (selectedStartup || showAddStartupModal || showDiscoverModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedStartup, showAddStartupModal, showDiscoverModal]);

  const loadStats = async () => {
    try {
      const res = await api.getEUStats();
      setStats(res);
    } catch (e) {}
  };

  const loadOptions = async () => {
    try {
      const res = await api.getEUOptions();
      setOptions(res);
    } catch (e) {}
  };

  const loadStartups = async (targetPage = 1) => {
    setLoading(true);
    setPage(targetPage);
    try {
      const [sortCol, direction] = sort.split("|");
      const res = await api.getEUStartups({
        page: targetPage,
        per_page: perPage,
        search: search.trim(),
        country,
        state,
        city,
        category,
        role,
        founded_min: foundedMin.trim(),
        founded_max: foundedMax.trim(),
        has_website: hasWebsite,
        has_email: hasEmail,
        sort: sortCol || "updated_at",
        direction: direction || "desc",
      });
      setStartups(res.data || []);
      setTotalPages(res.pages || 1);
      setTotalResults(res.total || 0);
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadOptions();
    loadStartups(1);
  }, []);

  const handleResetFilters = () => {
    setSearch("");
    setCountry("");
    setState("");
    setCity("");
    setCategory("");
    setRole("");
    setFoundedMin("");
    setFoundedMax("");
    setHasWebsite("");
    setHasEmail("");
    setSort("updated_at|desc");
    setPerPage(25);
    setTimeout(() => loadStartups(1), 50);
  };

  const toggleTopic = (topic) => {
    let next;
    if (activeTopics.includes(topic)) {
      next = activeTopics.filter((t) => t !== topic);
    } else {
      next = [...activeTopics, topic];
    }
    setActiveTopics(next);
    setDiscoverTopic(next.join(", "));
  };

  const handleRunDiscover = async () => {
    setDiscovering(true);
    try {
      const res = await api.discoverEUStartups({
        topic: discoverTopic || "Tech",
        country: discoverCountry,
        limit: discoverLimit,
      });
      onToast(`Discovered & enriched ${res.discovered_count || 0} qualified European leads!`, "success");
      setShowDiscoverModal(false);
      loadStats();
      loadStartups(1);
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setDiscovering(false);
    }
  };

  const handleEnrichSingle = async (startupId, companyName) => {
    try {
      setEnrichingId(startupId);
      onToast(`Enriching ${companyName}... searching for verified leadership`, "info");
      const res = await api.enrichEUStartup(startupId);
      
      if (res?.data) {
        // Immediately update this startup row in local state without full reload
        setStartups((prev) =>
          prev.map((s) => (s.id === startupId ? { ...s, ...res.data } : s))
        );
      }

      if (res?.people_found > 0) {
        const topPerson = res.data.people[0];
        onToast(`✓ Enriched ${companyName}: Found ${topPerson.name} (${topPerson.role})!`, "success");
      } else {
        onToast(`${companyName}: No public executive profiles discovered.`, "info");
      }

      loadStats();
    } catch (e) {
      onToast(`Enrichment error: ${e.message}`, "error");
    } finally {
      setEnrichingId(null);
    }
  };

  const formatScrapedDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T"));
      if (isNaN(d.getTime())) return dateStr;
      return (
        d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
        ", " +
        d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      );
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      
      {/* Top Banner & Stats Counter Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem" }}>
        <div className="glass-card" style={{ padding: "0.9rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            Total Startups
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
            {(stats.total || 0).toLocaleString()}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "0.9rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            Countries
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-cyan)", marginTop: "4px" }}>
            {(stats.countries || 0).toLocaleString()}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "0.9rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            Categories
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-violet)", marginTop: "4px" }}>
            {(stats.categories || 0).toLocaleString()}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "0.9rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            Founders / People
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-amber)", marginTop: "4px" }}>
            {(stats.people || 0).toLocaleString()}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "0.9rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            Direct Emails
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-emerald)", marginTop: "4px" }}>
            {(stats.emails || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Action Header & Filters Card */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title-group">
            <Building2 style={{ width: "18px", height: "18px", color: "var(--accent-cyan)" }} />
            <h2>EU Startups Directory &amp; Lead Explorer</h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <button
              onClick={() => setShowAddStartupModal(true)}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus style={{ width: "14px", height: "14px" }} />
              <span>Add Startup</span>
            </button>

            <button
              onClick={() => setShowDiscoverModal(true)}
              className="btn btn-primary"
              style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }}
            >
              <Sparkles style={{ width: "14px", height: "14px" }} />
              <span>Discover &amp; Enrich More Leads</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Row 1: Search & Core Dropdowns */}
          <div className="form-row">
            <div className="form-group flex-2">
              <input
                type="text"
                className="eu-input"
                placeholder="Search company, tags, description, founder..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadStartups(1)}
              />
            </div>

            <div className="form-group flex-1">
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">All Countries</option>
                {(options.countries || []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group flex-1">
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {(options.categories || []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group flex-1">
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">All Roles</option>
                {(options.roles || []).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Secondary Filters & Sort */}
          <div className="form-row" style={{ alignItems: "center" }}>
            <div className="form-group" style={{ width: "120px" }}>
              <input
                type="number"
                className="eu-input"
                placeholder="Min Year"
                value={foundedMin}
                onChange={(e) => setFoundedMin(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ width: "120px" }}>
              <input
                type="number"
                className="eu-input"
                placeholder="Max Year"
                value={foundedMax}
                onChange={(e) => setFoundedMax(e.target.value)}
              />
            </div>

            <div className="form-group flex-1">
              <select value={hasEmail} onChange={(e) => setHasEmail(e.target.value)}>
                <option value="">Email: Any</option>
                <option value="yes">Has Email (Verified)</option>
                <option value="no">No Email</option>
              </select>
            </div>

            <div className="form-group flex-1">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="updated_at|desc">Recently Enriched</option>
                <option value="created_at|desc">Recently Added</option>
                <option value="founded_year|desc">Founded: Newest First</option>
                <option value="founded_year|asc">Founded: Oldest First</option>
                <option value="company_name|asc">Name: A-Z</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.85rem" }}>
              <button onClick={() => loadStartups(1)} className="btn btn-primary btn-sm">
                <Search style={{ width: "13px", height: "13px" }} /> Apply
              </button>
              <button onClick={handleResetFilters} className="btn btn-secondary btn-sm" title="Reset Filters">
                <RotateCcw style={{ width: "13px", height: "13px" }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Startups Table */}
      <div className="glass-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {totalResults.toLocaleString()} result{totalResults === 1 ? "" : "s"} • Page {page} of {Math.max(totalPages, 1)}
          </span>
        </div>

        <div className="eu-table-wrapper">
          <table className="eu-startups-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Location</th>
                <th>Category</th>
                <th>Funding / Stage</th>
                <th>Employees</th>
                <th>Tags</th>
                <th>People &amp; Roles</th>
                <th>Contacts</th>
                <th>Sources &amp; Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "50px" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                      <div className="spinner" />
                      <span>Loading European startups...</span>
                    </div>
                  </td>
                </tr>
              ) : startups.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "50px", color: "var(--text-muted)" }}>
                    No startups match your current filters.
                  </td>
                </tr>
              ) : (
                startups.map((s) => {
                  const tags = s.tags
                    ? s.tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                    : [];

                  return (
                    <tr key={s.id}>
                      {/* Company */}
                      <td>
                        <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>
                          {s.website ? (
                            <a
                              href={s.website}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "var(--text-primary)", textDecoration: "none" }}
                            >
                              {s.company_name || "Unnamed Startup"}
                            </a>
                          ) : (
                            s.company_name || "Unnamed Startup"
                          )}
                        </div>
                        {s.description && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              marginTop: "4px",
                              maxHeight: "44px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              lineHeight: 1.4,
                            }}
                          >
                            {s.description}
                          </div>
                        )}
                      </td>

                      {/* Location */}
                      <td>
                        <span className="platform-badge" style={{ fontSize: "0.7rem", textTransform: "none" }}>
                          {s.country || "Global"}
                        </span>
                      </td>

                      {/* Category */}
                      <td>
                        {s.category ? (
                          <span className="platform-badge accent" style={{ fontSize: "0.7rem", textTransform: "none" }}>
                            {s.category}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Funding / Stage */}
                      <td>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-emerald)" }}>
                          {s.funding_total ? `${s.funding_total}` : "Undisclosed"}
                        </div>
                        {s.stage && (
                          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                            {s.stage}
                          </div>
                        )}
                      </td>

                      {/* Employees */}
                      <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {s.employees ? `${s.employees} people` : "—"}
                      </td>

                      {/* Tags */}
                      <td>
                        {tags.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", maxWidth: "160px" }}>
                            {tags.slice(0, 4).map((t, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: "0.68rem",
                                  padding: "2px 6px",
                                  background: "var(--chip-bg)",
                                  border: "1px solid var(--border-subtle)",
                                  borderRadius: "4px",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* People & Roles */}
                      <td style={{ minWidth: "180px" }}>
                        {(s.people || []).length === 0 ? (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>No contacts found</span>
                        ) : (
                          (s.people || []).map((p, pIdx) => {
                            const isPersonal = p.linkedin && p.linkedin.includes("/in/");
                            return (
                              <div
                                key={pIdx}
                                style={{
                                  marginBottom: "6px",
                                  padding: "6px",
                                  background: "var(--chip-bg)",
                                  border: "1px solid var(--border-subtle)",
                                  borderRadius: "6px",
                                  fontSize: "0.78rem",
                                }}
                              >
                                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{p.name || "Founder / Leadership"}</div>
                                {p.role && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{p.role}</div>}
                                {p.email && (
                                  <div
                                    style={{
                                      fontSize: "0.72rem",
                                      color: "var(--accent-cyan)",
                                      fontFamily: "var(--font-mono)",
                                      marginTop: "2px",
                                    }}
                                  >
                                    ✉ {p.email}
                                  </div>
                                )}
                                {isPersonal && (
                                  <a
                                    href={p.linkedin}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                      fontSize: "0.7rem",
                                      color: "#818cf8",
                                      marginTop: "2px",
                                    }}
                                  >
                                    <ExternalLink style={{ width: "10px", height: "10px" }} />
                                    <span>Founder LinkedIn</span>
                                  </a>
                                )}
                              </div>
                            );
                          })
                        )}
                      </td>

                      {/* Contacts Stats */}
                      <td>
                        <div className="camp-stat-pill success" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
                          {s.email_count || 0} emails
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          {s.people_count || 0} people
                        </div>
                      </td>

                      {/* Sources & Actions */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {s.eu_startups_url && (
                            <a
                              href={s.eu_startups_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: "0.74rem", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "3px" }}
                            >
                              <ExternalLink style={{ width: "11px", height: "11px" }} /> EU-Startups
                            </a>
                          )}
                          {s.website && (
                            <a
                              href={s.website}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: "0.74rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "3px" }}
                            >
                              <Globe style={{ width: "11px", height: "11px" }} /> Website
                            </a>
                          )}
                          <button
                            onClick={() => handleEnrichSingle(s.id, s.company_name)}
                            disabled={enrichingId === s.id}
                            className="btn btn-secondary btn-sm"
                            style={{
                              marginTop: "4px",
                              fontSize: "0.7rem",
                              opacity: enrichingId === s.id ? 0.7 : 1,
                              cursor: enrichingId === s.id ? "not-allowed" : "pointer"
                            }}
                          >
                            {enrichingId === s.id ? (
                              <>
                                <div className="spinner" style={{ width: "10px", height: "10px", borderWidth: "1.5px" }} />
                                <span>Enriching...</span>
                              </>
                            ) : (
                              <>
                                <Zap style={{ width: "11px", height: "11px", color: "var(--accent-amber)" }} />
                                <span>Enrich</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "1.25rem" }}>
            <button
              disabled={page <= 1}
              onClick={() => loadStartups(page - 1)}
              className="btn btn-secondary btn-sm"
            >
              ‹ Previous
            </button>
            <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => loadStartups(page + 1)}
              className="btn btn-secondary btn-sm"
            >
              Next ›
            </button>
          </div>
        )}
      </div>

      {/* Startup Details Modal (Rendered to body via createPortal) */}
      {selectedStartup &&
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
            onClick={() => setSelectedStartup(null)}
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
              <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span className="platform-badge accent" style={{ fontSize: "0.72rem" }}>EU Startup Profile</span>
                    {selectedStartup.category && (
                      <span className="platform-badge" style={{ fontSize: "0.72rem" }}>
                        {selectedStartup.category}
                      </span>
                    )}
                    {selectedStartup.founded_year && (
                      <span className="platform-badge" style={{ fontSize: "0.72rem" }}>
                        Founded {selectedStartup.founded_year}
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    {selectedStartup.company_name}
                  </h2>
                </div>
                <button
                  className="btn-close"
                  onClick={() => setSelectedStartup(null)}
                  style={{
                    fontSize: "1.4rem",
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    padding: "4px 8px",
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Quick Info Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
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
                  <strong>{[selectedStartup.city, selectedStartup.country].filter(Boolean).join(", ") || "Europe"}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.74rem" }}>WEBSITE</span>
                  {selectedStartup.website ? (
                    <a
                      href={selectedStartup.website.startsWith("http") ? selectedStartup.website : `https://${selectedStartup.website}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--accent-cyan)", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                    >
                      <Globe style={{ width: "12px", height: "12px" }} />
                      {selectedStartup.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </div>
                {selectedStartup.company_linkedin && (
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.74rem" }}>LINKEDIN</span>
                    <a
                      href={selectedStartup.company_linkedin}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--accent-indigo)", fontSize: "0.8rem" }}
                    >
                      Company Profile →
                    </a>
                  </div>
                )}
              </div>

              {/* People Section */}
              <div style={{ marginBottom: "1.2rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--accent-emerald)", margin: 0 }}>
                    Founders &amp; Key Leadership ({selectedStartup.people?.length || 0})
                  </h4>
                  <button
                    onClick={() => {
                      handleEnrichSingle(selectedStartup.id, selectedStartup.company_name);
                      setSelectedStartup(null);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                  >
                    <Sparkles style={{ width: "11px", height: "11px", color: "var(--accent-cyan)" }} /> Auto-Enrich More
                  </button>
                </div>

                {selectedStartup.people && selectedStartup.people.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {selectedStartup.people.map((p, i) => (
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
                            {p.name || "Executive"}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {p.role || "Leadership"}
                          </div>
                          {p.email && (
                            <div
                              style={{
                                color: "var(--accent-emerald)",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.8rem",
                                marginTop: "3px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <span>✉</span>
                              <span>{p.email}</span>
                            </div>
                          )}
                        </div>

                        {p.linkedin && (
                          <a
                            href={p.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "0.74rem", padding: "4px 8px", textDecoration: "none" }}
                          >
                            LinkedIn →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic", padding: "8px 0" }}>
                    No people recorded yet. Click "Auto-Enrich More" to discover founders using AI.
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedStartup.description && (
                <div style={{ marginBottom: "1.2rem" }}>
                  <h4 style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-primary)" }}>
                    About Company
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
                    {selectedStartup.description}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedStartup.tags && (
                <div style={{ marginBottom: "1.2rem" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-muted)" }}>
                    Industry Tags
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {selectedStartup.tags.split(",").map((t, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "0.74rem",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "rgba(16, 185, 129, 0.1)",
                          color: "#10b981",
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                        }}
                      >
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.85rem", marginTop: "0.5rem" }}>
                <button onClick={() => setSelectedStartup(null)} className="btn btn-secondary btn-sm" style={{ padding: "6px 16px" }}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Discovery Modal (Rendered to body via createPortal) */}
      {showDiscoverModal &&
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
            onClick={() => !discovering && setShowDiscoverModal(false)}
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
              <div className="modal-header">
                <div className="modal-title-group">
                  <span className="platform-badge accent">
                    <Sparkles style={{ width: "12px", height: "12px" }} /> AI Lead Discovery
                  </span>
                  <h2>Discover &amp; Enrich High-Growth EU Startups</h2>
                </div>
                <button className="btn-close" disabled={discovering} onClick={() => setShowDiscoverModal(false)}>
                  &times;
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <p style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
                  Automatically search European tech ecosystems, probe official company websites, reason with Gemini LLM, extract human founders and deliver verified direct emails.
                </p>

                {/* Quick Topic Chips */}
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>
                    Select Focus Market / Vertical:
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {topicOptions.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDiscoverTopic(t)}
                        style={{
                          background: discoverTopic === t ? "var(--accent-cyan)" : "var(--chip-bg)",
                          color: discoverTopic === t ? "#000" : "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                          padding: "4px 10px",
                          borderRadius: "14px",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          fontWeight: discoverTopic === t ? 600 : 400,
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Custom Topic / Search Keywords</label>
                  <input
                    type="text"
                    className="eu-input"
                    placeholder="e.g. B2B SaaS, Climate Tech, Quantum Computing..."
                    value={discoverTopic}
                    onChange={(e) => setDiscoverTopic(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Target Country (Optional)</label>
                    <input
                      type="text"
                      className="eu-input"
                      placeholder="e.g. Germany, France, United Kingdom..."
                      value={discoverCountry}
                      onChange={(e) => setDiscoverCountry(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Number of Startups to Discover</label>
                    <select
                      className="eu-input"
                      value={discoverLimit}
                      onChange={(e) => setDiscoverLimit(Number(e.target.value))}
                    >
                      <option value={3}>3 Startups (Fast)</option>
                      <option value={5}>5 Startups (Recommended)</option>
                      <option value={10}>10 Startups</option>
                      <option value={15}>15 Startups (Deep Scan)</option>
                    </select>
                  </div>
                </div>

                {discovering && (
                  <div
                    style={{
                      background: "var(--chip-bg)",
                      border: "1px solid var(--border-subtle)",
                      padding: "1rem",
                      borderRadius: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--accent-cyan)", fontWeight: 600, fontSize: "0.9rem" }}>
                      <div className="spinner" style={{ width: "16px", height: "16px" }} />
                      <span>Research Agent Operating...</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      Scraping directory &amp; websites, executing founder extraction and deliverability verification.
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    disabled={discovering}
                    onClick={() => setShowDiscoverModal(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={discovering}
                    onClick={handleRunDiscover}
                    className="btn btn-primary btn-sm"
                    style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }}
                  >
                    <Sparkles style={{ width: "14px", height: "14px" }} />
                    <span>{discovering ? "Discovering..." : "Start Lead Discovery"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Manual Startup Entry Modal (Rendered to body via createPortal) */}
      {showAddStartupModal &&
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
            onClick={() => !submittingStartup && setShowAddStartupModal(false)}
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
                    <Building2 style={{ width: "12px", height: "12px" }} /> Manual Entry
                  </span>
                  <h2>Add European Startup to Database</h2>
                </div>
                <button className="btn-close" disabled={submittingStartup} onClick={() => setShowAddStartupModal(false)}>
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateManualStartup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      required
                      className="eu-input"
                      placeholder="e.g. Mistral AI"
                      value={startupForm.company_name}
                      onChange={(e) => setStartupForm({ ...startupForm, company_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Website URL</label>
                    <input
                      type="text"
                      className="eu-input"
                      placeholder="https://example.com"
                      value={startupForm.website}
                      onChange={(e) => setStartupForm({ ...startupForm, website: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.8rem" }}>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      className="eu-input"
                      placeholder="e.g. Germany"
                      value={startupForm.country}
                      onChange={(e) => setStartupForm({ ...startupForm, country: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      className="eu-input"
                      placeholder="e.g. Berlin"
                      value={startupForm.city}
                      onChange={(e) => setStartupForm({ ...startupForm, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Founded Year</label>
                    <input
                      type="number"
                      className="eu-input"
                      placeholder="2023"
                      value={startupForm.founded_year}
                      onChange={(e) => setStartupForm({ ...startupForm, founded_year: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Industry / Category</label>
                    <input
                      type="text"
                      className="eu-input"
                      placeholder="e.g. AI & Automation"
                      value={startupForm.category}
                      onChange={(e) => setStartupForm({ ...startupForm, category: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tags (comma-separated)</label>
                    <input
                      type="text"
                      className="eu-input"
                      placeholder="e.g. saas, llm, b2b"
                      value={startupForm.tags}
                      onChange={(e) => setStartupForm({ ...startupForm, tags: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Company Description</label>
                  <textarea
                    className="eu-input"
                    rows={2}
                    placeholder="Brief summary of the startup's product and mission..."
                    value={startupForm.description}
                    onChange={(e) => setStartupForm({ ...startupForm, description: e.target.value })}
                  />
                </div>

                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.8rem" }}>
                  <h4 style={{ fontSize: "0.88rem", marginBottom: "0.6rem", color: "var(--accent-emerald)" }}>
                    Key Executive / Founder Info
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                    <div className="form-group">
                      <label>Founder Name</label>
                      <input
                        type="text"
                        className="eu-input"
                        placeholder="e.g. Arthur Mensch"
                        value={startupForm.person_name}
                        onChange={(e) => setStartupForm({ ...startupForm, person_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Role</label>
                      <input
                        type="text"
                        className="eu-input"
                        placeholder="e.g. CEO & Co-Founder"
                        value={startupForm.person_role}
                        onChange={(e) => setStartupForm({ ...startupForm, person_role: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginTop: "0.6rem" }}>
                    <div className="form-group">
                      <label>Verified Email</label>
                      <input
                        type="email"
                        className="eu-input"
                        placeholder="e.g. arthur@company.eu"
                        value={startupForm.person_email}
                        onChange={(e) => setStartupForm({ ...startupForm, person_email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>LinkedIn Profile URL</label>
                      <input
                        type="text"
                        className="eu-input"
                        placeholder="https://linkedin.com/in/..."
                        value={startupForm.person_linkedin}
                        onChange={(e) => setStartupForm({ ...startupForm, person_linkedin: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    disabled={submittingStartup}
                    onClick={() => setShowAddStartupModal(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingStartup}
                    className="btn btn-primary btn-sm"
                    style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }}
                  >
                    {submittingStartup ? "Saving..." : "Save Startup to DB"}
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
