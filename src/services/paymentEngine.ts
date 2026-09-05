import { z } from "zod";

export const ProcurementRecordSchema = z.object({
  queueEntryId: z.string().uuid(),
  farmerId: z.string().uuid(),
  centreId: z.string().uuid(),
  cropId: z.string().uuid(),
  grossWeightKg: z.number().positive(),
  tareWeightKg: z.number().nonnegative(),
  moisturePercentage: z.number().min(0).max(100),
  grade: z.enum(["GRADE_A", "FAQ", "REJECTED"]),
  ratePerQuintal: z.number().positive(),
  staffId: z.string().uuid(),
});

export type ProcurementRecordInput = z.infer<typeof ProcurementRecordSchema>;

export class PaymentEngineService {
  /**
   * Calculates net crop weight in Quintals (1 Quintal = 100 kg).
   */
  public static calculateNetWeightQuintals(grossWeightKg: number, tareWeightKg: number): number {
    const netKg = Math.max(0, grossWeightKg - tareWeightKg);
    return Number((netKg / 100).toFixed(2));
  }

  /**
   * Calculates total MSP payout amount in INR based on net quintals and rate per quintal.
   */
  public static calculateTotalPayout(
    netQuintals: number,
    ratePerQuintal: number,
    moistureDeductionPercentage: number = 0
  ): { totalAmount: number; adjustedRate: number } {
    const adjustedRate = Math.max(0, ratePerQuintal * (1 - moistureDeductionPercentage / 100));
    const totalAmount = Math.round(netQuintals * adjustedRate);
    return {
      totalAmount,
      adjustedRate,
    };
  }
}
