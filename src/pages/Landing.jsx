import { Link } from "react-router-dom";
import { useState } from "react";
import { PhoneCall, Sparkles, Timer, ArrowRight, Play, MessageSquare, CircleCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import Waveform from "../components/Waveform";

const FEATURES = [
  {
    icon: PhoneCall,
    title: "AI Voice Calls",
    body: "Place and receive natural-sounding phone calls handled entirely by your AI agent — no human on the line required.",
  },
  {
    icon: Sparkles,
    title: "Smart Conversations",
    body: "Every call adapts in real time, understanding context, answering questions, and following the script you set.",
  },
  {
    icon: Timer,
    title: "Save Time & Cost",
    body: "Run hundreds of calls in parallel and free your team from repetitive outreach, follow-ups, and screening.",
  },
];

const PATHWAYS = [
  {
    id: "appointments",
    label: "Appointments",
    title: "Confirm every appointment",
    description: "Your pathway tells the agent what to say, what answer to listen for, and what to do next.",
    steps: [
      { icon: PhoneCall, title: "Start with your instructions", detail: "The agent introduces the call and asks whether the appointment time still works." },
      { icon: MessageSquare, title: "If they confirm", detail: "Follow the If branch to confirm the appointment." },
      { icon: CircleCheck, title: "Otherwise, rebook", detail: "If they need a different time, follow Otherwise and offer to reschedule." },
    ],
    metric: "92%",
    metricLabel: "confirmed in one call",
  },
  {
    id: "leads",
    label: "Lead qualification",
    title: "Prioritize your best leads",
    description: "Qualify interest, capture intent, and route sales-ready prospects to the people who can help.",
    steps: [
      { icon: PhoneCall, title: "Make first contact", detail: "Riley introduces your business with context from the campaign." },
      { icon: MessageSquare, title: "Understand the need", detail: "The agent asks the questions that matter to your sales team." },
      { icon: CircleCheck, title: "Route the opportunity", detail: "Qualified leads are handed to the right owner with the call summary." },
    ],
    metric: "3.4×",
    metricLabel: "more qualified conversations",
  },
  {
    id: "follow-ups",
    label: "Follow-ups",
    title: "Keep every conversation moving",
    description: "Give each prospect a helpful next step without asking your team to chase every callback.",
    steps: [
      { icon: PhoneCall, title: "Reconnect at the right time", detail: "Riley follows up based on your campaign schedule." },
      { icon: MessageSquare, title: "Answer open questions", detail: "The agent responds naturally using the context you provide." },
      { icon: CircleCheck, title: "Capture the next step", detail: "Every outcome is recorded so your team knows what happens next." },
    ],
    metric: "48 hrs",
    metricLabel: "saved per team each month",
  },
];

export default function Landing() {
  const [activePathwayId, setActivePathwayId] = useState(PATHWAYS[0].id);
  const [pathwayZoom, setPathwayZoom] = useState(1);
  const activePathway = PATHWAYS.find((pathway) => pathway.id === activePathwayId) ?? PATHWAYS[0];

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, var(--color-accent-dim) 0%, transparent 70%)",
          }}
        />
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-ink-soft)]">
            <Waveform size="sm" active color="var(--color-accent)" />
            Now calling in 12 languages
          </span>

          <h1 className="font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.05] tracking-tight text-[var(--color-ink)] sm:text-6xl">
            AI Call Agent
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-ink-muted)]">
            Give your business a voice that never sleeps. Your AI agent makes calls,
            answers them, and handles real conversations — so your team can focus on
            what happens after the call connects.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-pop)] transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/demo"
              className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-sunk)]"
            >
              <Play size={15} />
              Watch Demo
            </Link>
          </div>
        </div>

        {/* AI voice assistant visual */}
        <div className="mx-auto mt-16 max-w-lg">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)]">
                  <span className="absolute inset-0 rounded-full animate-pulse-ring" />
                  <Waveform size="sm" color="white" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">Riley · AI Agent</p>
                  <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-signal-ink)]">
                    Live · 00:47
                  </p>
                </div>
              </div>
              <Waveform size="lg" active color="var(--color-accent)" />
            </div>

            <div className="mt-5 space-y-2.5 rounded-2xl bg-[var(--color-surface-sunk)] p-4 text-left">
              <p className="text-sm text-[var(--color-ink-soft)]">
                "Hi, this is Riley calling to confirm your appointment for Thursday at 2 PM — does that still work for you?"
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[var(--color-border-soft)] bg-[var(--color-surface)] px-6 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-dim)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-ink)]">
              <Sparkles size={14} />
              Dynamic pathways
            </span>
            <h2 className="mt-5 max-w-lg font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-5xl">
              Give your agent a clear guide for every call.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-ink-muted)]">
              Write what the agent should say or ask, then show it what to do for different answers. On a call, the agent follows those instructions while responding naturally.
            </p>

            <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Pathway examples">
              {PATHWAYS.map((pathway) => {
                const isActive = pathway.id === activePathway.id;
                return (
                  <button
                    key={pathway.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActivePathwayId(pathway.id)}
                    className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[var(--color-accent)] text-white shadow-[var(--shadow-pop)]"
                        : "bg-[var(--color-surface-sunk)] text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-dim)] hover:text-[var(--color-accent-ink)]"
                    }`}
                  >
                    {pathway.label}
                  </button>
                );
              })}
            </div>

            <Link
              to="/dashboard/pathways"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
            >
              Create a pathway
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-4 shadow-[var(--shadow-card)] sm:p-6">
            <div className="mb-4 flex justify-end gap-2" aria-label="Pathway preview zoom">
              <button
                type="button"
                aria-label="Zoom out pathway preview"
                disabled={pathwayZoom <= 0.8}
                onClick={() => setPathwayZoom((zoom) => Math.max(0.8, Number((zoom - 0.1).toFixed(1))))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-lg font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-sunk)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>
              <button
                type="button"
                aria-label="Zoom in pathway preview"
                disabled={pathwayZoom >= 1.4}
                onClick={() => setPathwayZoom((zoom) => Math.min(1.4, Number((zoom + 0.1).toFixed(1))))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-lg font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-sunk)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>
            <div key={activePathway.id} className="animate-fade-up" style={{ zoom: pathwayZoom }}>
              <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-soft)] pb-5">
                <div>
                  <p className="font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                    How the agent follows it
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
                    {activePathway.title}
                  </h3>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-signal-dim)] text-[var(--color-signal-ink)]">
                  <Waveform size="sm" active color="var(--color-signal)" />
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-muted)]">{activePathway.description}</p>

              <div className="mt-6 space-y-3">
                {activePathway.steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-dim)] text-[var(--color-accent)]">
                          <Icon size={17} />
                        </span>
                        {index < activePathway.steps.length - 1 && (
                          <span className="my-1 h-4 w-px bg-[var(--color-border)]" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 pt-1">
                        <p className="text-sm font-semibold text-[var(--color-ink)]">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">{step.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-[var(--color-signal-dim)] px-4 py-3.5">
                <span className="text-sm font-medium text-[var(--color-signal-ink)]">Expected outcome</span>
                <span className="text-right">
                  <strong className="block text-lg font-semibold leading-none text-[var(--color-signal-ink)]">{activePathway.metric}</strong>
                  <small className="mt-1 block text-[11px] text-[var(--color-signal-ink)]">{activePathway.metricLabel}</small>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="product" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-accent-dim)] text-[var(--color-accent)]">
                <f.icon size={20} />
              </span>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer id="site-footer" className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
              AI Call Agent
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--color-ink-muted)]">
              Give your business a voice that never sleeps.
            </p>
          </div>

          <nav aria-label="Explore" className="flex flex-col items-start gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Explore</h2>
            <a href="#how-it-works" className="text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent)]">How it works</a>
            <a href="#product" className="text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent)]">Product</a>
            <Link to="/demo" className="text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent)]">Watch demo</Link>
          </nav>

          <nav aria-label="Platform" className="flex flex-col items-start gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Platform</h2>
            <Link to="/dashboard" className="text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent)]">Dashboard</Link>
            <Link to="/dashboard/pathways" className="text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent)]">Pathways</Link>
          </nav>

          <nav aria-label="Account" className="flex flex-col items-start gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Account</h2>
            <Link to="/login" className="text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent)]">Sign in</Link>
            <Link to="/signup" className="text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent)]">Create account</Link>
          </nav>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-[var(--color-border-soft)] pt-5 text-xs text-[var(--color-ink-muted)]">
          © {new Date().getFullYear()} AI Call Agent
        </div>
      </footer>
    </div>
  );
}
