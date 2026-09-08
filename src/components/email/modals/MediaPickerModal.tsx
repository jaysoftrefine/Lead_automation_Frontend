import React, { useState, useEffect } from "react";
import { FolderOpen, X, Paperclip, RefreshCw, FileText } from "lucide-react";
import { api } from "../../../services/api";
import { Modal } from "../../common/Modal";
import type { AttachmentItem } from "../../../types/email";

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: AttachmentItem) => void;
  onToast?: (msg: string, type?: string) => void;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  onToast,
}: MediaPickerModalProps) {
  const [mediaList, setMediaList] = useState<AttachmentItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const loadMediaList = async () => {
    setLoadingMedia(true);
    try {
      const res = await api.getAttachments();
      setMediaList(res.data || []);
    } catch (e) {
      console.error("Failed to load attachments:", e);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMediaList();
    }
  }, [isOpen]);

  const handlePdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      if (onToast) onToast("Only PDF documents are allowed as attachments", "error");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      if (onToast) onToast("PDF file size must be under 10MB", "error");
      e.target.value = "";
      return;
    }

    setUploadingPdf(true);
    try {
      const res = await api.uploadAttachment(file);
      if (res.status === "success" && res.data) {
        if (onToast) onToast(`Uploaded & Attached ${file.name}`, "success");
        onSelect(res.data);
        onClose();
      } else {
        if (onToast) onToast(res.message || "Failed to upload document", "error");
      }
    } catch (err: any) {
      if (onToast) onToast(err.message || "Failed to upload PDF", "error");
    } finally {
      setUploadingPdf(false);
      e.target.value = "";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="680px"
      maxHeight="80vh"
      title="PDF Media Picker"
      subtitle="Select a previously uploaded PDF or upload a new one"
      icon={
        <FolderOpen
          style={{
            width: "18px",
            height: "18px",
            color: "var(--accent-cyan)",
          }}
        />
      }
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
      {/* Quick Upload inside Media Picker Modal */}
      <div
        style={{
          margin: "1rem 1.25rem 0.5rem",
          padding: "1rem",
          borderRadius: "10px",
          border: "1px dashed var(--border-subtle)",
          background: "var(--bg-secondary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <span
            style={{
              fontWeight: 600,
              fontSize: "0.85rem",
              color: "var(--text-primary)",
            }}
          >
            Upload New Document
          </span>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Supports .pdf pitch decks, one-pagers, brochures
          </div>
        </div>
        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            type="button"
            disabled={uploadingPdf}
            className="btn btn-primary btn-sm"
            style={{ pointerEvents: "none" }}
          >
            <Paperclip style={{ width: "13px", height: "13px" }} />
            <span>
              {uploadingPdf ? "Uploading..." : "Browse Local Files"}
            </span>
          </button>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handlePdfFileSelect}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
            }}
          />
        </div>
      </div>

      {/* List of existing PDFs */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Uploaded Documents ({mediaList.length})
          </span>
          <button
            type="button"
            onClick={loadMediaList}
            className="btn-icon-ghost"
            title="Refresh media list"
            style={{ padding: "4px" }}
          >
            <RefreshCw
              style={{
                width: "12px",
                height: "12px",
                animation: loadingMedia ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        </div>

        {loadingMedia ? (
          <div style={{ textAlign: "center", padding: "30px" }}>
            <RefreshCw
              style={{
                width: "18px",
                height: "18px",
                animation: "spin 1s linear infinite",
                margin: "0 auto",
                color: "var(--accent-cyan)",
              }}
            />
          </div>
        ) : mediaList.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            No uploaded PDFs found yet. Upload your first document above.
          </div>
        ) : (
          mediaList.map((item) => (
            <div
              key={item.filename}
              onClick={() => {
                onSelect(item);
                if (onToast) {
                  onToast(`Attached ${item.display_name || item.filename}`, "success");
                }
                onClose();
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-cyan)";
                e.currentTarget.style.background = "rgba(6, 182, 212, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background = "var(--bg-surface)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <FileText
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "var(--accent-cyan)",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.display_name || item.filename}
                  </div>
                  {item.size_kb !== undefined && (
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {item.size_kb} KB
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: "0.76rem" }}
              >
                Select
              </button>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

export default MediaPickerModal;
