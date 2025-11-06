import { WorkOrderTimeTracking } from "../shared/schema";

export interface TimerCalculationResult {
  elapsedMs: number;
  elapsedHours: number;
  displayText: string;
  isPaused: boolean;
  pausedReason?: string;
}

export function calculateWorkOrderElapsedTime(
  startedAt: Date | null | undefined,
  completedAt: Date | null | undefined,
  timeTrackingEvents: WorkOrderTimeTracking[],
  currentStatus: string
): TimerCalculationResult {
  if (!startedAt) {
    return {
      elapsedMs: 0,
      elapsedHours: 0,
      displayText: "Not started",
      isPaused: false,
    };
  }

  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  
  let totalElapsedMs = end - start;
  
  const sortedEvents = [...timeTrackingEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  let pauseStartMs: number | null = null;
  let totalPausedMs = 0;
  
  for (const event of sortedEvents) {
    const eventTime = new Date(event.timestamp).getTime();
    
    if (event.event === "pause") {
      if (pauseStartMs === null) {
        pauseStartMs = eventTime;
      }
    } else if (event.event === "resume") {
      if (pauseStartMs !== null) {
        totalPausedMs += eventTime - pauseStartMs;
        pauseStartMs = null;
      }
    }
  }
  
  const isPausedNow = pauseStartMs !== null || 
                       currentStatus === "awaiting_parts" || 
                       currentStatus === "waiting_purchase";
  
  if (isPausedNow && pauseStartMs !== null && !completedAt) {
    totalPausedMs += Date.now() - pauseStartMs;
  }
  
  const activeMs = Math.max(0, totalElapsedMs - totalPausedMs);
  
  const elapsedHours = activeMs / (1000 * 60 * 60);
  
  const displayText = formatElapsedTime(activeMs);
  
  let pausedReason: string | undefined;
  if (isPausedNow) {
    if (currentStatus === "awaiting_parts") {
      pausedReason = "Awaiting Parts";
    } else if (currentStatus === "waiting_purchase") {
      pausedReason = "Waiting for Purchase";
    }
  }
  
  return {
    elapsedMs: activeMs,
    elapsedHours,
    displayText,
    isPaused: isPausedNow,
    pausedReason,
  };
}

function formatElapsedTime(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}
