import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardShell from "../components/DashboardShell";
import Waveform from "../components/Waveform";
import CallControls from "../components/CallControls";
import TranscriptPanel from "../components/TranscriptPanel";
import { getCallById, endCall } from "../services/api";

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_DURATION_MS = 10 * 60 * 1000; // stop asking after 10 minutes
const POLL_MAX_CONSECUTIVE_ERRORS = 5;
const TERMINAL_STATUSES = ["Completed", "Failed", "Missed", "Cancelled", "Ended"];

const FINAL_LABELS = {
  Completed: "Completed",
  Missed: "No answer",
  Failed: "Failed",
  Cancelled: "Cancelled",
};

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function LiveCall() {
  const { callId } = useParams();
  const navigate   = useNavigate();

  // ---- state ---------------------------------------------------------------
  const [seconds,       setSeconds]       = useState(0);
  const [muted,         setMuted]         = useState(false);
  const [callStatus,    setCallStatus]    = useState("connecting"); // connecting | active | ended
  const [ending,        setEnding]        = useState(false);
  const [endError,      setEndError]      = useState("");
  const [finalStatus,   setFinalStatus]   = useState("");
  const [finalDuration, setFinalDuration] = useState("");
  const [gaveUp,        setGaveUp]        = useState(false);
  const [pollWarning,   setPollWarning]   = useState("");
  const [messages,      setMessages]      = useState([]);

  // ---- refs ----------------------------------------------------------------
  const timerRef = useRef(null); // elapsed-time interval
  const pollRef  = useRef(null); // next-poll timeout

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };
  const stopPolling = () => {
    clearTimeout(pollRef.current);
    pollRef.current = null;
  };

  // ---- polling our backend (which asks the voice provider) ------------------
  // One request at a time: the next poll is only scheduled after the previous
  // one finishes, and polling stops for good at a final status, after repeated
  // errors, or after POLL_MAX_DURATION_MS. Polling never places a call.
  useEffect(() => {
    if (!callId) return;

    let cancelled = false;
    let consecutiveErrors = 0;
    const startedAt = Date.now();

    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    const giveUp = (message) => {
      setGaveUp(true);
      setPollWarning(message);
      stopTimer();
      stopPolling();
    };

    const scheduleNext = () => {
      if (cancelled) return;
      if (Date.now() - startedAt > POLL_MAX_DURATION_MS) {
        giveUp("Stopped checking after 10 minutes. The call may still be running — open Call History for its latest status.");
        return;
      }
      pollRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    };

    const poll = async () => {
      try {
        const data = await getCallById(callId);
        if (cancelled) return;
        consecutiveErrors = 0;

        if (Array.isArray(data.transcript) && data.transcript.length > 0) {
          setMessages(data.transcript);
        }
        setPollWarning(data.syncError || "");

        if (TERMINAL_STATUSES.includes(data.status)) {
          setCallStatus("ended");
          setFinalStatus(data.status);
          if (data.duration && data.duration !== "0:00") setFinalDuration(data.duration);
          stopTimer();
          stopPolling();
          return; // final state reached — no more requests
        }

        // Edesy reports "initiated" until the recipient picks up, then "in-progress".
        const stillDialling = data.provider === "edesy" && data.providerStatus === "initiated";
        setCallStatus(stillDialling ? "connecting" : "active");
        scheduleNext();
      } catch (err) {
        if (cancelled) return;
        consecutiveErrors += 1;
        console.warn("[voice] polling error:", err);
        if (consecutiveErrors >= POLL_MAX_CONSECUTIVE_ERRORS) {
          giveUp("Lost contact with the server. The call may still be running — open Call History for its latest status.");
          return;
        }
        setPollWarning(err.message || "Couldn't refresh the call status.");
        scheduleNext();
      }
    };

    // First poll immediately, then every POLL_INTERVAL_MS
    poll();

    return () => {
      cancelled = true;
      stopTimer();
      stopPolling();
    };
  }, [callId]);

  // ---- leave / end call ----------------------------------------------------
  const handleEndCall = async () => {
    if (ending) return;
    setEnding(true);
    setEndError("");

    try {
      const result = await endCall(callId);
      if (!result.ended && !TERMINAL_STATUSES.includes(result.status)) {
        setEndError(result.message || "The call could not be confirmed as ended.");
        return;
      }

      stopTimer();
      stopPolling();
      navigate(callId ? `/dashboard/calls/${callId}` : "/dashboard/calls");
    } catch (err) {
      setEndError(err.message || "Couldn't end the call. It may still be running; check Call History before retrying.");
    } finally {
      setEnding(false);
    }
  };

  // ---- mute (UI only — the call is on the recipient's phone) ---------------
  const handleToggleMute = () => setMuted((m) => !m);

  // ---- derived UI state ----------------------------------------------------
  const isLive = !gaveUp && (callStatus === "active" || callStatus === "connecting");

  const statusLabel = gaveUp
    ? "Status unknown"
    : callStatus === "connecting"
      ? "Dialling…"
      : callStatus === "active"
        ? "Connected"
        : FINAL_LABELS[finalStatus] || "Ended";

  const endedPlaceholder =
    finalStatus === "Missed"
      ? "The call wasn't answered."
      : finalStatus === "Failed"
        ? "The call failed and did not connect."
        : "The call has ended. The transcript and summary appear in the call details once processing finishes.";

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
            {finalDuration || formatDuration(seconds)}
          </p>

          {/* HINTS */}
          {callStatus === "connecting" && !gaveUp && (
            <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
              Your voice provider is dialling the recipient's phone…
            </p>
          )}
          {isLive && (
            <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
              You can leave this screen — the call keeps going and appears in Call History.
            </p>
          )}
          {pollWarning && (
            <p className="mt-3 rounded-lg bg-[var(--color-gold-dim)] px-3 py-2 text-xs text-[var(--color-gold-ink)]">
              {pollWarning}
            </p>
          )}
          {endError && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {endError}
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
              ending={ending}
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
                      text:
                        callStatus === "connecting"
                          ? "Your voice provider is connecting the call — transcript will appear here once the call is answered."
                          : callStatus === "ended"
                            ? endedPlaceholder
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
