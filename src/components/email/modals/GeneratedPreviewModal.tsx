import React, { useState } from "react";
import { Eye, Send, ArrowRight } from "lucide-react";
import { Modal } from "../../common/Modal";

export interface GeneratedEmailItem {
  recipient: {
    person_name?: string;
    company_name?: string;
    email?: string;
    role?: string;
    website?: string;
    is_sample?: boolean;
    [key: string]: any;
  };
  rendered_subject: string;
  rendered_body: string;
}

export interface GeneratedPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedEmails: GeneratedEmailItem[];
  loadingPreview: boolean;
  senderName?: string;
  senderEmail?: string;
  onSendTest?: (testEmail: string, currentItem: GeneratedEmailItem) => Promise<void>;
  onProceedToLaunch?: () => void;
  onToast?: (msg: string, type?: string) => void;
}

export function GeneratedPreviewModal({
  isOpen,
  onClose,
  generatedEmails,
  loadingPreview,
  senderName = "Stephan Arnas",
  senderEmail = "outreach@softrefine.com",
  onSendTest,
  onProceedToLaunch,
  onToast,
}: GeneratedPreviewModalProps) {
  const [previewIndex, setPreviewIndex] = useState(0);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const currentItem = generatedEmails[previewIndex] || generatedEmails[0];
  const rec = currentItem?.recipient || {};

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      if (onToast) onToast("Please enter a valid test email address", "error");
      return;
    }
    if (!currentItem) return;

    setSendingTest(true);
    try {
      if (onSendTest) {
        await onSendTest(testEmail, currentItem);
      }
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="880px"
      maxHeight="92vh"
      title="Generated Outreach Email Preview"
      subtitle="Showing exactly what will be sent to your audience with personalized AI variables & company data"
      icon={<Eye style={{ width: "20px", height: "20px", color: "var(--accent-cyan)" }} />}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="email"
              className="eu-input"
              style={{ width: "220px", fontSize: "0.8rem", padding: "6px 10px" }}
              placeholder="Send test to your email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <button
              type="button"
              disabled={sendingTest || !currentItem}
              onClick={handleSendTest}
              className="btn btn-secondary btn-sm"
            >
              <Send style={{ width: "12px", height: "12px" }} />
              <span>{sendingTest ? "Sending..." : "Send Test to Me"}</span>
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
            >
              Close Preview
            </button>
            {onProceedToLaunch && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onProceedToLaunch();
                }}
              >
                <span>Proceed to Launch</span>
                <ArrowRight style={{ width: "13px", height: "13px" }} />
              </button>
            )}
          </div>
        </div>
      }
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {loadingPreview ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div
              className="spinner"
              style={{
                margin: "0 auto 16px",
                width: "30px",
                height: "30px",
              }}
            />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Generating personalized emails with AI &amp; template variables...
            </p>
          </div>
        ) : generatedEmails.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              color: "var(--text-muted)",
            }}
          >
            <p>
              No recipients available for preview. Please select an audience or enter manual contacts.
            </p>
          </div>
        ) : (
          <>
            {/* Recipient Navigator Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                padding: "10px 14px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Recipient {previewIndex + 1} of {generatedEmails.length}
                </span>
                {rec.is_sample && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      background: "rgba(245, 158, 11, 0.15)",
                      color: "#f59e0b",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                    }}
                  >
                    Sample Fallback Preview
                  </span>
                )}
              </div>

              {/* Prev / Next buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  disabled={previewIndex === 0}
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                >
                  ◀ Previous
                </button>
                <button
                  type="button"
                  disabled={previewIndex >= generatedEmails.length - 1}
                  onClick={() =>
                    setPreviewIndex((i) => Math.min(generatedEmails.length - 1, i + 1))
                  }
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                >
                  Next ▶
                </button>
              </div>
            </div>

            {/* Recipient Information Metadata Chips */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                fontSize: "0.78rem",
              }}
            >
              <div
                style={{
                  background: "var(--chip-bg)",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <strong style={{ color: "var(--text-muted)" }}>Name:</strong>{" "}
                <span style={{ color: "var(--text-primary)" }}>
                  {rec.person_name || "(None)"}
                </span>
              </div>
              <div
                style={{
                  background: "var(--chip-bg)",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <strong style={{ color: "var(--text-muted)" }}>Company:</strong>{" "}
                <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
                  {rec.company_name || "(None)"}
                </span>
              </div>
              <div
                style={{
                  background: "var(--chip-bg)",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <strong style={{ color: "var(--text-muted)" }}>Email:</strong>{" "}
                <span style={{ color: "var(--text-primary)" }}>
                  {rec.email || "(None)"}
                </span>
              </div>
              {rec.role && (
                <div
                  style={{
                    background: "var(--chip-bg)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <strong style={{ color: "var(--text-muted)" }}>Role:</strong>{" "}
                  <span style={{ color: "var(--text-primary)" }}>{rec.role}</span>
                </div>
              )}
              {rec.website && (
                <div
                  style={{
                    background: "var(--chip-bg)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <strong style={{ color: "var(--text-muted)" }}>Website:</strong>{" "}
                  <span style={{ color: "#0066cc" }}>{rec.website}</span>
                </div>
              )}
            </div>

            {/* Email Mockup Client Box */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
              }}
            >
              <div
                style={{
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  padding: "12px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "0.84rem",
                  color: "#334155",
                }}
              >
                <div>
                  <strong
                    style={{
                      color: "#64748b",
                      display: "inline-block",
                      width: "70px",
                    }}
                  >
                    Subject:
                  </strong>
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: "0.95rem",
                    }}
                  >
                    {currentItem.rendered_subject}
                  </span>
                </div>
                <div>
                  <strong
                    style={{
                      color: "#64748b",
                      display: "inline-block",
                      width: "70px",
                    }}
                  >
                    From:
                  </strong>
                  <span>
                    {senderName} &lt;{senderEmail}&gt;
                  </span>
                </div>
                <div>
                  <strong
                    style={{
                      color: "#64748b",
                      display: "inline-block",
                      width: "70px",
                    }}
                  >
                    To:
                  </strong>
                  <span>
                    {rec.person_name
                      ? `${rec.person_name} <${rec.email}>`
                      : rec.email}
                  </span>
                </div>
              </div>

              {/* Rendered HTML Email Body */}
              <div
                style={{
                  padding: "24px 28px",
                  background: "#ffffff",
                  minHeight: "280px",
                  maxHeight: "460px",
                  overflowY: "auto",
                  color: "#222222",
                }}
                dangerouslySetInnerHTML={{
                  __html: currentItem.rendered_body,
                }}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default GeneratedPreviewModal;
