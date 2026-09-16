import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleCheck, MessageSquare, PhoneCall, Play, RotateCcw, Sparkles, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Waveform from "../components/Waveform";

const DEMO_STEPS = [
  {
    label: "Start the call",
    title: "Riley opens with context",
    detail: "The agent knows why it is calling before the first hello.",
    agent: "Hi, this is Riley calling from Northstar Clinic to confirm your appointment for Thursday at 2 PM.",
    caller: "Hi Riley, yes, I have that appointment on my calendar.",
    icon: PhoneCall,
  },
  {
    label: "Ask for confirmation",
    title: "Riley listens for intent",
    detail: "Natural responses keep the conversation moving without a script-like pause.",
    agent: "Great. Does that time still work for you, or would another time be easier?",
    caller: "Thursday at 2 PM works perfectly for me.",
    icon: MessageSquare,
  },
  {
    label: "Confirm or rebook",
    title: "The outcome is captured",
    detail: "The call ends with a clear status and a next step for your team.",
    agent: "Perfect — you are all set for Thursday at 2 PM. We will see you then.",
    caller: "Thank you. See you Thursday!",
    icon: CircleCheck,
  },
];

const PATHWAYS = [
  { label: "Appointments", description: "Confirm, reschedule, and update every booking automatically." },
  { label: "Lead qualification", description: "Ask the right questions and route sales-ready prospects." },
  { label: "Follow-ups", description: "Reconnect at the right moment and capture the next step." },
];

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function Demo() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isComplete = activeStep === DEMO_STEPS.length - 1 && !isPlaying && elapsedSeconds > 0;
  const step = DEMO_STEPS[activeStep];
  const StepIcon = step.icon;

  useEffect(() => {
    if (!isPlaying) return undefined;

    const interval = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return undefined;

    const interval = window.setInterval(() => {
      setActiveStep((currentStep) => {
        if (currentStep >= DEMO_STEPS.length - 1) {
          setIsPlaying(false);
          return currentStep;
        }
        return currentStep + 1;
      });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isPlaying]);

  function startDemo() {
    if (isComplete) {
      setActiveStep(0);
      setElapsedSeconds(0);
    }
    setIsPlaying(true);
  }

  function showNextStep() {
    setElapsedSeconds((seconds) => Math.max(seconds, 1));
    setActiveStep((currentStep) => {
      if (currentStep >= DEMO_STEPS.length - 1) {
        setIsPlaying(false);
        return currentStep;
      }
      return currentStep + 1;
    });
  }

  function resetDemo() {
    setActiveStep(0);
    setElapsedSeconds(0);
    setIsPlaying(false);
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <Navbar />

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-14 sm:pt-20">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
            style={{
              background: "radial-gradient(60% 60% at 50% 0%, var(--color-accent-dim) 0%, transparent 70%)",
            }}
          />
          <div className="mx-auto max-w-6xl">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent)]">
              <ArrowLeft size={16} />
              Back to home
            </Link>

            <div className="mt-12 grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-dim)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-ink)]">
                  <Sparkles size={14} />
                  Interactive product tour
                </span>
                <h1 className="mt-5 max-w-xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--color-ink)] sm:text-6xl">
                  See an AI call come to life.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--color-ink-muted)] sm:text-lg">
                  Meet Riley, your AI Call Agent. Follow a sample appointment confirmation and see how every answer turns into a clear next step.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={isPlaying ? () => setIsPlaying(false) : startDemo}
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-pop)] transition-colors hover:bg-[var(--color-accent-hover)]"
                  >
                    <Play size={15} fill="currentColor" />
                    {isPlaying ? "Pause demo" : isComplete ? "Replay demo" : "Start demo"}
                  </button>
                  <button
                    type="button"
                    onClick={resetDemo}
                    className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-sunk)]"
                  >
                    <RotateCcw size={15} />
                    Reset
                  </button>
                </div>

                <div className="mt-9 grid max-w-md grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-5">
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">12</p>
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">languages</p>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">24/7</p>
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">availability</p>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">3.4×</p>
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">more conversations</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-6">
                <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] pb-5">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)]">
                      {(isPlaying || elapsedSeconds > 0) && <span className="absolute inset-0 animate-pulse-ring rounded-full" />}
                      <Waveform size="sm" color="white" active={isPlaying} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)]">Riley · AI Agent</p>
                      <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-signal-ink)]">
                        {isPlaying ? "Live call" : isComplete ? "Call complete" : "Ready to call"} · {formatTime(elapsedSeconds)}
                      </p>
                    </div>
                  </div>
                  <Waveform size="lg" active={isPlaying} color="var(--color-accent)" />
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-[var(--color-surface-sunk)] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-ink-soft)]">
                    <Timer size={15} className="text-[var(--color-accent)]" />
                    Appointment confirmation
                  </div>
                  <span className="rounded-full bg-[var(--color-signal-dim)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-signal-ink)]">
                    {isComplete ? "Resolved" : "In progress"}
                  </span>
                </div>

                <div className="mt-5 space-y-4" aria-live="polite">
                  <div className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-dim)] text-[var(--color-accent)]">
                      <Waveform size="sm" active={isPlaying} color="var(--color-accent)" />
                    </span>
                    <div className="rounded-2xl rounded-tl-md bg-[var(--color-accent-dim)] px-4 py-3">
                      <p className="text-xs font-semibold text-[var(--color-accent-ink)]">Riley</p>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">{step.agent}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <div className="max-w-[88%] rounded-2xl rounded-tr-md bg-[var(--color-surface-sunk)] px-4 py-3 text-right">
                      <p className="text-xs font-semibold text-[var(--color-ink-muted)]">Caller</p>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">{step.caller}</p>
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-signal-dim)] text-[var(--color-signal-ink)]">
                      <CheckCircle2 size={16} />
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-[var(--color-border)] p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-signal-dim)] text-[var(--color-signal-ink)]">
                      <StepIcon size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-signal-ink)]">
                        Step {activeStep + 1} of {DEMO_STEPS.length}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{step.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">{step.detail}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-1.5" aria-label="Demo progress">
                    {DEMO_STEPS.map((demoStep, index) => (
                      <span key={demoStep.label} className={`h-1.5 flex-1 rounded-full ${index <= activeStep ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}`} />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={showNextStep}
                    disabled={isComplete}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)] disabled:cursor-default disabled:text-[var(--color-ink-muted)]"
                  >
                    {isComplete ? "Conversation resolved" : "See the next moment"}
                    {!isComplete && <ArrowRight size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--color-border-soft)] bg-[var(--color-surface)] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-signal-dim)] px-3 py-1.5 text-xs font-semibold text-[var(--color-signal-ink)]">
                <CircleCheck size={14} />
                One agent, many pathways
              </span>
              <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                The same natural experience, built for your workflow.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-muted)]">
                Choose a starting point, define the outcome, and let your agent adapt to what the caller says next.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {PATHWAYS.map((pathway, index) => (
                <div key={pathway.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-5">
                  <span className="font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-accent)]">0{index + 1}</span>
                  <h3 className="mt-5 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">{pathway.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">{pathway.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center rounded-3xl bg-[var(--color-accent)] px-6 py-12 text-center shadow-[var(--shadow-pop)] sm:px-12">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
              <PhoneCall size={21} />
            </span>
            <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white">Ready to give your business a voice?</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75">Create your first pathway and let your AI agent handle the conversations that keep your team moving.</p>
            <Link to="/signup" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-[var(--color-accent-ink)] transition-colors hover:bg-[var(--color-accent-dim)]">
              Create your account
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
