import React, { useState } from "react";
import { Bot, Sparkles, Send, Globe, FileText, CheckCircle2, UserCheck } from "lucide-react";
import { api } from "../services/api";

export function InstantAgentLab({ onToast }) {
  const [prompt, setPrompt] = useState(
    "Research fast-growing European B2B SaaS startups in AI & automation and extract their founders with direct emails."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    if (!prompt.trim()) {
      onToast("Please enter a research prompt", "error");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const res = await api.runAgentResearch({ prompt: prompt.trim() });
      setResult(res);
      onToast("Agent research complete!", "success");
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setLoading(false);
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
            rows="7"
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
            <span className="camp-stat-pill success" style={{ fontSize: "0.72rem" }}>
              <CheckCircle2 style={{ width: "12px", height: "12px" }} /> Complete
            </span>
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
                  background: "rgba(255,255,255,0.03)",
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
                  <h4 style={{ color: "var(--accent-cyan)", marginBottom: "0.5rem" }}>Extracted Key Contacts</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    {result.extracted_leads.map((lead, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "10px",
                          background: "rgba(15,23,42,0.8)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "8px",
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "#fff" }}>{lead.name || "Founder"}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {lead.role} • {lead.company}
                        </div>
                        {lead.email && (
                          <div style={{ color: "var(--accent-cyan)", fontSize: "0.8rem", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                            ✉ {lead.email}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {result.sources && result.sources.length > 0 && (
                <div>
                  <h4 style={{ color: "var(--accent-amber)", marginBottom: "0.4rem" }}>Referenced Sources</h4>
                  <ul style={{ paddingLeft: "20px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    {result.sources.map((s, i) => (
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
