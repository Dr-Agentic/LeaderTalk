// Pure utility functions for word usage calculations
export function calculateUsagePercentage(currentUsage: number, wordLimit: number): number {
  return Math.min(100, Math.round((currentUsage / wordLimit) * 100));
}

export function calculateDaysRemaining(endDate: Date): number {
  return Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

export function formatBillingCycleInfo(cycleStart: Date, cycleEnd: Date) {
  return {
    startDate: cycleStart.toISOString().split("T")[0],
    endDate: cycleEnd.toISOString().split("T")[0],
    daysRemaining: calculateDaysRemaining(cycleEnd),
    cycleNumber: 1,
  };
}
