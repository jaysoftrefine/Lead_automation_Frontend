import React from "react";
import { Clock, RefreshCw, Edit3, Rocket, List, Trash2, GitBranch } from "lucide-react";
import type { Campaign } from "../../../types/email";

export interface CampaignHistoryPanelProps {
  campaigns: Campaign[];
  onRefresh: () => void;
  onEditCampaign: (campaign: Campaign) => void;
  onLaunchDraft: (campaign: Campaign) => void;
  onOpenLogs: (campaign: Campaign) => void;
  onDeleteCampaign: (id: string) => void;
  onManageSequence?: (campaign: Campaign) => void;
}

function formatRelative(isoString?: string) {
  if (!isoString) return "";
  try {
    const diffMs = new Date(isoString).getTime() - Date.now();
    if (isNaN(diffMs)) return "";
    if (diffMs <= 60000 && diffMs >= -60000) return "due now";
    if (diffMs < 0) return "past due";
    const totalMins = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMins / (24 * 60));
    const hours = Math.floor((totalMins % (24 * 60)) / 60);
    const mins = totalMins % 60;
    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${mins}m`;
    return `in ${mins}m`;
  } catch {
    return "";
  }
}

export function CampaignHistoryPanel({
  campaigns,
  onRefresh,
  onEditCampaign,
  onLaunchDraft,
  onOpenLogs,
  onDeleteCampaign,
  onManageSequence,
}: CampaignHistoryPanelProps) {
  return (
    <div className="glass-card">
      <div className="card-header">
        <div className="card-title-group">
          <Clock
            style={{
              width: "18px",
              height: "18px",
              color: "var(--accent-violet)",
            }}
          />
          <h2>Historical Campaigns ({campaigns.length})</h2>
        </div>
        <button
          onClick={onRefresh}
          className="btn-icon-ghost"
          title="Refresh history"
        >
          <RefreshCw style={{ width: "14px", height: "14px" }} />
        </button>
      </div>

      <div className="eu-table-wrapper" style={{ marginTop: "1rem" }}>
        <table className="eu-startups-table">
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Template</th>
              <th>Status</th>
              <th>Sent</th>
              <th>Failed</th>
              <th>Total</th>
              <th>Launched</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "var(--text-muted)",
                  }}
                >
                  No campaigns found. Launch a campaign from the Send Campaign tab.
                </td>
              </tr>
            ) : (
              campaigns.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      {c.name}
                      {c.campaign_type === "sequence" && (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "3px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              fontSize: "0.68rem",
                              padding: "2px 7px",
                              borderRadius: "99px",
                              background: "rgba(99,102,241,0.15)",
                              color: "var(--accent-violet)",
                              fontWeight: 700,
                            }}
                          >
                            <GitBranch style={{ width: "9px", height: "9px" }} />
                            Sequence ({c.completed_steps || 0}/{c.total_steps || "?"})
                          </span>
                          {c.next_step ? (
                            <span
                              style={{
                                fontSize: "0.68rem",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                background: c.next_step.status === "paused" ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 102, 241, 0.1)",
                                color: c.next_step.status === "paused" ? "var(--accent-amber)" : "var(--accent-violet)",
                                fontWeight: 600,
                              }}
                              title={c.next_step.scheduled_at ? `Scheduled: ${new Date(c.next_step.scheduled_at).toLocaleString()}` : undefined}
                            >
                              {c.next_step.status === "paused"
                                ? `⏸️ Step ${c.next_step.step_number} Paused`
                                : `⏰ Step ${c.next_step.step_number} fires ${formatRelative(c.next_step.scheduled_at)}`}
                            </span>
                          ) : c.completed_steps && c.total_steps && c.completed_steps >= c.total_steps ? (
                            <span style={{ fontSize: "0.68rem", color: "#10b981", fontWeight: 600 }}>
                              ✓ All {c.total_steps} steps sent
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {c.template_name || "—"}
                  </td>
                  <td>
                    <span
                      className={`camp-stat-pill ${
                        c.status === "completed"
                          ? "success"
                          : c.status === "running"
                          ? "info"
                          : c.status === "failed"
                          ? "error"
                          : c.status === "scheduled"
                          ? "info"
                          : ""
                      }`}
                      style={{
                        fontSize: "0.72rem",
                        textTransform: "capitalize",
                        background: c.status === "scheduled" ? "rgba(251,191,36,0.15)" : undefined,
                        color: c.status === "scheduled" ? "var(--accent-amber)" : undefined,
                        border: c.status === "scheduled" ? "1px solid rgba(251,191,36,0.3)" : undefined,
                      }}
                    >
                      {c.status === "scheduled" ? "⏰ Scheduled" : c.status}
                    </span>
                  </td>
                  <td style={{ color: "#10b981", fontWeight: 700 }}>
                    {c.sent_count || c.sent || 0}
                  </td>
                  <td style={{ color: "#fb7185", fontWeight: 700 }}>
                    {c.failed_count || 0}
                  </td>
                  <td>{c.total_recipients || c.total || 0}</td>
                  <td
                    style={{
                      fontSize: "0.76rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {c.created_at
                      ? new Date(c.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => onEditCampaign(c)}
                        className="btn btn-secondary btn-sm"
                        title="Edit campaign settings"
                      >
                        <Edit3 style={{ width: "12px", height: "12px" }} /> Edit
                      </button>
                      {c.status === "draft" && (
                        <button
                          onClick={() => onLaunchDraft(c)}
                          className="btn btn-primary btn-sm"
                          title="Launch this draft campaign"
                          style={{
                            background: "var(--accent-primary)",
                            color: "#fff",
                          }}
                        >
                          <Rocket style={{ width: "12px", height: "12px" }} /> Launch
                        </button>
                      )}
                      {c.campaign_type === "sequence" && onManageSequence && (
                        <button
                          onClick={() => onManageSequence(c)}
                          className="btn btn-secondary btn-sm"
                          title="View Drip Schedule & Edit Next Email Controls"
                          style={{
                            color: "var(--accent-violet)",
                            borderColor: "rgba(99, 102, 241, 0.3)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Clock style={{ width: "12px", height: "12px" }} /> Drip Schedule
                        </button>
                      )}
                      <button
                        onClick={() => onOpenLogs(c)}
                        className="btn btn-secondary btn-sm"
                        title="View delivery logs"
                      >
                        <List style={{ width: "12px", height: "12px" }} /> Logs
                      </button>
                      <button
                        onClick={() => onDeleteCampaign(c.id)}
                        className="btn-icon-ghost"
                        style={{ color: "#fb7185", padding: "4px" }}
                        title="Delete campaign"
                      >
                        <Trash2 style={{ width: "13px", height: "13px" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CampaignHistoryPanel;
