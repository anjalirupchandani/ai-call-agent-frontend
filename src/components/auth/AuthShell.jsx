import { Link } from "react-router-dom";
import { PhoneCall, Megaphone, BarChart3 } from "lucide-react";
import Waveform from "../Waveform";
import AuthRobot from "./AuthRobot";

const FEATURES = [
  {
    icon: PhoneCall,
    title: "Smart Call Agents",
    description: "Natural, human-like conversations",
  },
  {
    icon: Megaphone,
    title: "Manage Campaigns",
    description: "Reach more, faster",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track performance & improve",
  },
];

export default function AuthShell({ activeTab, children }) {
  return (
    <div className="auth-dark relative min-h-screen overflow-hidden">
      <div className="auth-dark-grid" aria-hidden="true" />
      <div className="auth-dark-orb auth-dark-orb-a" aria-hidden="true" />
      <div className="auth-dark-orb auth-dark-orb-b" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-screen max-w-350 lg:grid-cols-2">
        {/* LEFT — hero */}
        <section className="relative hidden flex-col px-14 py-14 lg:flex xl:px-20">
          <div
            className="auth-dark-in-left relative z-10"
            style={{ animationDelay: "0ms" }}
          >
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#6C4DFF] to-[#3B82F6] shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                <Waveform size="sm" color="white" />
              </span>
              <span className="font-display text-[17px] font-semibold text-white">
                AI Call Agent
              </span>
            </Link>

            <h1 className="mt-14 font-display text-[44px] font-semibold leading-[1.08] tracking-[-0.02em] text-white xl:text-[52px]">
              Let AI do the
              <br />
              <span className="auth-dark-gradient-text">talking.</span>
            </h1>

            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#A7B0D6]">
              Automate outbound calls, connect with leads, and grow your
              business — all with AI.
            </p>

            <ul className="mt-10 flex flex-col gap-5">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-center gap-4">
                  <span className="auth-dark-feature-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                    <Icon size={18} className="text-[#C4B5FD]" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-white">
                      {title}
                    </span>
                    <span className="block text-[13px] text-[#8791BC]">
                      {description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="auth-dark-in-left pointer-events-none absolute right-2 top-[16%] w-57.5 xl:right-6 xl:w-72.5"
            style={{ animationDelay: "120ms" }}
          >
            <AuthRobot className="auth-dark-robot h-auto w-full" />
          </div>
        </section>

        {/* RIGHT — auth card */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div
            className="auth-dark-in-right w-full max-w-130"
            style={{ animationDelay: "80ms" }}
          >
            <div className="auth-dark-card relative rounded-[22px] p-7 sm:p-10">
              <div className="mb-8 flex rounded-xl bg-black/20 p-1">
                <Link
                  to="/login"
                  className={`auth-dark-tab flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                    activeTab === "login"
                      ? "auth-dark-tab-active"
                      : "text-[#8791BC] hover:text-white"
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={`auth-dark-tab flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                    activeTab === "signup"
                      ? "auth-dark-tab-active"
                      : "text-[#8791BC] hover:text-white"
                  }`}
                >
                  Sign Up
                </Link>
              </div>

              {children}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
