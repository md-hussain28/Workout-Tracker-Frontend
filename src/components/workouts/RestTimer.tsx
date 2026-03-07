"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RestTimerProps {
  /** When true, start countdown immediately on mount (e.g. after completing a set). */
  autoStartOnMount?: boolean;
  /** Called after auto-start has been triggered (so parent can clear the flag). */
  onAutoStartDone?: () => void;
}

const DEFAULT_SECONDS = 120;
const STEP_SECONDS = 5;
const MIN_SECONDS = 30;
const MAX_SECONDS = 300;
const STORAGE_KEY = "workout-rest-timer-duration";

function playTimeoutSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    // Second beep after short gap
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 800;
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.3);
    }, 150);
  } catch {
    // Ignore if AudioContext not supported or blocked
  }
}

function vibrateOnTimeout() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getStoredDuration(): number {
  if (typeof window === "undefined") return DEFAULT_SECONDS;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v == null) return DEFAULT_SECONDS;
    const n = parseInt(v, 10);
    if (!Number.isNaN(n) && n >= MIN_SECONDS && n <= MAX_SECONDS) return n;
  } catch {
    // ignore
  }
  return DEFAULT_SECONDS;
}

function setStoredDuration(seconds: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(seconds));
  } catch {
    // ignore
  }
}

export function RestTimer({ autoStartOnMount = false, onAutoStartDone }: RestTimerProps = {}) {
  const [duration, setDuration] = useState(getStoredDuration);
  const [remaining, setRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartedRef = useRef(false);

  // Auto-start when opened after completing a set
  useEffect(() => {
    if (autoStartOnMount && !autoStartedRef.current && remaining > 0) {
      autoStartedRef.current = true;
      setIsRunning(true);
      onAutoStartDone?.();
    }
  }, [autoStartOnMount, remaining, onAutoStartDone]);

  const persistDuration = useCallback((sec: number) => {
    const clamped = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, sec));
    setStoredDuration(clamped);
  }, []);

  const adjustDuration = useCallback(
    (delta: number) => {
      if (isRunning) return;
      setDuration((d) => {
        const next = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, d + delta));
        persistDuration(next);
        return next;
      });
      setRemaining((r) => {
        const next = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, r + delta));
        return next;
      });
    },
    [isRunning, persistDuration]
  );

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setRemaining(duration);
  }, [duration]);

  // Sync remaining when duration changes and not running
  useEffect(() => {
    if (!isRunning) setRemaining(duration);
  }, [duration, isRunning]);

  // Countdown tick and timeout
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    const tick = () => {
      setRemaining((r) => {
        if (r <= 1) {
          setIsRunning(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          playTimeoutSound();
          vibrateOnTimeout();
          return 0;
        }
        return r - 1;
      });
    };
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const atZero = remaining === 0;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Duration controls: +/- 5 sec (only when not running) */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-12 rounded-xl"
          onClick={() => adjustDuration(-STEP_SECONDS)}
          disabled={isRunning || duration <= MIN_SECONDS}
          aria-label="Decrease by 5 seconds"
        >
          <Minus className="size-5" />
        </Button>
        <div className="min-w-[100px] text-center">
          <span className="text-4xl font-mono font-bold tabular-nums tracking-tight">
            {formatTime(remaining)}
          </span>
          {!isRunning && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {duration}s rest
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-12 rounded-xl"
          onClick={() => adjustDuration(STEP_SECONDS)}
          disabled={isRunning || duration >= MAX_SECONDS}
          aria-label="Increase by 5 seconds"
        >
          <Plus className="size-5" />
        </Button>
      </div>

      {/* Start / Pause / Reset */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <Button
            type="button"
            size="lg"
            className="rounded-xl gap-2"
            onClick={start}
            disabled={remaining <= 0}
          >
            <Play className="size-5" />
            Start
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="rounded-xl gap-2"
            onClick={pause}
          >
            <Pause className="size-5" />
            Pause
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="rounded-xl gap-2"
          onClick={reset}
          disabled={isRunning && remaining === duration}
        >
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>

      {atZero && (
        <p className="text-sm font-medium text-primary animate-pulse">
          Rest over — time for the next set!
        </p>
      )}

      <p className="text-xs text-muted-foreground text-center px-4">
        Default 120s. Adjust with ±5s (30s–300s). Vibration and sound on timeout.
      </p>
    </div>
  );
}
