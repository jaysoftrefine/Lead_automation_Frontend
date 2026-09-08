import React, { useState, useEffect } from "react";
import { Users, X, Search, CheckSquare } from "lucide-react";
import { api } from "../../../services/api";
import { Modal } from "../../common/Modal";

export interface RecipientContact {
  id: string;
  email: string;
  name: string;
  company: string;
  role?: string;
  website?: string;
  city?: string;
  country?: string;
  category?: string;
  source: "eu" | "linkedin" | string;
}

export interface RecipientPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  target?: "campaign" | "audience";
  initiallySelected?: RecipientContact[];
  onApply: (selected: RecipientContact[]) => void;
  onToast?: (msg: string, type?: string) => void;
}

export function RecipientPickerModal({
  isOpen,
  onClose,
  target = "campaign",
  initiallySelected = [],
  onApply,
  onToast,
}: RecipientPickerModalProps) {
  const [recipients, setRecipients] = useState<RecipientContact[]>([]);
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadRecipients = async () => {
      setLoading(true);
      try {
        const [euResponse, leadResponse] = await Promise.all([
          api.getEUStartups({ page: 1, per_page: 500, has_email: "true" }),
          api.getLeads(),
        ]);

        const euRecipients: RecipientContact[] = (euResponse.data || []).flatMap(
          (startup: any) =>
            (startup.people || [])
              .filter((person: any) => person.email)
              .map((person: any, index: number) => ({
                id: `eu-${startup.id}-${person.email}-${index}`,
                email: person.email.trim(),
                name: person.name || "Founder / Leadership",
                company: startup.company_name || "Unnamed startup",
                role: person.role || "Leadership",
                website: startup.website || "",
                city: startup.city || "",
                country: startup.country || "",
                category: startup.category || "",
                source: "eu",
              }))
        );

        const leadRecipients: RecipientContact[] = (
          leadResponse.leads ||
          leadResponse.data ||
          []
        ).flatMap((lead: any, leadIndex: number) =>
          (lead.contacts || [])
            .filter((contact: any) => contact.email)
            .map((contact: any, index: number) => ({
              id: `linkedin-${lead._id || leadIndex}-${contact.email}-${index}`,
              email: contact.email.trim(),
              name: contact.name || "Contact",
              company: lead.company || "Unnamed company",
              role: contact.role || "Professional",
              website: lead.company_domain ? `https://${lead.company_domain}` : "",
              city: "",
              country: lead.location || "",
              category: "",
              source: "linkedin",
            }))
        );

        const uniqueRecipients = Array.from(
          new Map(
            [...euRecipients, ...leadRecipients].map((r) => [
              r.email.toLowerCase(),
              r,
            ])
          ).values()
        );

        setRecipients(uniqueRecipients);

        const initialMap: Record<string, boolean> = {};
        initiallySelected.forEach((c) => {
          const found = uniqueRecipients.find(
            (r) => r.email.toLowerCase() === (c.email || "").toLowerCase()
          );
          if (found) initialMap[found.id] = true;
        });
        setSelection(initialMap);
      } catch (e: any) {
        if (onToast) onToast(e.message || "Could not load recipient contacts", "error");
      } finally {
        setLoading(false);
      }
    };

    loadRecipients();
  }, [isOpen]);

  const filteredRecipients = recipients.filter((recipient) => {
    const matchesSource =
      sourceFilter === "all" || recipient.source === sourceFilter;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      [
        recipient.name,
        recipient.company,
        recipient.email,
        recipient.country,
        recipient.role,
      ].some((value) => (value || "").toLowerCase().includes(term));
    return matchesSource && matchesSearch;
  });

  const handleApply = () => {
    const selected = recipients.filter((r) => selection[r.id]);
    onApply(selected);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="920px"
      maxHeight="85vh"
      title={
        target === "audience"
          ? "Partially Select Audience Companies"
          : "Partially Select Campaign Recipients"
      }
      subtitle={
        target === "audience"
          ? "Handpick specific companies and contacts from EU Startups and LinkedIn Leads to add directly into this audience."
          : "Choose exactly which contacts from EU Startups and LinkedIn Leads should receive this campaign."
      }
      icon={
        <Users
          style={{
            width: "18px",
            height: "18px",
            color: "var(--accent-cyan)",
          }}
        />
      }
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "var(--accent-cyan)",
              }}
            >
              {Object.values(selection).filter(Boolean).length} contacts selected
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              (out of {recipients.length} available)
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleApply}
            >
              <CheckSquare style={{ width: "13px", height: "13px" }} />
              <span>
                Apply Selection ({Object.values(selection).filter(Boolean).length})
              </span>
            </button>
          </div>
        </div>
      }
    >
      <div style={{ padding: "0 1.25rem" }}>
        {/* Filter Controls & Quick Selection Bar */}
        <div
          style={{
            display: "flex",
            gap: "0.7rem",
            flexWrap: "wrap",
            alignItems: "center",
            margin: "1rem 0 0.6rem",
          }}
        >
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <Search
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "14px",
                color: "var(--text-dim)",
              }}
            />
            <input
              className="eu-input"
              style={{ paddingLeft: "32px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, email, country or role..."
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{ width: "auto" }}
          >
            <option value="all">All Sources ({recipients.length})</option>
            <option value="eu">
              EU Startups ({recipients.filter((r) => r.source === "eu").length})
            </option>
            <option value="linkedin">
              LinkedIn Leads (
              {recipients.filter((r) => r.source === "linkedin").length})
            </option>
          </select>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}
              onClick={() => {
                const next = { ...selection };
                filteredRecipients.forEach((r) => {
                  next[r.id] = true;
                });
                setSelection(next);
              }}
            >
              Select Visible ({filteredRecipients.length})
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}
              onClick={() => {
                const next = { ...selection };
                filteredRecipients.slice(0, 10).forEach((r) => {
                  next[r.id] = true;
                });
                setSelection(next);
              }}
            >
              +10
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}
              onClick={() => {
                const next = { ...selection };
                filteredRecipients.slice(0, 25).forEach((r) => {
                  next[r.id] = true;
                });
                setSelection(next);
              }}
            >
              +25
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}
              onClick={() => {
                const next = { ...selection };
                filteredRecipients.slice(0, 50).forEach((r) => {
                  next[r.id] = true;
                });
                setSelection(next);
              }}
            >
              +50
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: "0.72rem",
                padding: "0.25rem 0.6rem",
                color: "var(--accent-rose)",
              }}
              onClick={() => setSelection({})}
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Table of contacts */}
        <div
          className="eu-table-wrapper"
          style={{ overflow: "auto", minHeight: "280px", maxHeight: "48vh" }}
        >
          <table className="eu-startups-table">
            <thead>
              <tr>
                <th style={{ width: "44px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={
                      filteredRecipients.length > 0 &&
                      filteredRecipients.every((r) => !!selection[r.id])
                    }
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const next = { ...selection };
                      filteredRecipients.forEach((r) => {
                        next[r.id] = checked;
                      });
                      setSelection(next);
                    }}
                  />
                </th>
                <th>Contact &amp; Role</th>
                <th>Company</th>
                <th>Location / Country</th>
                <th>Email Address</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: "48px" }}
                  >
                    <div className="spinner" style={{ margin: "auto" }} />
                    <div
                      style={{
                        marginTop: "10px",
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Loading contacts from EU Startups and LinkedIn DB...
                    </div>
                  </td>
                </tr>
              ) : filteredRecipients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "48px",
                      color: "var(--text-muted)",
                    }}
                  >
                    No email contacts found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredRecipients.map((recipient) => {
                  const isSelected = !!selection[recipient.id];
                  return (
                    <tr
                      key={recipient.id}
                      style={{
                        background: isSelected
                          ? "rgba(99, 102, 241, 0.08)"
                          : undefined,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setSelection((prev) => ({
                          ...prev,
                          [recipient.id]: !prev[recipient.id],
                        }))
                      }
                    >
                      <td
                        style={{ textAlign: "center" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            setSelection((prev) => ({
                              ...prev,
                              [recipient.id]: !prev[recipient.id],
                            }))
                          }
                        />
                      </td>
                      <td>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {recipient.name}
                        </div>
                        {recipient.role && (
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--text-dim)",
                            }}
                          >
                            {recipient.role}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {recipient.company}
                        </div>
                        {recipient.category && (
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {recipient.category}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {recipient.country || recipient.city || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            color: "var(--accent-cyan)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.78rem",
                          }}
                        >
                          {recipient.email}
                        </span>
                      </td>
                      <td>
                        <span
                          className="platform-badge"
                          style={{
                            fontSize: "0.68rem",
                            background:
                              recipient.source === "eu"
                                ? "rgba(139, 92, 246, 0.15)"
                                : "rgba(59, 130, 246, 0.15)",
                            borderColor:
                              recipient.source === "eu"
                                ? "rgba(139, 92, 246, 0.35)"
                                : "rgba(59, 130, 246, 0.35)",
                            color:
                              recipient.source === "eu"
                                ? "#c084fc"
                                : "#60a5fa",
                          }}
                        >
                          {recipient.source === "eu"
                            ? "EU Startups"
                            : "LinkedIn"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

export default RecipientPickerModal;
