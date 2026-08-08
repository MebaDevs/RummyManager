import { useState, useEffect, useRef, useCallback } from 'react';
import { Turn } from '../domain/models';

interface PreciseTimerOptions {
  currentTurn: Turn | null;
  timeLimitSeconds: number;
  warningSeconds?: number;
  soundEnabled?: boolean;
  onTimeout?: () => void;
  onTick?: (remainingSeconds: number) => void;
  playWarningSound?: () => void;
  playTimeoutSound?: () => void;
}

export interface PreciseTimerState {
  remainingMs: number;
  remainingSeconds: number;
  overdueMs: number;
  totalLimitSeconds: number;
  progressPercent: number; // 0 to 100
  isWarning: boolean;
  isExpired: boolean;
  isOverdue: boolean;
  isPaused: boolean;
  formattedTime: string;
}

export function usePreciseTimer({
  currentTurn,
  timeLimitSeconds,
  warningSeconds = 15,
  onTimeout,
  playWarningSound,
  playTimeoutSound,
}: PreciseTimerOptions): PreciseTimerState {
  const timeoutTriggeredRef = useRef<boolean>(false);
  const lastWarningSecondRef = useRef<number | null>(null);

  // Reset timeout ref whenever current turn changes
  useEffect(() => {
    timeoutTriggeredRef.current = false;
    lastWarningSecondRef.current = null;
  }, [currentTurn?.id]);

  const calculateState = useCallback((): PreciseTimerState => {
    if (!currentTurn) {
      return {
        remainingMs: timeLimitSeconds * 1000,
        remainingSeconds: timeLimitSeconds,
        overdueMs: 0,
        totalLimitSeconds: timeLimitSeconds,
        progressPercent: 100,
        isWarning: false,
        isExpired: false,
        isOverdue: false,
        isPaused: true,
        formattedTime: formatTime(timeLimitSeconds * 1000),
      };
    }

    const now = Date.now();
    const limitMs = timeLimitSeconds * 1000;
    let elapsedMs = currentTurn.accumulatedMs;

    if (currentTurn.status === 'running' || currentTurn.status === 'timeout') {
      if (currentTurn.startedAt) {
        const turnStart = new Date(currentTurn.startedAt).getTime();
        elapsedMs += Math.max(0, now - turnStart);
      }
    }

    const currentRemainingMs = Math.max(0, limitMs - elapsedMs);
    const overdueMs = Math.max(0, elapsedMs - limitMs);
    const remainingSec = Math.ceil(currentRemainingMs / 1000);

    const isExpired = elapsedMs >= limitMs;
    const isOverdue = overdueMs > 0;
    const isWarning = remainingSec <= warningSeconds && remainingSec > 0 && !isExpired;
    const isPaused = currentTurn.status === 'paused';
    const progressPercent = Math.max(0, Math.min(100, (currentRemainingMs / limitMs) * 100));

    // Audio cue checks for countdown warning
    if (isWarning && (currentTurn.status === 'running' || currentTurn.status === 'timeout') && playWarningSound) {
      if (remainingSec <= 5 && lastWarningSecondRef.current !== remainingSec) {
        lastWarningSecondRef.current = remainingSec;
        playWarningSound();
      }
    }

    // Timeout trigger check (applies penalty)
    if (isExpired && !timeoutTriggeredRef.current) {
      timeoutTriggeredRef.current = true;
      if (playTimeoutSound) playTimeoutSound();
      if (onTimeout) onTimeout();
    }

    const formattedTime = isOverdue
      ? `+${formatTime(overdueMs)}`
      : formatTime(currentRemainingMs);

    return {
      remainingMs: currentRemainingMs,
      remainingSeconds: remainingSec,
      overdueMs,
      totalLimitSeconds: timeLimitSeconds,
      progressPercent,
      isWarning,
      isExpired,
      isOverdue,
      isPaused,
      formattedTime,
    };
  }, [currentTurn, timeLimitSeconds, warningSeconds, onTimeout, playWarningSound, playTimeoutSound]);

  const [timerState, setTimerState] = useState<PreciseTimerState>(calculateState);

  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      setTimerState(calculateState());
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [calculateState]);

  return timerState;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
