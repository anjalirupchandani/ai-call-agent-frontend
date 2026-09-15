import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardShell from "../components/DashboardShell";
import Waveform from "../components/Waveform";
import CallControls from "../components/CallControls";
import TranscriptPanel from "../components/TranscriptPanel";
import { getCallById, endCall } from "../services/api";

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function LiveCall() {
  const { callId } = useParams();
  const navigate   = useNavigate();

  // ---- state ---------------------------------------------------------------
  const [seconds,    setSeconds]    = useState(0);
  const [muted,      setMuted]      = useState(false);
  const [callStatus, setCallStatus] = useState("connecting");
  const [messages,   setMessages]   = useState([]);

  // ---- refs ----------------------------------------------------------------
  const timerRef = useRef(null);
  const pollRef  = useRef(null);

  // ---- polling the active provider for status + transcript -------------------
  useEffect(() => {
    if (!callId) return;

    // Start elapsed-time timer
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    const poll = async () => {
      try {
        const data = await getCallById(callId);

        // Update transcript if available
        if (Array.isArray(data.transcript) && data.transcript.length > 0) {
          setMessages(data.transcript);
        }

        // Detect terminal states
        const terminal = ["Completed", "Failed", "Missed", "Ended"];
        if (terminal.includes(data.status)) {
          setCallStatus("ended");
          clearInterval(timerRef.current);
          clearInterval(pollRef.current);
          timerRef.current = null;
          pollRef.current  = null;
        } else {
          setCallStatus("active");
        }
      } catch (err) {
        console.warn("[voice] polling error:", err);
      }
    };

    // First poll immediately, then every 4 seconds
    poll();
    pollRef.current = setInterval(poll, 4000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(pollRef.current);
      timerRef.current = null;
      pollRef.current  = null;
    };
  }, [callId]);

  // ---- end call ------------------------------------------------------------
  const handleEndCall = async () => {
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    timerRef.current = null;
    pollRef.current  = null;

    setCallStatus("ended");

    try {
      await endCall(callId);
    } catch (err) {
      console.warn("[voice] failed to end call:", err);
    }

    navigate(callId ? `/dashboard/calls/${callId}` : "/dashboard/calls");
  };

  // ---- mute (UI only — Retell calls are on the recipient's phone) ----------
  const handleToggleMute = () => setMuted((m) => !m);

  // ---- derived UI state ----------------------------------------------------
  const isLive = callStatus === "active" || callStatus === "connecting";

  const statusLabel =
    callStatus === "connecting"
      ? "Dialling…"
      : callStatus === "active"
        ? "Connected"
        : "Ended";

  // ---- render --------------------------------------------------------------
  return (
    <DashboardShell
      title="Live Call"
      subtitle={`AI outbound call · ID: ${callId}`}
    >
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

        {/* CALL STAGE */}
        <div className="flex flex-col items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-card)]">
          <span className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-accent)]">
            {isLive && (
              <span className="absolute inset-0 rounded-full animate-pulse-ring" />
            )}
            <Waveform size="lg" active={isLive} color="white" />
          </span>

          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
            AI Call Agent
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Powered by your voice provider</p>

          {/* STATUS */}
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isLive
                  ? "bg-[var(--color-signal)] animate-pulse"
                  : "bg-[var(--color-gold)]"
              }`}
            />
            <span className="text-sm font-medium text-[var(--color-ink-soft)]">
              {statusLabel}
            </span>
          </div>

          {/* TIMER */}
          <p className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
            {formatDuration(seconds)}
          </p>

          {/* CONNECTING HINT */}
          {callStatus === "connecting" && (
            <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
              Your voice provider is dialling the recipient's phone…
            </p>
          )}

          {/* CONTROLS */}
          <div className="mt-10 w-full border-t border-[var(--color-border-soft)] pt-8">
            <CallControls
              muted={muted}
              onToggleMute={handleToggleMute}
              paused={false}
              onTogglePause={() => {}}
              speakerOn={true}
              onSpeaker={() => {}}
              onKeypad={() => {}}
              onEndCall={handleEndCall}
            />
          </div>
        </div>

        {/* LIVE TRANSCRIPT */}
        <div className="flex h-[560px] flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">
              Live Transcript
            </h2>
            <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-muted)]">
              <Waveform size="sm" active={isLive} color="var(--color-accent)" />
              {statusLabel}
            </span>
          </div>

          <TranscriptPanel
            messages={
              messages.length > 0
                ? messages
                : [
                    {
                      speaker: "ai",
                      text: callStatus === "connecting"
                        ? "Your voice provider is connecting the call — transcript will appear here once the call is answered."
                        : "Call in progress — transcript will appear here.",
                    },
                  ]
            }
            live={isLive}
          />

          <p className="mt-4 text-center text-xs text-[var(--color-ink-muted)]">
            Full transcript and recording details will be available after processing.
          </p>
        </div>

      </div>
    </DashboardShell>
  );
}
