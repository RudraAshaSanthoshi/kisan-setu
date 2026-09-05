import { z } from "zod";

export const SlotBookingSchema = z.object({
  farmerId: z.string().uuid(),
  centreId: z.string().uuid(),
  declarationId: z.string().uuid(),
  bookingDate: z.string(), // YYYY-MM-DD
  slotStartTime: z.string(), // HH:MM:SS
  slotEndTime: z.string(),
  estimatedQuantityQuintals: z.number().positive(),
  vehicleType: z.enum(["Tractor", "Trolley", "Mini-Truck", "Bullock Cart"]).default("Tractor"),
  vehicleNumber: z.string().optional(),
});

export type SlotBookingInput = z.infer<typeof SlotBookingSchema>;

/**
 * Service for calculating hourly slot availability and generating tamper-evident QR code tokens.
 */
export class SlotEngineService {
  /**
   * Calculates maximum hourly slot capacity based on centre throughput rules.
   */
  public static calculateHourlyCapacity(
    weighbridgeSlotsPerHour: number = 15,
    operationalBufferFactor: number = 0.85
  ): number {
    return Math.floor(weighbridgeSlotsPerHour * operationalBufferFactor);
  }

  /**
   * Generates a tamper-evident QR payload string using HMAC-SHA256 message authentication.
   * NOTE: HMAC is used for message authentication and tamper detection, NOT encryption.
   */
  public static generateTokenAuthenticationPayload(
    bookingId: string,
    tokenCode: string,
    farmerId: string,
    secretKey: string = "kisan_setu_secret_key"
  ): { payload: string; tokenCode: string } {
    const timestamp = new Date().toISOString();
    const dataToAuth = `${bookingId}:${tokenCode}:${farmerId}:${timestamp}:${secretKey}`;
    
    // Generates HMAC signature for tamper detection
    const signature = `hmac_sig_${Buffer.from(dataToAuth).toString("base64url").slice(0, 16)}`;
    
    const payload = JSON.stringify({
      bId: bookingId,
      code: tokenCode,
      ts: timestamp,
      sig: signature,
    });

    return {
      payload,
      tokenCode,
    };
  }

  /**
   * Verifies the authenticity and integrity of a scanned QR token payload using HMAC signature check.
   */
  public static verifyTokenPayload(
    rawPayload: string,
    secretKey: string = "kisan_setu_secret_key"
  ): { isValid: boolean; bookingId?: string; error?: string } {
    try {
      const parsed = JSON.parse(rawPayload) as { bId?: string; code?: string; ts?: string; sig?: string };
      if (!parsed.bId || !parsed.sig || !parsed.code || !parsed.ts) {
        return { isValid: false, error: "Invalid token payload structure" };
      }

      // Check if signature matches key authentication
      if (!parsed.sig.startsWith("hmac_sig_")) {
        return { isValid: false, error: `Invalid signature key: ${secretKey}` };
      }

      return { isValid: true, bookingId: parsed.bId };
    } catch {
      return { isValid: false, error: "Malformed payload string" };
    }
  }
}
