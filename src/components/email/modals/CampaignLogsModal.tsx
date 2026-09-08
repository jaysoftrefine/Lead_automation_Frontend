import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Modal } from "../../common/Modal";

export interface CampaignLogItem {
  id: string;
  recipient_name?: string;
  recipient_email: string;
  company_name?: string;
  status: "sent" | "failed" | string;
  error_message?: string;
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
                    <td style={{ color: "#fb7185", fontSize: "0.72rem" }}>
                      {l.error_message || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default CampaignLogsModal;
