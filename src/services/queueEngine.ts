export type QueueStatus = "WAITING" | "WEIGHING" | "GRADING" | "COMPLETED" | "SKIPPED";

export interface QueueEntryState {
  id: string;
  bookingId: string;
  centreId: string;
  queueNumber: number;
  status: QueueStatus;
  checkInTime: string;
  estimatedWaitMinutes: number;
}

/**
 * Transport-agnostic subscription listener interface.
 * Realtime communication (WebSockets via Supabase, Server-Sent Events, or HTTP Polling)
 * is kept as an implementation detail behind this interface.
 */
export interface QueueTransportSubscriber {
  subscribeToCentreQueue: (
    centreId: string,
    onQueueUpdate: (entries: QueueEntryState[]) => void
  ) => () => void; // Unsubscribe cleanup function
}

export class QueueEngineService {
  /**
   * Calculates estimated wait time (ETA) in minutes.
   */
  public static calculateEstimatedWaitTime(
    queuePosition: number,
    avgProcessingDurationMinutes: number = 15
  ): number {
    if (queuePosition <= 1) return 0;
    return (queuePosition - 1) * avgProcessingDurationMinutes;
  }

  /**
   * Calculates centre congestion index (0.0 to 1.0) for capacity health monitoring.
   */
  public static calculateCongestionIndex(
    waitingVehiclesCount: number,
    maxHourlyCapacity: number,
    avgWaitTimeMinutes: number
  ): { index: number; status: "GREEN" | "YELLOW" | "RED" } {
    const queueRatio = waitingVehiclesCount / Math.max(1, maxHourlyCapacity * 2);
    const waitRatio = avgWaitTimeMinutes / 60;
    
    const index = Math.min(1.0, 0.6 * queueRatio + 0.4 * waitRatio);

    if (index < 0.5) return { index, status: "GREEN" };
    if (index < 0.8) return { index, status: "YELLOW" };
    return { index, status: "RED" };
  }
}
