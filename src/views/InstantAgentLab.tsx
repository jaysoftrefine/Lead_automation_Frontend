import React, { useState, useEffect } from "react";
import { Bot, Sparkles, FileText, CheckCircle2, UserPlus, Loader2 } from "lucide-react";
import { api } from "../services/api";

export interface InstantAgentLabProps {
  onToast: (message: string, type?: string) => void;
  onRefreshStats?: () => void;
}

export function InstantAgentLab({ onToast, onRefreshStats }: InstantAgentLabProps) {
  const [prompt, setPrompt] = useState(
    "Research fast-growing European B2B SaaS startups in AI & automation and extract their founders with direct emails."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("hirepilot_agent_lab_result");
      if (saved) return JSON.parse(saved);
    } catch {}
    // Seed with last research from session so cards and buttons are immediately present
    return {
      report: `# Executive Summary: Fast-Growing European B2B SaaS Startups in AI & Automation\n\nEurope's B2B SaaS ecosystem has demonstrated robust resilience, pivoting aggressively toward Artificial Intelligence and workflow automation. Driven by substantial venture capital infusions—ranging from massive early-stage seed rounds to late-stage unicorn rounds (such as Mistral AI, Osapiens, and Parloa)—European startups are defining global standards in generative AI, enterprise process automation, supply chain compliance, and intelligent orchestration.\n\n## Key Market Dynamics\n- **Sector Specialization:** Unlike broad consumer AI applications, European B2B SaaS startups excel in verticalized and governance-heavy domains like supply chain transparency (e.g., Osapiens), contact center automation (e.g., Parloa), legaltech, and developer tools.\n- **Funding Resilience:** Despite broader macroeconomic downturns, category-defining AI infrastructure and automation companies continue to attract massive rounds (e.g., Mistral AI's multi-million euro expansions, Osapiens' $100M Series C).\n- **Open Source and Enterprise Focus:** Startups are balancing community-driven open-source models with high-security, scalable enterprise platforms to capture high-margin B2B contracts globally.`,
      extracted_leads: [
        {
          name: "Arthur Mensch",
          role: "Co-founder & CEO",
          company: "Mistral AI",
          email: "arthur@mistral.ai",
        },
        {
          name: "Stefan Wessel",
          role: "Co-founder & CEO",
          company: "Osapiens",
          email: "stefan.wessel@osapiens.com",
        },
        {
          name: "Janik von der Ahé",
          role: "Co-Founder & CPO",
          company: "Osapiens",
          email: "janik.vonderahe@osapiens.com",
        },
        {
          name: "Jan Oberhauser",
          role: "Founder & CEO",
          company: "n8n",
          email: "jan@n8n.io",
        },
        {
          name: "Milos Rusic",
          role: "Co-Founder & CEO",
          company: "Deepset",
          email: "milos.rusic@deepset.ai",
        },
        {
          name: "Julian Brand",
          role: "Co-Founder & CTO",
          company: "Deepset",
          email: "julian.brand@deepset.ai",
        },
      ],
      sources: [
        "https://www.etiga.it/post/europes-10-fastest-growing-saas-startups-defying-the-downturn-with-ai",
        "https://www.omnius.so/blog/ai-startups-in-europe",
        "https://www.startup.eu/startups/saas",
      ],
    };
  });

  const [addingMap, setAddingMap] = useState<Record<string, boolean>>({});
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [addingAll, setAddingAll] = useState(false);

  const getLeadKey = (lead: any, idx: number) => {
    if (lead.email && lead.email.trim()) {
      return lead.email.trim().toLowerCase();
    }
    return `${(lead.company || "").trim().toLowerCase()}::${(lead.name || "").trim().toLowerCase()}::${idx}`;
  };

  // Check presence of extracted leads in SQLite on mount or when result changes
  useEffect(() => {
    if (result?.extracted_leads?.length) {
      api
        .checkLeadsPresence(result.extracted_leads)
        .then((presenceRes: any) => {
          if (presenceRes?.results) {
            setAddedMap((prev) => {
              const next = { ...prev };
              result.extracted_leads.forEach((lead: any, idx: number) => {
                const k = getLeadKey(lead, idx);
                const pres =
                  presenceRes.results[lead.email?.toLowerCase().trim()] ||
                  presenceRes.results[
                    `${lead.company?.toLowerCase().trim()}::${lead.name?.toLowerCase().trim()}`
                  ];
                if (pres?.already_exists) {
                  next[k] = true;
                }
              });
              return next;
            });
          }
        })
        .catch(() => {});
    }
  }, [result]);

  const handleRun = async () => {
    if (!prompt.trim()) {
      onToast("Please enter a research prompt", "error");
      return;
    }
    setLoading(true);
    setResult(null);
    setAddedMap({});

    try {
      const res = await api.runAgentResearch({ prompt: prompt.trim() });
      setResult(res);
      try {
        localStorage.setItem("hirepilot_agent_lab_result", JSON.stringify(res));
      } catch {}

      // Pre-populate already_exists status from backend
      const initialAdded: Record<string, boolean> = {};
      (res.extracted_leads || []).forEach((l: any, idx: number) => {
        if (l.already_exists) {
          initialAdded[getLeadKey(l, idx)] = true;
        }
      });
      setAddedMap(initialAdded);

      onToast("Agent research complete!", "success");
    } catch (e: any) {
      onToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (lead: any, idx: number) => {
    const key = getLeadKey(lead, idx);
    setAddingMap((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await api.addLeadFromAgent({
        name: lead.name,
        role: lead.role,
        company: lead.company,
        email: lead.email,
        research_prompt: prompt,
      });

      setAddedMap((prev) => ({ ...prev, [key]: true }));
      onToast(res.message || `Added ${lead.name || lead.company} to Leads!`, "success");
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      onToast(err.message || "Failed to add lead to database", "error");
    } finally {
      setAddingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleAddAllLeads = async () => {
    if (!result?.extracted_leads?.length) return;

    const toAdd = result.extracted_leads.filter(
      (l: any, idx: number) => !addedMap[getLeadKey(l, idx)] && !l.already_exists
    );

    if (toAdd.length === 0) {
      onToast("All contacts are already present in Leads!", "info");
      return;
    }

    setAddingAll(true);
    try {
      const res = await api.addBatchLeadsFromAgent({
        leads: toAdd.map((l: any) => ({
          name: l.name,
          role: l.role,
          company: l.company,
          email: l.email,
          research_prompt: prompt,
        })),
        research_prompt: prompt,
      });

      const newAdded = { ...addedMap };
      result.extracted_leads.forEach((l: any, idx: number) => {
        newAdded[getLeadKey(l, idx)] = true;
      });
      setAddedMap(newAdded);

      onToast(
        res.message || `Successfully added ${res.added_count || toAdd.length} lead(s) to database!`,
        "success"
      );
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      onToast(err.message || "Failed to add leads to database", "error");
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "1.25rem" }}>
      {/* Left: Query Form */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title-group">
            <Bot style={{ width: "18px", height: "18px", color: "var(--accent-violet)" }} />
            <h2>Autonomous Research Agent</h2>
          </div>
          <span className="platform-badge accent">Tavily + Gemini</span>
        </div>

        <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginTop: "0.85rem" }}>
          Execute deep real-time web research, multi-query cross-referencing, and decision-maker email extraction on any B2B market niche.
        </p>

        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label htmlFor="agent-prompt">Research Objective &amp; Instructions</label>
          <textarea
            id="agent-prompt"
            rows={7}
            className="eu-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What company, niche or target would you like to investigate?"
          />
        </div>

        <button
          onClick={handleRun}
          disabled={loading}
          className="btn btn-primary btn-large"
          style={{ marginTop: "0.5rem" }}
        >
          {loading ? (
            <>
              <div className="spinner" />
              <span>Agent Investigating Web Sources...</span>
            </>
          ) : (
            <>
              <Sparkles />
              <span>Launch Deep Agent Research</span>
            </>
          )}
        </button>
      </div>

      {/* Right: Output Report */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
        <div className="card-header">
          <div className="card-title-group">
            <FileText style={{ width: "18px", height: "18px", color: "var(--accent-emerald)" }} />
            <h2>Agent Intelligence Brief</h2>
          </div>
          {result && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="camp-stat-pill success" style={{ fontSize: "0.72rem" }}>
                <CheckCircle2 style={{ width: "12px", height: "12px" }} /> Complete
              </span>
              <button
                type="button"
                onClick={handleAddAllLeads}
                disabled={addingAll}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: "0.74rem",
                  padding: "4px 10px",
                  color: "var(--accent-emerald)",
                  borderColor: "rgba(16, 185, 129, 0.35)",
                  background: "rgba(16, 185, 129, 0.08)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {addingAll ? (
                  <>
                    <Loader2 style={{ width: "12px", height: "12px", animation: "spin 1s linear infinite" }} />
                    <span>Saving to Leads...</span>
                  </>
                ) : (
                  <>
                    <UserPlus style={{ width: "12px", height: "12px" }} />
                    <span>+ Add All to Leads</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, marginTop: "1rem", overflowY: "auto", maxHeight: "560px" }}>
          {!result && !loading && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
              <Bot style={{ width: "36px", height: "36px", margin: "0 auto 12px", color: "var(--text-dim)" }} />
              <h3>Agent Idle</h3>
              <p style={{ fontSize: "0.84rem", marginTop: "4px" }}>
                Provide an objective on the left and start the agent to generate a comprehensive intelligence report.
              </p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div className="spinner" style={{ width: "32px", height: "32px", margin: "0 auto 16px" }} />
              <h4 style={{ color: "var(--accent-cyan)" }}>Synthesizing Intelligence...</h4>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "6px" }}>
                Searching Google/Tavily, scraping company profiles, and running LLM reasoning.
              </p>
            </div>
          )}

          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", fontSize: "0.88rem" }}>
              {/* Report Body */}
              <div
                style={{
                  background: "var(--chip-bg)",
                  color: "var(--text-primary)",
                  padding: "1.1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {result.report || result.summary || result.analysis || JSON.stringify(result, null, 2)}
              </div>

              {/* Discovered Leads/Contacts if available */}
              {result.extracted_leads && result.extracted_leads.length > 0 && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.6rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h4 style={{ color: "var(--accent-cyan)", margin: 0, fontSize: "0.92rem", fontWeight: 700 }}>
                        Extracted Key Contacts
                      </h4>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          background: "var(--chip-bg)",
                          padding: "2px 7px",
                          borderRadius: "10px",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        {result.extracted_leads.length}
                      </span>
                    </div>

                    {(() => {
                      const unaddedCount = result.extracted_leads.filter(
                        (l: any, idx: number) => !addedMap[getLeadKey(l, idx)] && !l.already_exists
                      ).length;

                      if (unaddedCount > 0) {
                        return (
                          <button
                            type="button"
                            onClick={handleAddAllLeads}
                            disabled={addingAll}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: "0.74rem",
                              padding: "4px 10px",
                              color: "var(--accent-emerald)",
                              borderColor: "rgba(16, 185, 129, 0.35)",
                              background: "rgba(16, 185, 129, 0.08)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {addingAll ? (
                              <>
                                <Loader2 style={{ width: "12px", height: "12px", animation: "spin 1s linear infinite" }} />
                                <span>Adding All ({unaddedCount})...</span>
                              </>
                            ) : (
                              <>
                                <UserPlus style={{ width: "12px", height: "12px" }} />
                                <span>Add All to Leads ({unaddedCount})</span>
                              </>
                            )}
                          </button>
                        );
                      }

                      return (
                        <span
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--accent-emerald)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 style={{ width: "13px", height: "13px" }} /> All Saved to Leads
                        </span>
                      );
                    })()}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    {result.extracted_leads.map((lead: any, i: number) => {
                      const key = getLeadKey(lead, i);
                      const isAdded = !!addedMap[key] || !!lead.already_exists;
                      const isAdding = !!addingMap[key];

                      return (
                        <div
                          key={i}
                          style={{
                            padding: "12px 14px",
                            background: "var(--chip-bg)",
                            border: isAdded
                              ? "1.5px solid rgba(16, 185, 129, 0.4)"
                              : "1px solid var(--border-subtle)",
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "10px",
                            transition: "all 0.2s ease",
                            boxShadow: isAdded ? "0 2px 8px rgba(16, 185, 129, 0.08)" : "none",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.88rem" }}>
                              {lead.name || "Founder"}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                              {lead.role} • <strong style={{ color: "var(--text-secondary)" }}>{lead.company}</strong>
                            </div>
                            {lead.email && (
                              <div
                                style={{
                                  color: "var(--accent-cyan)",
                                  fontSize: "0.8rem",
                                  fontFamily: "var(--font-mono)",
                                  marginTop: "5px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <span>✉</span>
                                <span>{lead.email}</span>
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              paddingTop: "8px",
                              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                            }}
                          >
                            {isAdded ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "4px 11px",
                                  borderRadius: "6px",
                                  background: "rgba(16, 185, 129, 0.16)",
                                  color: "var(--accent-emerald)",
                                  border: "1.5px solid rgba(16, 185, 129, 0.4)",
                                  fontSize: "0.76rem",
                                  fontWeight: 700,
                                }}
                              >
                                <CheckCircle2 style={{ width: "13px", height: "13px" }} />
                                <span>✓ In Leads</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddLead(lead, i)}
                                disabled={isAdding || addingAll}
                                className="btn btn-primary btn-sm"
                                style={{
                                  fontSize: "0.76rem",
                                  padding: "5px 12px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  fontWeight: 700,
                                  background: "linear-gradient(135deg, #06b6d4, #0284c7)",
                                  borderColor: "#0284c7",
                                  color: "#fff",
                                  boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)",
                                  cursor: "pointer",
                                }}
                              >
                                {isAdding ? (
                                  <>
                                    <Loader2
                                      style={{
                                        width: "12px",
                                        height: "12px",
                                        animation: "spin 1s linear infinite",
                                      }}
                                    />
                                    <span>Adding...</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus style={{ width: "13px", height: "13px" }} />
                                    <span>+ Add to Leads</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sources */}
              {result.sources && result.sources.length > 0 && (
                <div>
                  <h4 style={{ color: "var(--accent-amber)", marginBottom: "0.4rem" }}>Referenced Sources</h4>
                  <ul style={{ paddingLeft: "20px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    {result.sources.map((s: string, i: number) => (
                      <li key={i} style={{ marginBottom: "3px" }}>
                        <a href={s} target="_blank" rel="noreferrer" style={{ color: "var(--accent-cyan)" }}>
                          {s}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

