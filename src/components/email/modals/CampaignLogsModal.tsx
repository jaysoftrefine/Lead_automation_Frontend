import React, { useState, useEffect } from "react";
import { Eye, Mail, FileText } from "lucide-react";
import { api } from "../../../services/api";
import { Modal } from "../../common/Modal";

export interface CampaignLogItem {
  id: string;
  recipient_name?: string;
  recipient_email: string;
  company_name?: string;
  status: "sent" | "failed" | string;
  error_message?: string;
  subject?: string;
  body?: string;
  sent_at?: string;
  attachment_name?: string;
  sender_email?: string;
}

export interface CampaignLogsModalProps {
  campaign: { id: string; name: string } | null;
  onClose: () => void;
  onToast?: (msg: string, type?: string) => void;
}

export function CampaignLogsModal({
  campaign,
  onClose,
  onToast,
}: CampaignLogsModalProps) {
  const [logs, setLogs] = useState<CampaignLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewEmail, setViewEmail] = useState<CampaignLogItem | null>(null);

  useEffect(() => {
    if (!campaign) return;

    const loadLogs = async () => {
      setLoading(true);
      try {
        const res = await api.getCampaignLogs(campaign.id, { per_page: 200 });
        setLogs(res.data || []);
      } catch (e: any) {
        if (onToast) onToast(e.message || "Failed to load logs", "error");
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [campaign]);

  if (!campaign) return null;

  return (
    <Modal
      isOpen={!!campaign}
      onClose={onClose}
      maxWidth="780px"
      maxHeight="85vh"
      title={campaign.name}
      subtitle="Email delivery & dispatch audit trail"
      icon={<span className="platform-badge">Delivery Logs</span>}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary btn-sm"
        >
          Close
        </button>
      }
    >
      <div style={{ padding: "0 1.25rem 1rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="spinner" style={{ margin: "0 auto 10px" }} />
            <span>Loading logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              padding: "30px",
              color: "var(--text-muted)",
            }}
          >
            No delivery logs recorded for this campaign.
          </p>
        ) : (
          <div
            className="eu-table-wrapper"
            style={{ maxHeight: "420px", overflowY: "auto" }}
          >
            <table className="eu-startups-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Content</th>
                  <th>Error Info</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>
                      {l.recipient_name || "—"}
                    </td>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.76rem",
                      }}
                    >
                      {l.recipient_email}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {l.company_name || "—"}
                    </td>
                    <td>
                      {l.status === "sent" ? (
                        <span
                          style={{
                            color: "#10b981",
                            fontWeight: 700,
                            fontSize: "0.76rem",
                          }}
                        >
                          ✓ Sent
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "#fb7185",
                            fontWeight: 700,
                            fontSize: "0.76rem",
                          }}
                        >
                          ✗ Failed
                        </span>
                      )}
                    </td>
                    <td>
                      {l.body || l.subject ? (
                        <button
                          type="button"
                          onClick={() => setViewEmail(l)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: "0.72rem",
                            padding: "0.2rem 0.5rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "var(--accent-cyan)",
                          }}
                          title="View exact sent email"
                        >
                          <Eye style={{ width: "12px", height: "12px" }} />
                          <span>View Mail</span>
                        </button>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>—</span>
                      )}
                    </td>
                    <td style={{ color: "#fb7185", fontSize: "0.72rem" }}>
                      {l.error_message || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View Sent Email Modal */}
        {viewEmail && (
          <Modal
            isOpen={true}
            onClose={() => setViewEmail(null)}
            maxWidth="680px"
            title={`Sent Mail: ${viewEmail.company_name || viewEmail.recipient_email}`}
            subtitle={`Dispatched to ${viewEmail.recipient_email}`}
            footer={
              <button
                type="button"
                onClick={() => setViewEmail(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
            }
          >
            <div style={{ padding: "0 1.25rem 1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div
                style={{
                  background: "var(--chip-bg)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.75rem",
                  fontSize: "0.8rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                <div><strong>To:</strong> {viewEmail.recipient_email}</div>
                {viewEmail.subject && (
                  <div><strong style={{ color: "var(--accent-cyan)" }}>Subject:</strong> {viewEmail.subject}</div>
                )}
                {viewEmail.attachment_name && (
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--accent-emerald)" }}>
                    <FileText style={{ width: "13px", height: "13px" }} />
                    <strong>Attachment:</strong> {viewEmail.attachment_name}
                  </div>
                )}
                {viewEmail.sent_at && (
                  <div style={{ color: "var(--text-muted)" }}>
                    <strong>Sent:</strong> {new Date(viewEmail.sent_at).toLocaleString()}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  EMAIL BODY:
                </label>
                <div
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.85rem",
                    fontSize: "0.82rem",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    maxHeight: "320px",
                    overflowY: "auto",
                  }}
                >
                  {viewEmail.body || "No email body recorded."}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Modal>
  );
}

export default CampaignLogsModal;
