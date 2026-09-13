import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Building2,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Filter,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  PlusCircle,
  FileText,
  Mail,
  Copy,
  ChevronRight,
  TrendingUp,
  Upload,
  Paperclip,
  Check,
  RefreshCw,
  Sliders,
  Globe,
  Loader2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { api } from "../services/api";
import { Modal } from "../components/common/Modal";
import { SmtpConfigModal } from "../components/email/modals/SmtpConfigModal";

export interface PersonalWorkspaceProps {
  onToast: (msg: string, type?: string) => void;
  onOpenSmtp?: () => void;
}

export interface OpportunityItem {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-time" | "Freelance" | "Contract" | "Part-time" | string;
  workplace: "Remote" | "Hybrid" | "On-site" | string;
  payRange: string;
  tags: string[];
  description: string;
  postedDate: string;
  sourceUrl?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  recruiterLinkedIn?: string;
  status?: "saved" | "applied" | "interviewing" | "offer";
}

const getCompanyGradient = (name: string) => {
  const gradients = [
    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

const getCompanyInitials = (name: string) => {
  if (!name) return "CO";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const INITIAL_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: "opp-in-1",
    title: "Backend Engineer – Python, FastAPI & PostgreSQL",
    company: "Implere Technologies Pvt Ltd",
    location: "Hyderabad, Telangana, India (Remote)",
    type: "Full-time",
    workplace: "Remote",
    payRange: "₹14,00,000 - ₹22,00,000 / yr",
    tags: ["Python", "FastAPI", "PostgreSQL", "Docker", "AsyncIO"],
    description:
      "Looking for a Backend Engineer proficient in Python, FastAPI, and PostgreSQL to design high-throughput microservices, background job schedulers, and clean REST APIs.",
    postedDate: "Recent",
    sourceUrl: "https://www.linkedin.com/jobs",
    recruiterName: "Pooja Sharma",
    recruiterEmail: "pooja.s@implere.com",
    status: "saved",
  },
  {
    id: "opp-in-2",
    title: "AI & Backend Engineer (LangChain & RAG)",
    company: "Nexora Labs India",
    location: "Bengaluru, Karnataka (Hybrid / Remote)",
    type: "Full-time",
    workplace: "Remote",
    payRange: "₹18,00,000 - ₹28,00,000 / yr",
    tags: ["Python", "LangChain", "ChromaDB", "FastAPI", "Gemini AI"],
    description:
      "Architect and scale multi-modal RAG systems, contextual Q&A engines, and real-time LLM agents for enterprise client intelligence workflows.",
    postedDate: "1 day ago",
    sourceUrl: "https://www.linkedin.com/jobs",
    recruiterName: "Arun Verma",
    recruiterEmail: "arun@nexoralabs.in",
    status: "saved",
  },
  {
    id: "opp-in-3",
    title: "Python Backend Developer (Remote)",
    company: "Hire Feed India",
    location: "India (100% Remote)",
    type: "Full-time",
    workplace: "Remote",
    payRange: "₹12,00,000 - ₹18,00,000 / yr",
    tags: ["Python", "AsyncIO", "Web Scraping", "FastAPI", "PostgreSQL"],
    description:
      "Build resilient data aggregation pipelines, automated scraping architectures, and high-performance backend microservices.",
    postedDate: "Just now",
    sourceUrl: "https://www.linkedin.com/jobs",
    recruiterName: "Rohan Nair",
    recruiterEmail: "rohan@hirefeed.io",
    status: "saved",
  },
  {
    id: "opp-1",
    title: "Senior Full Stack Python / React Engineer",
    company: "DataPulse Systems",
    location: "Remote (Global)",
    type: "Full-time",
    workplace: "Remote",
    payRange: "$120,000 - $155,000 / yr",
    tags: ["Python", "FastAPI", "React", "TypeScript", "TailwindCSS"],
    description:
      "Building high-scale data workflows, autonomous web intelligence bots, and clean microservice APIs. Looking for strong background in async Python and React dashboards.",
    postedDate: "1 day ago",
    sourceUrl: "https://news.ycombinator.com/jobs",
    recruiterName: "Sarah Jenkins",
    recruiterEmail: "sarah.j@datapulse.io",
    recruiterLinkedIn: "https://linkedin.com",
    status: "saved",
  },
  {
    id: "opp-2",
    title: "Freelance Automation & Web Scraping Specialist",
    company: "GrowthStack Agency",
    location: "Remote (Global)",
    type: "Freelance",
    workplace: "Remote",
    payRange: "$55 - $80 / hr (20 hrs/week)",
    tags: ["Playwright", "Python", "FastAPI", "Lead Gen", "API Integration"],
    description:
      "Need an experienced freelance developer to build robust crawlers, anti-detection scraping pipelines, and automated lead ingestion into HubSpot & PostgreSQL.",
    postedDate: "Just now",
    sourceUrl: "https://upwork.com",
    recruiterName: "Marcus Vance",
    recruiterEmail: "marcus@growthstack.co",
    status: "applied",
  },
  {
    id: "opp-3",
    title: "Full Stack Developer (FastAPI & Vite)",
    company: "Nexora Health AI",
    location: "Austin, TX (Remote OK)",
    type: "Contract",
    workplace: "Remote",
    payRange: "$6,000 - $8,500 / month (6 mo contract)",
    tags: ["FastAPI", "React", "PostgreSQL", "Docker", "LLM APIs"],
    description:
      "Contract role to revamp our client-facing clinical reporting portal. Integrate generative AI summaries and interactive analytics charts.",
    postedDate: "2 days ago",
    sourceUrl: "https://remoteok.com",
    recruiterName: "Elena Rostova",
    recruiterEmail: "elena@nexora.ai",
    status: "interviewing",
  },
  {
    id: "opp-4",
    title: "Backend Python Engineer (LLM Workflows)",
    company: "Synthetix Labs",
    location: "Berlin, Germany (Remote EU/Global)",
    type: "Full-time",
    workplace: "Remote",
    payRange: "€75,000 - €95,000 / yr",
    tags: ["Python", "LangChain", "AsyncIO", "FastAPI", "SQLite/PG"],
    description:
      "Design background tasks, agentic reasoning loops, and prompt pipelines for our automated financial auditing software.",
    postedDate: "3 days ago",
    sourceUrl: "https://weworkremotely.com",
    recruiterName: "David Schmidt",
    recruiterEmail: "d.schmidt@synthetix.de",
    status: "saved",
  },
  {
    id: "opp-5",
    title: "Custom CRM & Lead Dashboard (Freelance Project)",
    company: "VentureCraft Studio",
    location: "Remote",
    type: "Freelance",
    workplace: "Remote",
    payRange: "$3,500 Fixed Project (3 weeks)",
    tags: ["React", "FastAPI", "Vite", "Tailwind/CSS", "Email Outreach"],
    description:
      "Turn Figma mockups into a responsive dashboard with live WebSocket progress bars, email campaign templating, and CSV contact export.",
    postedDate: "4 hours ago",
    sourceUrl: "https://wellfound.com",
    recruiterName: "Alexandre Dupuis",
    recruiterEmail: "alex@venturecraft.studio",
    status: "saved",
  },
  {
    id: "opp-6",
    title: "Frontend React / TypeScript Engineer",
    company: "CloudFlow Matrix",
    location: "London, UK (Remote)",
    type: "Full-time",
    workplace: "Remote",
    payRange: "£65,000 - £85,000 / yr",
    tags: ["React 18", "TypeScript", "State Management", "REST/WS"],
    description:
      "Drive frontend architecture for multi-tenant SaaS dashboards. Pixel-perfect implementation of complex tables, modal workflows, and responsive layouts.",
    postedDate: "1 day ago",
    sourceUrl: "https://linkedin.com/jobs",
    recruiterName: "Claire Henderson",
    recruiterEmail: "claire@cloudflowmatrix.com",
    status: "saved",
  },
];

export function PersonalWorkspace({ onToast, onOpenSmtp }: PersonalWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"all" | "jobs" | "freelance" | "recruiters" | "tracker">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showSmtpModal, setShowSmtpModal] = useState(false);

  const handleOpenSmtp = () => {
    if (onOpenSmtp) {
      onOpenSmtp();
    } else {
      setShowSmtpModal(true);
    }
  };

  // Profile & Auto-Pilot State
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    target_role: string;
    target_location: string;
    experience_years: string;
    workplace_preference: string;
    company_size_preference: string;
    resume_name: string | null;
    resume_path: string | null;
    resume_text: string | null;
    resume_exists: boolean;
  }>({
    name: "Jay Kakadia",
    email: "Jaykakadia3@gmail.com",
    target_role: "Python Backend Engineer",
    target_location: "India",
    experience_years: "4+ years",
    workplace_preference: "all",
    company_size_preference: "all",
    resume_name: null,
    resume_path: null,
    resume_text: null,
    resume_exists: false,
  });

  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stored opportunities
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(() => {
    try {
      const saved = localStorage.getItem("jay_saved_opportunities");
      return saved ? JSON.parse(saved) : INITIAL_OPPORTUNITIES;
    } catch {
      return INITIAL_OPPORTUNITIES;
    }
  });

  // Auto-Apply Modal State
  const [applyOpp, setApplyOpp] = useState<OpportunityItem | null>(null);
  const [applyRecipientEmail, setApplyRecipientEmail] = useState("");
  const [applySubject, setApplySubject] = useState("");
  const [applyBody, setApplyBody] = useState("");
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isSendingApplication, setIsSendingApplication] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("jay_saved_opportunities", JSON.stringify(opportunities));
  }, [opportunities]);

  // Load profile from backend on mount
  useEffect(() => {
    api
      .getPersonalProfile()
      .then((res) => {
        if (res?.data) {
          setProfile(res.data);
        }
      })
      .catch((err) => {
        console.warn("Could not load personal profile:", err);
      });
  }, []);

  // Update application status
  const updateStatus = (id: string, newStatus: "saved" | "applied" | "interviewing" | "offer") => {
    setOpportunities((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    onToast(`Status updated to "${newStatus}"!`, "success");
  };

  // Toggle save
  const toggleSave = (id: string) => {
    setOpportunities((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status ? undefined : "saved";
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
    onToast("Opportunity list updated", "info");
  };

  // Resume Upload Handler
  const handleResumeFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingResume(true);
    try {
      const res = await api.uploadPersonalResume(file);
      if (res?.data) {
        setProfile((prev) => ({
          ...prev,
          resume_name: res.data.resume_name,
          resume_path: res.data.resume_path,
          resume_exists: true,
          resume_text: res.data.text_preview || prev.resume_text,
        }));
        onToast(`Resume "${res.data.resume_name}" uploaded & parsed by AI!`, "success");
      }
    } catch (err: any) {
      onToast(err.message || "Failed to upload resume", "error");
    } finally {
      setIsUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await api.updatePersonalProfile(profile);
      onToast("Personal career preferences saved!", "success");
    } catch (err: any) {
      onToast(err.message || "Failed to save profile", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Search Live Jobs using JobSpyScraper
  const handleSearchLiveJobs = async () => {
    setIsSearchingJobs(true);
    onToast(`Searching live job boards for "${profile.target_role}"...`, "info");
    try {
      const res = await api.searchPersonalJobs({
        role: profile.target_role || "Python Backend Engineer",
        location: profile.target_location || "India",
        results_wanted: 15,
        is_remote: profile.workplace_preference === "Remote" || profile.workplace_preference === "all",
      });

      if (res?.data && res.data.length > 0) {
        setOpportunities((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newUnique = res.data.filter((d) => !existingIds.has(d.id));
          return [...newUnique, ...prev];
        });
        onToast(`Found ${res.data.length} live opportunities!`, "success");
      } else {
        onToast("No new live postings found right now. Existing opportunities kept.", "info");
      }
    } catch (err: any) {
      onToast("Job scraper note: " + (err.message || "Could not retrieve live postings"), "info");
    } finally {
      setIsSearchingJobs(false);
    }
  };

  // Open Auto-Apply Modal & Trigger Gemini AI Email Draft
  const handleOpenAutoApply = async (opp: OpportunityItem) => {
    setApplyOpp(opp);
    setApplyRecipientEmail(opp.recruiterEmail || "");
    setIsGeneratingEmail(true);
    setApplySubject(`Application: ${opp.title} - ${profile.name || "Jay"}`);
    setApplyBody("Crafting your personalized application pitch using Gemini AI...");

    try {
      const res = await api.generatePersonalEmail({
        job_title: opp.title,
        company_name: opp.company,
        job_location: opp.location,
        job_description: opp.description,
        recruiter_name: opp.recruiterName,
        recruiter_email: opp.recruiterEmail,
      });

      if (res?.data) {
        setApplySubject(res.data.subject);
        setApplyBody(res.data.body);
      }
    } catch (err: any) {
      console.warn("AI generation note:", err);
      setApplyBody(
        `Hi ${opp.recruiterName ? opp.recruiterName.split(" ")[0] : "Hiring Team"},\n\nI am writing to express my strong interest in the ${opp.title} position at ${opp.company}. With my background in ${profile.target_role} and ${profile.experience_years} of hands-on software development, I am confident in my ability to make an immediate impact.\n\nI have attached my resume for your review and would love to connect for a brief discussion.\n\nBest regards,\n${profile.name || "Jay"}`
      );
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  // Send Application with Resume via SMTP
  const handleSendApplication = async () => {
    if (!applyOpp) return;
    if (!applyRecipientEmail.trim()) {
      onToast("Please provide a recipient email address.", "error");
      return;
    }

    setIsSendingApplication(true);
    try {
      await api.sendPersonalApplication({
        to_email: applyRecipientEmail.trim(),
        recipient_name: applyOpp.recruiterName || applyOpp.company,
        company_name: applyOpp.company,
        job_title: applyOpp.title,
        subject: applySubject,
        body: applyBody,
        opportunity_id: applyOpp.id,
        resume_path: profile.resume_path || undefined,
        resume_name: profile.resume_name || undefined,
      });

      // Update status in tracker
      updateStatus(applyOpp.id, "applied");
      onToast(`Application sent to ${applyRecipientEmail} with resume attached!`, "success");
      setApplyOpp(null);
    } catch (err: any) {
      const msg = err.message || "Failed to send email via SMTP";
      onToast(msg, "error");
      if (msg.toLowerCase().includes("smtp is not configured")) {
        handleOpenSmtp();
      }
    } finally {
      setIsSendingApplication(false);
    }
  };

  // Filtered list
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      // Tab filter
      if (activeTab === "jobs" && item.type !== "Full-time") return false;
      if (activeTab === "freelance" && item.type !== "Freelance" && item.type !== "Contract") return false;
      if (activeTab === "recruiters" && !item.recruiterEmail && !item.recruiterName) return false;

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          item.title.toLowerCase().includes(q) ||
          item.company.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)) ||
          (item.recruiterName && item.recruiterName.toLowerCase().includes(q));
        if (!matchesText) return false;
      }

      // Workplace filter
      if (selectedWorkplace !== "all" && item.workplace !== selectedWorkplace) return false;

      // Type filter
      if (selectedType !== "all" && item.type !== selectedType) return false;

      return true;
    });
  }, [opportunities, activeTab, searchQuery, selectedWorkplace, selectedType]);

  // Stats
  const totalJobsCount = opportunities.filter((o) => o.type === "Full-time").length;
  const totalFreelanceCount = opportunities.filter((o) => o.type === "Freelance" || o.type === "Contract").length;
  const appliedCount = opportunities.filter((o) => o.status === "applied" || o.status === "interviewing" || o.status === "offer").length;

  // Copy email pitch helper
  const copyPitchText = (opp: OpportunityItem) => {
    const isFreelance = opp.type === "Freelance" || opp.type === "Contract";
    const text = isFreelance
      ? `Hi ${opp.recruiterName ? opp.recruiterName.split(" ")[0] : "there"},\n\nI saw your posting for the ${opp.title} project at ${opp.company}. I'm a ${profile.target_role} with hands-on experience building autonomous web scrapers, real-time FastAPI backends, and responsive dashboards.\n\nI can start immediately and deliver this within your timeline. You can check out my portfolio and live projects here.\n\nBest regards,\n${profile.name || "Jay"}`
      : `Hi ${opp.recruiterName ? opp.recruiterName.split(" ")[0] : "Hiring Team"},\n\nI'm writing to express my strong interest in the ${opp.title} role at ${opp.company}. My core stack is ${profile.target_role} with over ${profile.experience_years} of experience.\n\nI would love the opportunity to discuss how my hands-on experience can support ${opp.company}'s engineering goals.\n\nLooking forward to speaking with you!\n\nBest regards,\n${profile.name || "Jay"}`;

    navigator.clipboard.writeText(text);
    onToast("Pitch copied to clipboard!", "success");
  };

  return (
    <div className="personal-workspace-container">
      {/* Hidden file input for Resume */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleResumeFileSelected}
        accept=".pdf,.txt"
        style={{ display: "none" }}
      />

      {/* Hero / Candidate Intelligence Bar */}
      <div className="glass-card personal-hero-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.25rem" }}>
          <div>
            <div className="personal-hero-badge">
              <Sparkles style={{ width: "13px", height: "13px" }} />
              <span>Personal Auto-Pilot &amp; Career Hub</span>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.025em" }}>
              Find Your Next Tech Job &amp; Auto-Apply with AI
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px", maxWidth: "680px" }}>
              Upload your resume once: AI writes personalized application pitches matching each role and automatically sends them with your resume PDF attached.
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div className="personal-metric-pill">
              <span className="personal-metric-label">Tech Jobs</span>
              <span className="personal-metric-val" style={{ color: "var(--accent-cyan)" }}>
                {totalJobsCount} Available
              </span>
            </div>
            <div className="personal-metric-pill">
              <span className="personal-metric-label">Freelance / Gigs</span>
              <span className="personal-metric-val" style={{ color: "var(--accent-emerald)" }}>
                {totalFreelanceCount} Available
              </span>
            </div>
            <div className="personal-metric-pill">
              <span className="personal-metric-label">Applications</span>
              <span className="personal-metric-val" style={{ color: "#f59e0b" }}>
                {appliedCount} Applied
              </span>
            </div>
          </div>
        </div>

        {/* Candidate Auto-Pilot Control & Resume Vault */}
        <div className="candidate-deck">
          {/* Left: Resume Box */}
          <div className="resume-vault-box">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
              {profile.resume_exists ? (
                <FileCheck style={{ width: "24px", height: "24px", color: "var(--accent-emerald)", flexShrink: 0 }} />
              ) : (
                <Upload style={{ width: "24px", height: "24px", color: "var(--accent-cyan)", flexShrink: 0 }} />
              )}
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "0.84rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {profile.resume_name ? profile.resume_name : "Candidate Resume"}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {profile.resume_exists ? "Verified for AI auto-generation" : "Attach PDF to activate auto-apply"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingResume}
              className="action-btn-sm"
              style={{
                flexShrink: 0,
                fontSize: "0.75rem",
                padding: "0.35rem 0.7rem",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                borderRadius: "var(--radius-full)",
              }}
            >
              {isUploadingResume ? (
                <Loader2 style={{ width: "13px", height: "13px", animation: "spin 1s linear infinite" }} />
              ) : (
                <Upload style={{ width: "13px", height: "13px" }} />
              )}
              <span>{profile.resume_exists ? "Replace PDF" : "Upload PDF"}</span>
            </button>
          </div>

          {/* Center: Target Role, Location & Experience */}
          <div className="candidate-field-group">
            <div className="candidate-field">
              <label>Target Role</label>
              <input
                type="text"
                value={profile.target_role}
                onChange={(e) => setProfile({ ...profile, target_role: e.target.value })}
                placeholder="e.g. Python Backend Engineer"
              />
            </div>

            <div className="candidate-field">
              <label>Location</label>
              <input
                type="text"
                value={profile.target_location}
                onChange={(e) => setProfile({ ...profile, target_location: e.target.value })}
                placeholder="e.g. Remote / India / US"
              />
            </div>

            <div className="candidate-field" style={{ maxWidth: "120px" }}>
              <label>Experience</label>
              <input
                type="text"
                value={profile.experience_years}
                onChange={(e) => setProfile({ ...profile, experience_years: e.target.value })}
                placeholder="e.g. 3+ yrs"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="candidate-actions">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="candidate-save-btn"
              title="Save career preferences"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 style={{ width: "13px", height: "13px", animation: "spin 1s linear infinite" }} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check style={{ width: "13px", height: "13px" }} />
                  <span>Save Preferences</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSearchLiveJobs}
              disabled={isSearchingJobs}
              className="candidate-search-btn"
              title="Search live job boards"
            >
              {isSearchingJobs ? (
                <>
                  <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Globe style={{ width: "14px", height: "14px" }} />
                  <span>Live Job Search</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenSmtp}
              className="candidate-smtp-btn"
              title="Configure personal email accounts (Gmail, Outlook, custom SMTP) for sending job applications"
            >
              <Mail style={{ width: "14px", height: "14px", color: "var(--accent-cyan)" }} />
              <span>Email (SMTP) Setup</span>
            </button>
          </div>
        </div>

        {/* Command Filter Dock */}
        <div className="personal-filter-dock">
          <div className="personal-search-input-wrap">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search roles, skills (e.g. Python, FastAPI, React, Remote)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="personal-search-input"
            />
          </div>

          {/* Workplace Filter */}
          <select
            value={selectedWorkplace}
            onChange={(e) => setSelectedWorkplace(e.target.value)}
            className="personal-select personal-filter-select"
            aria-label="Filter by Workplace"
          >
            <option value="all">🌐 Any Workplace (Remote &amp; On-site)</option>
            <option value="Remote">🏠 100% Remote</option>
            <option value="Hybrid">🏢 Hybrid</option>
            <option value="On-site">📍 On-site</option>
          </select>

          {/* Contract Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="personal-select personal-filter-select"
            aria-label="Filter by Contract Type"
          >
            <option value="all">💼 All Types (Job &amp; Gigs)</option>
            <option value="Full-time">👔 Full-Time Job</option>
            <option value="Freelance">⚡ Freelance Gig</option>
            <option value="Contract">📄 Contract / Project</option>
          </select>

          {/* Quick preset chips */}
          <div className="personal-preset-chips">
            {["Python", "React", "FastAPI"].map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => setSearchQuery(searchQuery === skill ? "" : skill)}
                className={`skill-chip ${searchQuery === skill ? "active" : ""}`}
              >
                #{skill}
              </button>
            ))}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="skill-chip"
                style={{ opacity: 0.8 }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="personal-subnav">
        <button
          onClick={() => setActiveTab("all")}
          className={`personal-subnav-btn ${activeTab === "all" ? "active" : ""}`}
        >
          <TrendingUp style={{ width: "14px", height: "14px" }} />
          <span>All Opportunities</span>
          <span className="subnav-badge">{opportunities.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("jobs")}
          className={`personal-subnav-btn ${activeTab === "jobs" ? "active" : ""}`}
        >
          <Briefcase style={{ width: "14px", height: "14px" }} />
          <span>Job Hunter</span>
          <span className="subnav-badge">{totalJobsCount}</span>
        </button>

        <button
          onClick={() => setActiveTab("freelance")}
          className={`personal-subnav-btn ${activeTab === "freelance" ? "active" : ""}`}
        >
          <Sparkles style={{ width: "14px", height: "14px" }} />
          <span>Freelance &amp; Contracts</span>
          <span className="subnav-badge">{totalFreelanceCount}</span>
        </button>

        <button
          onClick={() => setActiveTab("recruiters")}
          className={`personal-subnav-btn ${activeTab === "recruiters" ? "active" : ""}`}
        >
          <UserCheck style={{ width: "14px", height: "14px" }} />
          <span>Hiring Contacts &amp; HR</span>
        </button>

        <button
          onClick={() => setActiveTab("tracker")}
          className={`personal-subnav-btn ${activeTab === "tracker" ? "active" : ""}`}
        >
          <CheckCircle2 style={{ width: "14px", height: "14px" }} />
          <span>Application Tracker</span>
          <span className="subnav-badge">{appliedCount}</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "tracker" ? (
        /* Tracker Board View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          {(["saved", "applied", "interviewing", "offer"] as const).map((col) => {
            const colItems = opportunities.filter((item) => (item.status || "saved") === col);
            const colTitles: Record<string, { label: string; color: string }> = {
              saved: { label: "📌 Saved Targets", color: "var(--accent-cyan)" },
              applied: { label: "🚀 Pitch / Applied", color: "#3b82f6" },
              interviewing: { label: "💬 Interview Stage", color: "#f59e0b" },
              offer: { label: "🎉 Offer / Signed", color: "var(--accent-emerald)" },
            };

            return (
              <div key={col} className="tracker-column">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: colTitles[col].color }}>
                    {colTitles[col].label}
                  </span>
                  <span className="tab-badge" style={{ fontSize: "0.7rem", padding: "0.15rem 0.45rem" }}>
                    {colItems.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "0.5rem" }}>
                  {colItems.map((item) => (
                    <div
                      key={item.id}
                      className="glass-card"
                      style={{ padding: "0.85rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <h4 style={{ fontSize: "0.86rem", fontWeight: 700, margin: 0 }}>{item.title}</h4>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "4px",
                            background: item.type === "Freelance" ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
                            color: item.type === "Freelance" ? "var(--accent-emerald)" : "#818cf8",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.type}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        {item.company} • {item.location}
                      </p>
                      <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontWeight: 600, marginTop: "4px" }}>
                        {item.payRange}
                      </div>

                      {/* Move to next stage button */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
                        <button
                          onClick={() => handleOpenAutoApply(item)}
                          className="action-btn-sm"
                          style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", display: "flex", alignItems: "center", gap: "3px" }}
                          title="Auto-Apply / Preview AI Pitch"
                        >
                          <Send style={{ width: "11px", height: "11px", color: "var(--accent-cyan)" }} />
                          <span>Apply</span>
                        </button>

                        <select
                          value={item.status || "saved"}
                          onChange={(e) => updateStatus(item.id, e.target.value as any)}
                          style={{
                            fontSize: "0.7rem",
                            padding: "0.2rem 0.4rem",
                            borderRadius: "4px",
                            background: "var(--chip-bg)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-primary)",
                            cursor: "pointer",
                          }}
                        >
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="interviewing">Interviewing</option>
                          <option value="offer">Offer</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  {colItems.length === 0 && (
                    <div style={{ textAlign: "center", padding: "1.5rem 0.5rem", color: "var(--text-dim)", fontSize: "0.78rem" }}>
                      No opportunities here yet.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Opportunity Cards Grid */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.15rem" }}>
          {filteredOpportunities.map((opp) => {
            const isFreelance = opp.type === "Freelance" || opp.type === "Contract";

            return (
              <div key={opp.id} className="glass-card opportunity-card">
                <div>
                  {/* Top row: Company avatar monogram, badges, & bookmark */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <div
                        className="company-avatar-pill"
                        style={{ background: getCompanyGradient(opp.company) }}
                        title={opp.company}
                      >
                        {getCompanyInitials(opp.company)}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                          <span
                            className="platform-badge"
                            style={{
                              background: isFreelance ? "rgba(16, 185, 129, 0.14)" : "rgba(6, 182, 212, 0.14)",
                              color: isFreelance ? "var(--accent-emerald)" : "var(--accent-cyan)",
                              borderColor: isFreelance ? "rgba(16, 185, 129, 0.35)" : "rgba(6, 182, 212, 0.35)",
                              fontWeight: 700,
                            }}
                          >
                            {opp.type}
                          </span>
                          <span className="platform-badge" style={{ fontSize: "0.68rem" }}>
                            {opp.workplace}
                          </span>
                          {opp.status === "applied" && (
                            <span
                              className="platform-badge"
                              style={{ fontSize: "0.65rem", background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}
                            >
                              ✓ Applied
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSave(opp.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: opp.status ? "var(--accent-cyan)" : "var(--text-muted)",
                        cursor: "pointer",
                        padding: "6px",
                        borderRadius: "var(--radius-sm)",
                        transition: "all 0.18s ease",
                      }}
                      title={opp.status ? "Saved in Tracker" : "Save to Tracker"}
                    >
                      {opp.status ? (
                        <BookmarkCheck style={{ width: "19px", height: "19px" }} />
                      ) : (
                        <Bookmark style={{ width: "19px", height: "19px" }} />
                      )}
                    </button>
                  </div>

                  {/* Title & Company */}
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 5px 0", letterSpacing: "-0.015em", lineHeight: "1.35" }}>
                    {opp.title}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <Building2 style={{ width: "13px", height: "13px", color: "var(--accent-cyan)" }} />
                    <span style={{ fontWeight: 600 }}>{opp.company}</span>
                    <span style={{ opacity: 0.5 }}>•</span>
                    <MapPin style={{ width: "13px", height: "13px", color: "var(--text-muted)" }} />
                    <span>{opp.location}</span>
                  </div>

                  {/* Pay / Rate Badge */}
                  <div className="opportunity-pay-badge">
                    <DollarSign style={{ width: "14px", height: "14px" }} />
                    <span>{opp.payRange}</span>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-muted)",
                      lineHeight: "1.5",
                      marginBottom: "0.85rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {opp.description}
                  </p>

                  {/* Tags */}
                  <div className="opportunity-tags">
                    {opp.tags.map((tag) => (
                      <span key={tag} className="opportunity-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recruiter & Action footer */}
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.85rem", marginTop: "0.5rem" }}>
                  {opp.recruiterName && (
                    <div className="recruiter-contact-bar">
                      <span style={{ color: "var(--text-secondary)" }}>
                        Contact: <strong>{opp.recruiterName}</strong>
                      </span>
                      {opp.recruiterEmail && (
                        <a
                          href={`mailto:${opp.recruiterEmail}`}
                          style={{ color: "var(--accent-cyan)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                        >
                          <Mail style={{ width: "12px", height: "12px" }} />
                          <span>{opp.recruiterEmail}</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="opp-card-actions">
                    {/* Primary Auto-Apply Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenAutoApply(opp)}
                      className="opp-apply-btn"
                      title="AI will craft pitch and send email with resume"
                    >
                      <Sparkles style={{ width: "14px", height: "14px" }} />
                      <span>Auto-Apply (AI + Resume)</span>
                    </button>

                    {/* Copy Pitch Draft secondary */}
                    <button
                      type="button"
                      onClick={() => copyPitchText(opp)}
                      className="opp-pitch-btn"
                      title="Copy outreach email draft"
                    >
                      <Copy style={{ width: "13px", height: "13px" }} />
                      <span>Pitch</span>
                    </button>

                    {opp.sourceUrl && (
                      <a
                        href={opp.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="opp-link-btn"
                        title="Open posting in new tab"
                      >
                        <ExternalLink style={{ width: "14px", height: "14px" }} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredOpportunities.length === 0 && (
            <div
              className="glass-card"
              style={{
                gridColumn: "1 / -1",
                padding: "3rem 1.5rem",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <Briefcase style={{ width: "36px", height: "36px", margin: "0 auto 0.75rem", opacity: 0.5 }} />
              <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>No matching opportunities found</h4>
              <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                Try adjusting your search terms or search live postings above.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedWorkplace("all");
                  setSelectedType("all");
                }}
                className="primary-btn"
                style={{ marginTop: "1rem", fontSize: "0.8rem", padding: "0.4rem 0.9rem" }}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Auto-Apply Modal with AI Pitch & Resume Attachment */}
      {applyOpp && (
        <Modal
          isOpen={true}
          onClose={() => setApplyOpp(null)}
          maxWidth="680px"
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles style={{ width: "18px", height: "18px", color: "var(--accent-cyan)" }} />
              <span>AI Auto-Apply: {applyOpp.title}</span>
            </div>
          }
          subtitle={
            <span>
              Applying to <strong>{applyOpp.company}</strong> • {applyOpp.location}
            </span>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Recruiter Email Input */}
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Recipient / Recruiter Email <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="email"
                  value={applyRecipientEmail}
                  onChange={(e) => setApplyRecipientEmail(e.target.value)}
                  placeholder="e.g. hr@company.com or recruiter@company.com"
                  style={{
                    flex: 1,
                    fontSize: "0.82rem",
                    padding: "0.5rem 0.75rem",
                    background: "var(--chip-bg)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            {/* Resume Attachment Banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.65rem 0.85rem",
                background: profile.resume_exists ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                border: profile.resume_exists ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.78rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Paperclip style={{ width: "14px", height: "14px", color: profile.resume_exists ? "var(--accent-emerald)" : "#f59e0b" }} />
                <span>
                  {profile.resume_exists ? (
                    <>
                      Attachment: <strong>{profile.resume_name}</strong> (Included automatically)
                    </>
                  ) : (
                    <span style={{ color: "#f59e0b" }}>No resume uploaded yet. You can attach one before sending.</span>
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="action-btn-sm"
                style={{ fontSize: "0.72rem", padding: "0.2rem 0.55rem" }}
              >
                {profile.resume_exists ? "Change PDF" : "Upload PDF"}
              </button>
            </div>

            {/* Email Subject Field */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600 }}>Email Subject</label>
                {isGeneratingEmail && (
                  <span style={{ fontSize: "0.72rem", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Loader2 style={{ width: "11px", height: "11px", animation: "spin 1s linear infinite" }} />
                    AI Generating...
                  </span>
                )}
              </div>
              <input
                type="text"
                value={applySubject}
                onChange={(e) => setApplySubject(e.target.value)}
                disabled={isGeneratingEmail}
                style={{
                  width: "100%",
                  fontSize: "0.82rem",
                  padding: "0.5rem 0.75rem",
                  background: "var(--chip-bg)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Email Body Field */}
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                AI-Crafted Application Pitch
              </label>
              <textarea
                value={applyBody}
                onChange={(e) => setApplyBody(e.target.value)}
                disabled={isGeneratingEmail}
                rows={9}
                style={{
                  width: "100%",
                  fontSize: "0.82rem",
                  padding: "0.65rem 0.75rem",
                  background: "var(--chip-bg)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontFamily: "inherit",
                  lineHeight: "1.5",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleOpenSmtp}
                className="action-btn-sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.76rem",
                  color: "var(--accent-cyan)",
                  borderColor: "rgba(6, 182, 212, 0.4)",
                  background: "rgba(6, 182, 212, 0.08)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.48rem 0.85rem",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                title="Configure or change SMTP email account settings"
              >
                <Mail style={{ width: "13px", height: "13px" }} />
                <span>Configure SMTP</span>
              </button>

              <div style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setApplyOpp(null)}
                  disabled={isSendingApplication}
                  className="action-btn-sm"
                  style={{ padding: "0.5rem 1rem" }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSendApplication}
                  disabled={isSendingApplication || isGeneratingEmail || !applyRecipientEmail.trim()}
                  className="primary-btn"
                  style={{
                    padding: "0.5rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "linear-gradient(135deg, #06b6d4 0%, #10b981 100%)",
                  }}
                >
                  {isSendingApplication ? (
                    <>
                      <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                      <span>Dispatching Application...</span>
                    </>
                  ) : (
                    <>
                      <Send style={{ width: "14px", height: "14px" }} />
                      <span>Send Application with Resume</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Smtp Configuration Modal for Personal Workspace */}
      <SmtpConfigModal
        isOpen={showSmtpModal}
        onClose={() => setShowSmtpModal(false)}
        onToast={onToast}
      />
    </div>
  );
}

export default PersonalWorkspace;
