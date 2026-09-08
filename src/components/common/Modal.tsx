import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  contentStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  headerAction,
  children,
  footer,
  maxWidth = "680px",
  maxHeight = "85vh",
  contentStyle = {},
  bodyStyle = {},
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="glass-card modal-dialog"
        style={{
          width: `min(${maxWidth}, 95vw)`,
          maxWidth,
          maxHeight,
          display: "flex",
          flexDirection: "column",
          ...contentStyle,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {(title || icon || subtitle) && (
          <div className="modal-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {icon}
              <div>
                {typeof title === "string" ? (
                  <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{title}</h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {headerAction}
              <button
                type="button"
                onClick={onClose}
                className="btn-icon-ghost"
                title="Close"
              >
                <X style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            ...bodyStyle,
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            className="modal-footer"
            style={{
              borderTop: "1px solid var(--border-subtle)",
              padding: "10px 1.25rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
