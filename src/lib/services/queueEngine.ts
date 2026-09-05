import { QueueState } from "@/lib/demo/farmerData";

export interface QueuePositionMetrics {
  currentlyServing: number;
  yourToken: string;
  queuePosition: number;
  farmersAhead: number;
  estimatedWaitMins: number;
  status: "WAITING" | "CALLED" | "AT_COUNTER" | "PROCESSING" | "COMPLETED" | "SKIPPED";
  assignedCounter: string;
  explanation: string;
}

/**
 * Deterministic, explainable Queue & ETA Calculation Engine.
 * Calculates queue metrics and wait estimates directly from PostgreSQL database queue state.
 */
export const queueEngine = {
  /**
   * Calculates explainable ETA based on active queue position and active counter capacity.
   * Formula: ceil((farmersAhead * avgServiceTimeMins) / activeCounters)
   */
  calculateETA(farmersAhead: number, activeCounters: number = 2, avgServiceTimeMins: number = 6): {
    estimatedWaitMins: number;
    explanation: string;
  } {
    const validAhead = Math.max(0, farmersAhead);
    const validCounters = Math.max(1, activeCounters);
    const estimatedWaitMins = Math.ceil((validAhead * avgServiceTimeMins) / validCounters);

    const explanation =
      validAhead === 0
        ? "You are next in line! Proceed towards the entry gate."
        : `${validAhead} farmer(s) ahead × ${avgServiceTimeMins} mins avg service ÷ ${validCounters} active counter(s) = ~${estimatedWaitMins} mins wait time.`;

    return {
      estimatedWaitMins,
      explanation,
    };
  },

  /**
   * Transforms raw database queue entries into a formatted QueueState payload.
   */
  formatQueueState(params: {
    tokenCode: string;
    queueNumber: number;
    currentServingNumber: number;
    farmersAhead: number;
    status: string;
    counterAssigned?: string | null;
  }): QueueState {
    const { estimatedWaitMins, explanation } = this.calculateETA(params.farmersAhead);

    const isUserActive = ["WAITING", "CALLED", "AT_COUNTER", "PROCESSING"].includes(params.status);
    const isCompleted = params.status === "COMPLETED";

    const steps = [];
    const serving = Math.max(1, params.currentServingNumber);

    // Build visual progress items for queue visualizer bar
    for (let i = Math.max(1, serving - 2); i <= Math.max(params.queueNumber, serving + 2); i++) {
      steps.push({
        token: i,
        status: (i === serving ? "CURRENT" : i < serving ? "COMPLETED" : "WAITING") as "COMPLETED" | "CURRENT" | "WAITING",
        isUser: i === params.queueNumber,
      });
    }

    return {
      tokenNumber: params.tokenCode,
      queuePosition: params.queueNumber,
      currentlyServing: serving,
      farmersAhead: params.farmersAhead,
      estimatedWaitMins,
      assignedCounter: params.counterAssigned || "Weighbridge Gate #1",
      operatingStatus: params.farmersAhead > 10 ? "MODERATE_WAIT" : "SMOOTH",
      delayNotice: explanation,
      progressSteps: steps,
    };
  },
};
