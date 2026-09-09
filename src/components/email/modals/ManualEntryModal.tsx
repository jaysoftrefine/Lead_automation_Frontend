import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Building2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import { Modal } from "../../common/Modal";
import { api } from "../../../services/api";

export interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (item: {
    type: "job" | "startup";
    name?: string;
    email?: string;
    company: string;
  }) => void;
  onToast: (msg: string, type?: string) => void;
}

export function ManualEntryModal({
  isOpen,
  onClose,
  onSuccess,
  onToast,
}: ManualEntryModalProps) {
  const [step, setStep] = useState<"choice" | "job" | "startup">("choice");

  // Job Lead Form State
  const [submittingJob, setSubmittingJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    company: "",
    title: "",
    job_url: "",
    company_domain: "",
    location: "Remote",
    company_size: "Small (1-50)",
    job_type: "Full-time",
    lead_type: "company",
    lead_summary: "",
    key_technologies: "",
    contact_name: "",
    contact_role: "Hiring Manager",
    contact_email: "",
    contact_linkedin: "",
  });

  // Startup Form State
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

  // Reset to choice step whenever opened
  useEffect(() => {
    if (isOpen) {
      setStep("choice");
    }
  }, [isOpen]);

  const handleCreateJobLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.company.trim() || !jobForm.title.trim()) {
      onToast("Company Name and Title are required", "error");
      return;
    }
    setSubmittingJob(true);
    try {
      const contacts: any[] = [];
      if (
        jobForm.contact_name.trim() ||
        jobForm.contact_email.trim() ||
        jobForm.contact_linkedin.trim()
      ) {
        contacts.push({
          name: jobForm.contact_name.trim(),
          role: jobForm.contact_role.trim() || "Decision Maker",
          email: jobForm.contact_email.trim(),
          linkedin_url: jobForm.contact_linkedin.trim(),
        });
      }

      await (api as any).createManualLead({
        company: jobForm.company.trim(),
        title: jobForm.title.trim(),
        job_url: jobForm.job_url.trim() || undefined,
        company_domain: jobForm.company_domain.trim(),
        location: jobForm.location.trim() || "Remote",
        company_size: jobForm.company_size,
        job_type: jobForm.job_type,
        lead_type: jobForm.lead_type,
        lead_summary: jobForm.lead_summary.trim(),
        key_technologies: jobForm.key_technologies
          ? jobForm.key_technologies
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
          : [],
        contacts,
      });

      onToast(`Lead for '${jobForm.company}' added to SQLite database!`, "success");

      if (onSuccess) {
        onSuccess({
          type: "job",
          company: jobForm.company.trim(),
          name: jobForm.contact_name.trim(),
          email: jobForm.contact_email.trim(),
        });
      }

      onClose();
      // Reset form
      setJobForm({
        company: "",
        title: "",
        job_url: "",
        company_domain: "",
        location: "Remote",
        company_size: "Small (1-50)",
        job_type: "Full-time",
        lead_type: "company",
        lead_summary: "",
        key_technologies: "",
        contact_name: "",
        contact_role: "Hiring Manager",
        contact_email: "",
        contact_linkedin: "",
      });
    } catch (err: any) {
      onToast(err.message || "Failed to create manual lead", "error");
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleCreateStartup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupForm.company_name.trim()) {
      onToast("Company Name is required", "error");
      return;
    }
    setSubmittingStartup(true);
    try {
      const people: any[] = [];
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
        founded_year: startupForm.founded_year
          ? parseInt(startupForm.founded_year)
          : null,
        description: startupForm.description.trim(),
        tags: startupForm.tags.trim(),
        people,
      });

      onToast(
        `Startup '${startupForm.company_name}' successfully added to database!`,
        "success"
      );

      if (onSuccess) {
        onSuccess({
          type: "startup",
          company: startupForm.company_name.trim(),
          name: startupForm.person_name.trim(),
          email: startupForm.person_email.trim(),
        });
      }

      onClose();
      // Reset form
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
    } catch (err: any) {
      onToast(err.message || "Failed to create manual startup", "error");
    } finally {
      setSubmittingStartup(false);
    }
  };

  // 1. STEP: Choice
  if (step === "choice") {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="660px"
        title="Select Manual Entry Destination"
        subtitle="Which database would you like to add this manual record to?"
        icon={
          <Sparkles
            style={{ width: "18px", height: "18px", color: "var(--accent-cyan)" }}
          />
        }
        footer={
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>
        }
      >
        <div style={{ padding: "0.5rem 1.25rem 1.25rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginTop: "0.25rem",
            }}
          >
            {/* Choice 1: Job Lead */}
            <div
              onClick={() => setStep("job")}
              style={{
                padding: "1.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                background: "var(--chip-bg)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "0.85rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-cyan)";
                e.currentTarget.style.boxShadow = "var(--shadow-card)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      background: "rgba(6, 182, 212, 0.12)",
                      color: "var(--accent-cyan)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Briefcase style={{ width: "20px", height: "20px" }} />
                  </div>
                </div>

                <h3
                  style={{
                    margin: "0 0 6px 0",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Job / Opportunity Lead
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.82rem",
                    lineHeight: "1.45",
                    color: "var(--text-secondary)",
                  }}
                >
                  Add a company job posting with hiring manager, decision maker, and tech stack details.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "0.7rem",
                  borderTop: "1px solid var(--border-subtle)",
                  color: "var(--accent-cyan)",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                }}
              >
                <span>Add Job Lead</span>
                <ArrowRight style={{ width: "14px", height: "14px" }} />
              </div>
            </div>

            {/* Choice 2: European Startup */}
            <div
              onClick={() => setStep("startup")}
              style={{
                padding: "1.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                background: "var(--chip-bg)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "0.85rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-emerald)";
                e.currentTarget.style.boxShadow = "var(--shadow-card)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "var(--accent-emerald)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Building2 style={{ width: "20px", height: "20px" }} />
                  </div>
                </div>

                <h3
                  style={{
                    margin: "0 0 6px 0",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  European Startup
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.82rem",
                    lineHeight: "1.45",
                    color: "var(--text-secondary)",
                  }}
                >
                  Add a high-growth European tech startup profile with founder, CEO, and executive email contacts.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "0.7rem",
                  borderTop: "1px solid var(--border-subtle)",
                  color: "var(--accent-emerald)",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                }}
              >
                <span>Add Startup</span>
                <ArrowRight style={{ width: "14px", height: "14px" }} />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // 2. STEP: Job Lead Form
  if (step === "job") {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="680px"
        title="Add New Lead to SQLite"
        subtitle="Enter details for the new job lead and hiring manager"
        icon={
          <UserPlus
            style={{ width: "18px", height: "18px", color: "var(--accent-cyan)" }}
          />
        }
        headerAction={
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setStep("choice")}
            style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.74rem" }}
          >
            <ArrowLeft style={{ width: "12px", height: "12px" }} />
            <span>Back</span>
          </button>
        }
      >
        <form
          onSubmit={handleCreateJobLead}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            padding: "0.5rem 1.25rem 1.25rem",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                required
                className="eu-input"
                placeholder="e.g. Acme Corp"
                value={jobForm.company}
                onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Job / Opportunity Title *</label>
              <input
                type="text"
                required
                className="eu-input"
                placeholder="e.g. Senior Backend Engineer"
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Company Website / Domain</label>
              <input
                type="text"
                className="eu-input"
                placeholder="e.g. acme.com"
                value={jobForm.company_domain}
                onChange={(e) =>
                  setJobForm({ ...jobForm, company_domain: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>LinkedIn / Job URL</label>
              <input
                type="url"
                className="eu-input"
                placeholder="https://www.linkedin.com/jobs/view/..."
                value={jobForm.job_url}
                onChange={(e) => setJobForm({ ...jobForm, job_url: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              className="eu-input"
              placeholder="e.g. Remote, San Francisco, CA"
              value={jobForm.location}
              onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
            />
          </div>

          {/* Lead Type Classification */}
          <div className="form-group">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontWeight: 600 }}>Lead Type *</span>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                Target Classification
              </span>
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "0.6rem",
              }}
            >
              {[
                {
                  key: "company",
                  icon: "🏢",
                  label: "Company",
                  desc: "Finding a company / agency",
                },
                {
                  key: "personal",
                  icon: "👤",
                  label: "Personal",
                  desc: "Finding person / freelancer",
                },
                {
                  key: "others",
                  icon: "❓",
                  label: "Others",
                  desc: "Unspecified / General",
                },
              ].map((t) => (
                <div
                  key={t.key}
                  onClick={() => setJobForm({ ...jobForm, lead_type: t.key })}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    border:
                      jobForm.lead_type === t.key
                        ? "2px solid var(--accent-cyan)"
                        : "1px solid var(--border-subtle)",
                    background:
                      jobForm.lead_type === t.key
                        ? "rgba(6, 182, 212, 0.12)"
                        : "var(--chip-bg)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "1rem" }}>{t.icon}</span>
                    <span
                      style={{
                        fontWeight: jobForm.lead_type === t.key ? 700 : 600,
                        fontSize: "0.86rem",
                        color:
                          jobForm.lead_type === t.key
                            ? "var(--accent-cyan)"
                            : "var(--text-primary)",
                      }}
                    >
                      {t.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.3,
                    }}
                  >
                    {t.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Company Size</label>
              <select
                className="eu-input"
                value={jobForm.company_size}
                onChange={(e) =>
                  setJobForm({ ...jobForm, company_size: e.target.value })
                }
              >
                <option value="1-10 Employees">1-10 Employees</option>
                <option value="11-50 Employees">11-50 Employees</option>
                <option value="51-200 Employees">51-200 Employees</option>
                <option value="201-500 Employees">201-500 Employees</option>
                <option value="500+ Employees">500+ Employees</option>
              </select>
            </div>
            <div className="form-group">
              <label>Employment Type</label>
              <select
                className="eu-input"
                value={jobForm.job_type}
                onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })}
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract / Freelance">Contract / Freelance</option>
                <option value="Part-time">Part-time</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Key Technologies (comma-separated)</label>
            <input
              type="text"
              className="eu-input"
              placeholder="e.g. Python, FastAPI, React, PostgreSQL"
              value={jobForm.key_technologies}
              onChange={(e) =>
                setJobForm({ ...jobForm, key_technologies: e.target.value })
              }
            />
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: "0.8rem",
            }}
          >
            <h4
              style={{
                fontSize: "0.88rem",
                marginBottom: "0.6rem",
                color: "var(--accent-cyan)",
              }}
            >
              Primary Contact / Decision Maker
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.8rem",
              }}
            >
              <div className="form-group">
                <label>Contact Full Name</label>
                <input
                  type="text"
                  className="eu-input"
                  placeholder="e.g. Alex Mercer"
                  value={jobForm.contact_name}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, contact_name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Role / Position</label>
                <input
                  type="text"
                  className="eu-input"
                  placeholder="e.g. VP of Engineering / CTO"
                  value={jobForm.contact_role}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, contact_role: e.target.value })
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.8rem",
                marginTop: "0.6rem",
              }}
            >
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="eu-input"
                  placeholder="e.g. alex@acme.com"
                  value={jobForm.contact_email}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, contact_email: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>LinkedIn Profile URL</label>
                <input
                  type="text"
                  className="eu-input"
                  placeholder="https://linkedin.com/in/..."
                  value={jobForm.contact_linkedin}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, contact_linkedin: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Opportunity / Lead Summary</label>
            <textarea
              className="eu-textarea"
              rows={3}
              placeholder="Notes, project requirements, or outreach strategy..."
              value={jobForm.lead_summary}
              onChange={(e) =>
                setJobForm({ ...jobForm, lead_summary: e.target.value })
              }
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "0.5rem",
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: "0.75rem",
            }}
          >
            <button
              type="button"
              disabled={submittingJob}
              onClick={() => setStep("choice")}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingJob}
              className="btn btn-primary btn-sm"
              style={{
                background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
              }}
            >
              {submittingJob ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  // 3. STEP: European Startup Form
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="680px"
      title="Add European Startup to Database"
      subtitle="Enter details for the new European startup and founder"
      icon={
        <Building2
          style={{ width: "18px", height: "18px", color: "var(--accent-emerald)" }}
        />
      }
      headerAction={
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setStep("choice")}
          style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.74rem" }}
        >
          <ArrowLeft style={{ width: "12px", height: "12px" }} />
          <span>Back</span>
        </button>
      }
    >
      <form
        onSubmit={handleCreateStartup}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "0.5rem 1.25rem 1.25rem",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              required
              className="eu-input"
              placeholder="e.g. Mistral AI"
              value={startupForm.company_name}
              onChange={(e) =>
                setStartupForm({
                  ...startupForm,
                  company_name: e.target.value,
                })
              }
            />
          </div>
          <div className="form-group">
            <label>Website URL</label>
            <input
              type="text"
              className="eu-input"
              placeholder="https://example.com"
              value={startupForm.website}
              onChange={(e) =>
                setStartupForm({ ...startupForm, website: e.target.value })
              }
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.8rem",
          }}
        >
          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              className="eu-input"
              placeholder="e.g. Germany"
              value={startupForm.country}
              onChange={(e) =>
                setStartupForm({ ...startupForm, country: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              className="eu-input"
              placeholder="e.g. Berlin"
              value={startupForm.city}
              onChange={(e) =>
                setStartupForm({ ...startupForm, city: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Founded Year</label>
            <input
              type="number"
              className="eu-input"
              placeholder="2023"
              value={startupForm.founded_year}
              onChange={(e) =>
                setStartupForm({
                  ...startupForm,
                  founded_year: e.target.value,
                })
              }
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
              onChange={(e) =>
                setStartupForm({ ...startupForm, category: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              className="eu-input"
              placeholder="e.g. saas, llm, b2b"
              value={startupForm.tags}
              onChange={(e) =>
                setStartupForm({ ...startupForm, tags: e.target.value })
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label>Company Description</label>
          <textarea
            className="eu-textarea"
            rows={2}
            placeholder="Brief summary of the startup's product and mission..."
            value={startupForm.description}
            onChange={(e) =>
              setStartupForm({ ...startupForm, description: e.target.value })
            }
          />
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "0.8rem",
          }}
        >
          <h4
            style={{
              fontSize: "0.88rem",
              marginBottom: "0.6rem",
              color: "var(--accent-emerald)",
            }}
          >
            Key Executive / Founder Info
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.8rem",
            }}
          >
            <div className="form-group">
              <label>Founder Name</label>
              <input
                type="text"
                className="eu-input"
                placeholder="e.g. Arthur Mensch"
                value={startupForm.person_name}
                onChange={(e) =>
                  setStartupForm({
                    ...startupForm,
                    person_name: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                className="eu-input"
                placeholder="e.g. CEO & Co-Founder"
                value={startupForm.person_role}
                onChange={(e) =>
                  setStartupForm({
                    ...startupForm,
                    person_role: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.8rem",
              marginTop: "0.6rem",
            }}
          >
            <div className="form-group">
              <label>Verified Email</label>
              <input
                type="email"
                className="eu-input"
                placeholder="e.g. arthur@company.eu"
                value={startupForm.person_email}
                onChange={(e) =>
                  setStartupForm({
                    ...startupForm,
                    person_email: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label>LinkedIn Profile URL</label>
              <input
                type="text"
                className="eu-input"
                placeholder="https://linkedin.com/in/..."
                value={startupForm.person_linkedin}
                onChange={(e) =>
                  setStartupForm({
                    ...startupForm,
                    person_linkedin: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "0.5rem",
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "0.75rem",
          }}
        >
          <button
            type="button"
            disabled={submittingStartup}
            onClick={() => setStep("choice")}
            className="btn btn-secondary btn-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submittingStartup}
            className="btn btn-primary btn-sm"
            style={{
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
            }}
          >
            {submittingStartup ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
