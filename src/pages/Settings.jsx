// pages/Settings.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Bot,
  Mic,
  PhoneCall,
  Bell,
  Mail,
  Lock,
  Save,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Phone,
  MessageSquare,
  Shield,
  Globe,
  UserCog,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { changePassword } from "../services/api";
import DashboardShell from "../components/DashboardShell";
import { aiAgents } from "../data/mockData";

const SECTIONS = [
  { id: "profile", label: "User Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "agent", label: "AI Agent", icon: Bot },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "call", label: "Call Settings", icon: PhoneCall },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const inputClasses =
  "rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)] w-full";

const SETTINGS_STORAGE_PREFIX = "ai_call_agent_settings";

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex w-full cursor-pointer items-center justify-between py-3">
      <span className="text-sm text-[var(--color-ink-soft)]">{label}</span>
      <span className="relative ml-4 h-6 w-11 flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-label={label}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={`absolute inset-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-accent-dim)] ${
            checked ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </span>
      </span>
    </label>
  );
}

function SectionCard({ id, title, children }) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
    >
      <h2 className="mb-5 font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Profile state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    role: "",
    timezone: "UTC",
    language: "en",
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Agent & Settings state
  const [defaultAgent, setDefaultAgent] = useState(aiAgents[0]?.id || "");
  const [agentSettings, setAgentSettings] = useState({
    reschedule: true,
    voicemail: false,
  });
  const [voiceSettings, setVoiceSettings] = useState({
    voice: "female-us",
    speed: 1,
  });
  const [callSettings, setCallSettings] = useState({
    recordCalls: true,
    aiSummary: true,
    retryMissed: false,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    callFailed: true,
    dailySummary: false,
    pushCompletion: true,
  });
  const [settingsOwner, setSettingsOwner] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load user data
  useEffect(() => {
    if (!user) return;

    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      bio: user.bio || "",
      role: user.role || "User",
      timezone: user.timezone || "UTC",
      language: user.language || "en",
    });

    const storageKey = `${SETTINGS_STORAGE_PREFIX}:${user.id || user._id || user.email}`;
    const savedSettings = localStorage.getItem(storageKey);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.agentSettings) {
          setAgentSettings((current) => ({ ...current, ...parsedSettings.agentSettings }));
        }
        if (parsedSettings.voiceSettings) {
          setVoiceSettings((current) => ({ ...current, ...parsedSettings.voiceSettings }));
        }
        if (parsedSettings.callSettings) {
          setCallSettings((current) => ({ ...current, ...parsedSettings.callSettings }));
        }
        if (parsedSettings.notificationSettings) {
          setNotificationSettings((current) => ({
            ...current,
            ...parsedSettings.notificationSettings,
          }));
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    setSettingsOwner(storageKey);
  }, [user]);

  useEffect(() => {
    if (!settingsOwner) return;

    localStorage.setItem(
      settingsOwner,
      JSON.stringify({ agentSettings, voiceSettings, callSettings, notificationSettings }),
    );
  }, [settingsOwner, agentSettings, voiceSettings, callSettings, notificationSettings]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setIsDirty(true);
    setError(null);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSettingsChange = (section, key, value) => {
    if (section === "agent") {
      setAgentSettings((prev) => ({ ...prev, [key]: value }));
    } else if (section === "voice") {
      setVoiceSettings((prev) => ({ ...prev, [key]: value }));
    } else if (section === "call") {
      setCallSettings((prev) => ({ ...prev, [key]: value }));
    } else if (section === "notifications") {
      setNotificationSettings((prev) => ({ ...prev, [key]: value }));
    }
    setIsDirty(true);
  };

  const validateProfile = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Valid email is required");
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    if (!passwordData.currentPassword) {
      setError("Current password is required");
      return false;
    }
    if (passwordData.newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update profile
      if (!validateProfile()) {
        setLoading(false);
        return;
      }

      await updateUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        role: formData.role,
        timezone: formData.timezone,
        language: formData.language,
      });

      // If password is being changed
      if (passwordData.newPassword) {
        if (!validatePassword()) {
          setLoading(false);
          return;
        }
        await changePassword(
          passwordData.currentPassword,
          passwordData.newPassword,
        );
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }

      setSuccess("Settings saved successfully!");
      setIsDirty(false);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell
      title="Settings"
      subtitle="Manage your profile, security, and call preferences."
    >
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          {/* Sidebar Navigation */}
          <nav className="hidden flex-col gap-1 lg:flex">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunk)]"
              >
                <s.icon size={16} />
                {s.label}
              </a>
            ))}
          </nav>

          {/* Main Content */}
          <div className="flex flex-col gap-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-200">
                <CheckCircle size={18} className="flex-shrink-0" />
                <span className="flex-1">{success}</span>
                <button
                  type="button"
                  onClick={() => setSuccess(null)}
                  className="text-emerald-500 hover:text-emerald-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* User Profile Section */}
            <SectionCard id="profile" title="User Profile">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Full name *
                  </span>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
                      size={16}
                    />
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`${inputClasses} pl-10`}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Email *
                  </span>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
                      size={16}
                    />
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`${inputClasses} pl-10`}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Phone
                  </span>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
                      size={16}
                    />
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`${inputClasses} pl-10`}
                      placeholder="(555) 000-0000"
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Role
                  </span>
                  <div className="relative">
                    <UserCog
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
                      size={16}
                    />
                    <input
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className={`${inputClasses} pl-10`}
                      placeholder="User"
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Bio
                  </span>
                  <div className="relative">
                    <MessageSquare
                      className="absolute left-3 top-3 text-[var(--color-ink-muted)]"
                      size={16}
                    />
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={2}
                      className={`${inputClasses} pl-10 resize-none`}
                      placeholder="Tell us a little about yourself..."
                    />
                  </div>
                </label>
              </div>
            </SectionCard>

            {/* Security Section */}
            <SectionCard id="security" title="Security">
              <div className="space-y-4">
                <div className="rounded-lg bg-[var(--color-surface-sunk)] p-4">
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    Change your password to keep your account secure. Password
                    must be at least 8 characters.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
                      size={16}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className={`${inputClasses} pl-10 pr-12`}
                      placeholder="Enter current password"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
                      size={16}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className={`${inputClasses} pl-10 pr-12`}
                      placeholder="Enter new password (min 8 chars)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
                      size={16}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`${inputClasses} pl-10`}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* AI Agent Settings */}
            <SectionCard id="agent" title="AI Agent Settings">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Default agent
                </span>
                <select
                  value={defaultAgent}
                  onChange={(e) => {
                    setDefaultAgent(e.target.value);
                    setIsDirty(true);
                  }}
                  className={inputClasses}
                >
                  {aiAgents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.personality}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-4 divide-y divide-[var(--color-border-soft)]">
                <Toggle
                  label="Allow agent to reschedule calls automatically"
                  checked={agentSettings.reschedule}
                  onChange={(val) =>
                    handleSettingsChange("agent", "reschedule", val)
                  }
                />
                <Toggle
                  label="Let agent leave voicemail on no-answer"
                  checked={agentSettings.voicemail}
                  onChange={(val) =>
                    handleSettingsChange("agent", "voicemail", val)
                  }
                />
              </div>
            </SectionCard>

            {/* Voice Settings */}
            <SectionCard id="voice" title="Voice Settings">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Voice
                  </span>
                  <select
                    className={inputClasses}
                    value={voiceSettings.voice}
                    onChange={(e) =>
                      handleSettingsChange("voice", "voice", e.target.value)
                    }
                  >
                    <option value="female-us">Female · US English</option>
                    <option value="male-us">Male · US English</option>
                    <option value="female-uk">Female · UK English</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Speaking speed
                  </span>
                  <input
                    type="range"
                    min="0.75"
                    max="1.5"
                    step="0.05"
                    value={voiceSettings.speed}
                    onChange={(e) =>
                      handleSettingsChange(
                        "voice",
                        "speed",
                        parseFloat(e.target.value),
                      )
                    }
                    className="mt-3 accent-[var(--color-accent)] w-full"
                  />
                </label>
              </div>
            </SectionCard>

            {/* Call Settings */}
            <SectionCard id="call" title="Call Settings">
              <div className="divide-y divide-[var(--color-border-soft)]">
                <Toggle
                  label="Record calls automatically"
                  checked={callSettings.recordCalls}
                  onChange={(val) =>
                    handleSettingsChange("call", "recordCalls", val)
                  }
                />
                <Toggle
                  label="Generate AI summary after each call"
                  checked={callSettings.aiSummary}
                  onChange={(val) =>
                    handleSettingsChange("call", "aiSummary", val)
                  }
                />
                <Toggle
                  label="Retry once on missed calls"
                  checked={callSettings.retryMissed}
                  onChange={(val) =>
                    handleSettingsChange("call", "retryMissed", val)
                  }
                />
              </div>
            </SectionCard>

            {/* Notifications */}
            <SectionCard id="notifications" title="Notifications">
              <div className="divide-y divide-[var(--color-border-soft)]">
                <Toggle
                  label="Email me when a call fails"
                  checked={notificationSettings.callFailed}
                  onChange={(val) =>
                    handleSettingsChange("notifications", "callFailed", val)
                  }
                />
                <Toggle
                  label="Email me a daily summary"
                  checked={notificationSettings.dailySummary}
                  onChange={(val) =>
                    handleSettingsChange("notifications", "dailySummary", val)
                  }
                />
                <Toggle
                  label="Push notification on call completion"
                  checked={notificationSettings.pushCompletion}
                  onChange={(val) =>
                    handleSettingsChange("notifications", "pushCompletion", val)
                  }
                />
              </div>
            </SectionCard>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunk)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isDirty}
                className={`rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors flex items-center gap-2 ${
                  loading || !isDirty
                    ? "bg-[var(--color-border)] cursor-not-allowed opacity-50"
                    : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
                }`}
              >
                <Save size={18} />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </DashboardShell>
  );
}
