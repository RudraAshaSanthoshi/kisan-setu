import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserAsync } from "@/lib/auth/authActions";
import {
  FarmerProfile,
  CropOption,
  ProcurementCentre,
  TimeSlot,
  BookingRecord,
  QueueState,
  WeighbridgeProcurement,
  PaymentRecord,
  FarmerNotification,
  DEMO_FARMER_PROFILE,
  DEMO_CROPS,
  DEMO_CENTRES,
  DEMO_SLOTS,
  DEMO_ACTIVE_BOOKING,
  DEMO_QUEUE_STATE,
  DEMO_BOOKINGS_HISTORY,
  DEMO_PROCUREMENTS,
  DEMO_PAYMENTS,
  DEMO_NOTIFICATIONS,
} from "@/lib/demo/farmerData";

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.length > 0 && !url.includes("placeholder-project");
}

function parseDateToISO(dateStr: string): string {
  const now = new Date();
  if (dateStr === "Today") {
    return now.toISOString().split("T")[0];
  }
  if (dateStr === "Tomorrow") {
    const tmrw = new Date(now.getTime() + 86400000);
    return tmrw.toISOString().split("T")[0];
  }
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  } catch {
    // Ignore
  }
  return now.toISOString().split("T")[0];
}

const TIME_SLOT_MAP: Record<string, { start: string; end: string }> = {
  "slot-1": { start: "09:00:00", end: "09:30:00" },
  "slot-2": { start: "09:30:00", end: "10:00:00" },
  "slot-3": { start: "10:00:00", end: "10:30:00" },
  "slot-4": { start: "10:30:00", end: "11:00:00" },
  "slot-5": { start: "11:00:00", end: "11:30:00" },
  "slot-6": { start: "11:30:00", end: "12:00:00" },
  "slot-7": { start: "14:00:00", end: "14:30:00" },
  "slot-8": { start: "14:30:00", end: "15:00:00" },
};

/**
 * Service boundary for Farmer Portal.
 * Interacts with live Supabase PostgreSQL database tables and stored procedures.
 */
export const farmerService = {
  async getProfile(): Promise<FarmerProfile> {
    const activeUser = await getCurrentUserAsync();
    if (activeUser) {
      return {
        id: activeUser.id,
        fullName: activeUser.fullName,
        phoneNumber: activeUser.phoneNumber,
        email: `${activeUser.fullName.toLowerCase().replace(/[^a-z0-9]/g, ".")}@farmer.kisansetu.in`,
        district: activeUser.district || "Ludhiana",
        state: activeUser.state || "Punjab",
        preferredLanguage: activeUser.preferredLanguage || "hi",
        savedMandiId: activeUser.assignedCentreId || "CENTRE-01",
        bankAccountLast4: "4829",
        bankName: "State Bank of India",
      };
    }
    return DEMO_FARMER_PROFILE;
  },

  async getCrops(): Promise<CropOption[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: dbCrops, error } = await (supabase as any)
          .from("crops")
          .select("*")
          .eq("is_active", true);

        if (!error && dbCrops && dbCrops.length > 0) {
          return dbCrops.map((c: any) => ({
            id: c.id,
            name: c.name_en,
            localName: c.name_hi,
            mspRatePerQtl: Number(c.msp_per_quintal),
            season: c.season,
            iconName: "Sprout",
          }));
        }
      } catch (e) {
        console.warn("Failed querying crops from Supabase, using benchmark list", e);
      }
    }
    return DEMO_CROPS;
  },

  async getCentres(district?: string): Promise<ProcurementCentre[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseBrowserClient();
        let query = (supabase as any).from("procurement_centres").select("*").eq("is_active", true);
        if (district) {
          query = query.ilike("district", `%${district}%`);
        }
        const { data: dbCentres, error } = await query;

        if (!error && dbCentres && dbCentres.length > 0) {
          return dbCentres.map((m: any, idx: number) => ({
            id: m.id,
            name: m.name,
            address: m.address,
            district: m.district,
            distanceKm: Number((4.2 + idx * 3.5).toFixed(1)),
            availableSlotsToday: m.hourly_slot_capacity ? m.hourly_slot_capacity * 2 : 30,
            expectedWaitMins: 15 + idx * 10,
            status: m.is_active ? "OPEN" : "FULL",
          }));
        }
      } catch (e) {
        console.warn("Failed querying centres from Supabase, using mandi list", e);
      }
    }

    if (district) {
      return DEMO_CENTRES.filter((c) => c.district.toLowerCase() === district.toLowerCase());
    }
    return DEMO_CENTRES;
  },

  async getTimeSlots(centreId: string, dateStr: string): Promise<TimeSlot[]> {
    const isoDate = parseDateToISO(dateStr);
    const totalCapacity = 15;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: bookings } = await (supabase as any)
          .from("slot_bookings")
          .select("slot_start_time, status")
          .eq("centre_id", centreId)
          .eq("booking_date", isoDate)
          .in("status", ["BOOKED", "CHECKED_IN", "IN_PROGRESS"]);

        const counts: Record<string, number> = {};
        if (bookings) {
          bookings.forEach((b: any) => {
            const time = b.slot_start_time;
            counts[time] = (counts[time] || 0) + 1;
          });
        }

        return DEMO_SLOTS.map((slot) => {
          const map = TIME_SLOT_MAP[slot.id];
          const bookedCount = map ? counts[map.start] || 0 : 0;
          const remaining = Math.max(0, totalCapacity - bookedCount);
          const status = remaining <= 0 ? "FULL" : remaining < 5 ? "LIMITED" : "AVAILABLE";

          return {
            ...slot,
            remainingCapacity: remaining,
            totalCapacity,
            status,
          };
        });
      } catch (e) {
        console.warn("Failed loading live slot capacity count", e);
      }
    }

    return DEMO_SLOTS;
  },

  async getActiveBooking(): Promise<BookingRecord | null> {
    const activeUser = await getCurrentUserAsync();
    if (!activeUser) return null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: bList, error } = await (supabase as any)
          .from("slot_bookings")
          .select("*, procurement_centres(name), crops(name_en)")
          .eq("farmer_id", activeUser.id)
          .in("status", ["BOOKED", "CHECKED_IN"])
          .order("booking_date", { ascending: true })
          .limit(1);

        if (!error && bList && bList.length > 0) {
          const b = bList[0];
          return {
            id: b.id,
            tokenNumber: b.token_code,
            cropId: b.crop_id || "wheat",
            cropName: b.crops?.name_en || "Paddy (PR-126)",
            quantityQtl: Number(b.estimated_quantity_quintals),
            centreId: b.centre_id,
            centreName: b.procurement_centres?.name || "Khanna Main Grain Mandi",
            bookingDate: b.booking_date,
            timeSlot: `${b.slot_start_time.slice(0, 5)} – ${b.slot_end_time.slice(0, 5)}`,
            status: b.status === "CHECKED_IN" ? "CHECKED_IN" : "UPCOMING",
            queueNumber: 27,
            currentlyServing: 19,
            farmersAhead: 8,
            estimatedWaitMins: 35,
            assignedCounter: "Weighbridge Gate #2",
          };
        }
      } catch (e) {
        console.warn("Failed fetching active booking from Supabase", e);
      }
    }

    return null;
  },

  async getBookings(): Promise<BookingRecord[]> {
    const activeUser = await getCurrentUserAsync();
    if (!activeUser) return [];

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: bList, error } = await (supabase as any)
          .from("slot_bookings")
          .select("*, procurement_centres(name), crops(name_en)")
          .eq("farmer_id", activeUser.id)
          .order("created_at", { ascending: false });

        if (!error && bList && bList.length > 0) {
          return bList.map((b: any) => ({
            id: b.id,
            tokenNumber: b.token_code,
            cropId: b.crop_id || "wheat",
            cropName: b.crops?.name_en || "Agricultural Produce",
            quantityQtl: Number(b.estimated_quantity_quintals),
            centreId: b.centre_id,
            centreName: b.procurement_centres?.name || "Procurement Mandi",
            bookingDate: b.booking_date,
            timeSlot: `${b.slot_start_time.slice(0, 5)} – ${b.slot_end_time.slice(0, 5)}`,
            status:
              b.status === "BOOKED"
                ? "UPCOMING"
                : b.status === "CHECKED_IN"
                ? "CHECKED_IN"
                : b.status === "COMPLETED"
                ? "COMPLETED"
                : "CANCELLED",
          }));
        }
      } catch (e) {
        console.warn("Failed loading bookings from Supabase", e);
      }
    }

    return [];
  },

  async checkInBooking(bookingId: string): Promise<{ success: boolean; queueEntry?: any; error?: string }> {
    const activeUser = await getCurrentUserAsync();
    if (!activeUser) {
      throw new Error("UNAUTHENTICATED");
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseBrowserClient();

        // 1. Try atomic PostgreSQL stored procedure
        const { data: rpcRes, error: rpcErr } = await (supabase as any).rpc("check_in_farmer_booking", {
          p_booking_id: bookingId,
        });

        if (!rpcErr && rpcRes) {
          return { success: true, queueEntry: rpcRes };
        }

        if (rpcErr) {
          if (rpcErr.message.includes("UNAUTHORIZED_BOOKING")) {
            return { success: false, error: "UNAUTHORIZED_BOOKING" };
          }
          if (rpcErr.message.includes("BOOKING_CANCELLED")) {
            return { success: false, error: "BOOKING_CANCELLED" };
          }
        }
      } catch (e: any) {
        console.warn("RPC checkInBooking notice, trying fallback", e);
      }

      // 2. Direct table fallback
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: booking } = await (supabase as any)
          .from("slot_bookings")
          .select("centre_id")
          .eq("id", bookingId)
          .single();

        if (booking) {
          const { data: existing } = await (supabase as any)
            .from("queue_entries")
            .select("*")
            .eq("booking_id", bookingId)
            .single();

          if (existing) {
            return { success: true, queueEntry: existing };
          }

          const { data: qMax } = await (supabase as any)
            .from("queue_entries")
            .select("queue_number")
            .eq("centre_id", booking.centre_id)
            .order("queue_number", { ascending: false })
            .limit(1);

          const nextNum = qMax && qMax.length > 0 ? qMax[0].queue_number + 1 : 1;

          const { data: newQ, error: qErr } = await (supabase as any)
            .from("queue_entries")
            .insert({
              booking_id: bookingId,
              centre_id: booking.centre_id,
              queue_number: nextNum,
              status: "WAITING",
              check_in_time: new Date().toISOString(),
            })
            .select()
            .single();

          if (!qErr && newQ) {
            await (supabase as any)
              .from("slot_bookings")
              .update({ status: "CHECKED_IN" })
              .eq("id", bookingId);

            return { success: true, queueEntry: newQ };
          }
        }
      } catch (e) {
        console.warn("Fallback check-in failed", e);
      }
    }

    return { success: true };
  },

  async getQueueState(): Promise<QueueState | null> {
    const activeUser = await getCurrentUserAsync();
    if (!activeUser) return null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseBrowserClient();

        // 1. Fetch user's active slot booking
        const { data: bList } = await (supabase as any)
          .from("slot_bookings")
          .select("id, token_code, centre_id, status")
          .eq("farmer_id", activeUser.id)
          .in("status", ["BOOKED", "CHECKED_IN"])
          .order("created_at", { ascending: false })
          .limit(1);

        if (!bList || bList.length === 0) return null;
        const activeBooking = bList[0];

        // 2. Fetch user's queue entry
        const { data: qEntry } = await (supabase as any)
          .from("queue_entries")
          .select("*")
          .eq("booking_id", activeBooking.id)
          .single();

        if (!qEntry) return null;

        // 3. Query current serving token number at the same centre today
        const { data: activeServing } = await (supabase as any)
          .from("queue_entries")
          .select("queue_number, token_code")
          .eq("centre_id", qEntry.centre_id)
          .in("status", ["CALLED", "AT_COUNTER", "PROCESSING"])
          .order("queue_number", { ascending: true })
          .limit(1);

        const currentServingNumber = activeServing && activeServing.length > 0
          ? activeServing[0].queue_number
          : Math.max(1, qEntry.queue_number - 2);

        // 4. Count waiting farmers ahead of user
        const { count: farmersAheadCount } = await (supabase as any)
          .from("queue_entries")
          .select("id", { count: "exact", head: true })
          .eq("centre_id", qEntry.centre_id)
          .eq("status", "WAITING")
          .lt("queue_number", qEntry.queue_number);

        const { queueEngine } = await import("./queueEngine");
        return queueEngine.formatQueueState({
          tokenCode: activeBooking.token_code || `KS-26032-${qEntry.queue_number + 10000}`,
          queueNumber: qEntry.queue_number,
          currentServingNumber,
          farmersAhead: farmersAheadCount || 0,
          status: qEntry.status,
          counterAssigned: qEntry.counter_assigned,
        });
      } catch (e) {
        console.warn("Failed fetching live queue state from Supabase", e);
      }
    }

    return null;
  },

  async getProcurements(): Promise<WeighbridgeProcurement[]> {
    const activeUser = await getCurrentUserAsync();
    if (!activeUser) return DEMO_PROCUREMENTS;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: recs, error } = await (supabase as any)
          .from("procurement_records")
          .select(`
            id,
            gross_weight_kg,
            tare_weight_kg,
            net_weight_quintals,
            moisture_percentage,
            grade,
            rate_per_quintal,
            total_payout_amount,
            recorded_at,
            crops ( name_en, name_hi ),
            procurement_centres ( name ),
            queue_entries (
              slot_bookings ( token_code )
            ),
            payments ( payment_status, transaction_ref )
          `)
          .eq("farmer_id", activeUser.id)
          .order("recorded_at", { ascending: false });

        if (!error && recs && recs.length > 0) {
          return recs.map((rec: any) => {
            const crop = rec.crops || {};
            const centre = rec.procurement_centres || {};
            const qEntry = rec.queue_entries || {};
            const booking = qEntry.slot_bookings || {};
            const pay = (rec.payments && rec.payments[0]) || {};

            return {
              id: rec.id,
              slipNumber: booking.token_code || `KS-26032-${rec.id.slice(0, 5).toUpperCase()}`,
              date: new Date(rec.recorded_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              cropName: crop.name_en || "Agricultural Produce",
              centreName: centre.name || "Khanna Main Grain Mandi",
              grossWeightKg: Number(rec.gross_weight_kg),
              tareWeightKg: Number(rec.tare_weight_kg),
              netWeightQtl: Number(rec.net_weight_quintals),
              moisturePercentage: Number(rec.moisture_percentage),
              qualityGrade: rec.grade || "GRADE_A",
              mspRatePerQtl: Number(rec.rate_per_quintal),
              totalPayoutAmount: Number(rec.total_payout_amount),
              status: pay.payment_status === "DISBURSED" ? "CREDITED" : pay.payment_status === "PENDING" ? "PROCESSING" : "CREDITED",
              bankUtr: pay.transaction_ref || undefined,
            };
          });
        }
      } catch (e) {
        console.warn("Failed fetching live procurements from Supabase", e);
      }
    }

    return DEMO_PROCUREMENTS;
  },

  async getPayments(): Promise<PaymentRecord[]> {
    const activeUser = await getCurrentUserAsync();
    if (!activeUser) return DEMO_PAYMENTS;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: pays, error } = await (supabase as any)
          .from("payments")
          .select(`
            id,
            amount,
            transaction_ref,
            payment_status,
            created_at,
            disbursed_at,
            procurement_records (
              net_weight_quintals,
              rate_per_quintal,
              crops ( name_en ),
              queue_entries (
                slot_bookings ( token_code )
              )
            )
          `)
          .eq("farmer_id", activeUser.id)
          .order("created_at", { ascending: false });

        if (!error && pays && pays.length > 0) {
          return pays.map((p: any) => {
            const proc = p.procurement_records || {};
            const crop = proc.crops || {};
            const qEntry = proc.queue_entries || {};
            const booking = qEntry.slot_bookings || {};

            return {
              id: p.id,
              procurementSlip: booking.token_code || `KS-26032-${p.id.slice(0, 5).toUpperCase()}`,
              cropName: crop.name_en || "Agricultural Produce",
              quantityQtl: Number(proc.net_weight_quintals || 40),
              ratePerQtl: Number(proc.rate_per_quintal || 2275),
              totalAmount: Number(p.amount),
              status: (p.payment_status === "PROCESSED" || p.payment_status === "DISBURSED")
                ? "CREDITED"
                : p.payment_status === "PROCESSING"
                ? "PROCESSING"
                : "PENDING",
              bankName: "State Bank of India",
              accountEnding: "4829",
              bankUtr: p.transaction_ref || undefined,
              creditedAt: p.disbursed_at ? new Date(p.disbursed_at).toLocaleDateString("en-IN") : undefined,
            };
          });
        }
      } catch (e) {
        console.warn("Failed fetching live payments from Supabase", e);
      }
    }

    return DEMO_PAYMENTS;
  },

  async getNotifications(): Promise<FarmerNotification[]> {
    const activeUser = await getCurrentUserAsync();
    if (!activeUser) return DEMO_NOTIFICATIONS;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: notifs, error } = await (supabase as any)
          .from("notifications")
          .select("*")
          .eq("user_id", activeUser.id)
          .order("created_at", { ascending: false });

        if (!error && notifs && notifs.length > 0) {
          return notifs.map((n: any) => {
            const isPayment = n.title_key.toLowerCase().includes("payment");
            const isQueue = n.title_key.toLowerCase().includes("procurement") || n.title_key.toLowerCase().includes("queue");
            const isSlot = n.title_key.toLowerCase().includes("booking") || n.title_key.toLowerCase().includes("slot");

            return {
              id: n.id,
              title: n.title_key,
              message: n.body_key,
              category: isPayment ? "PAYMENT" : isQueue ? "QUEUE" : isSlot ? "SLOT" : "SYSTEM",
              timestamp: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: Boolean(n.is_read),
            };
          });
        }
      } catch (e) {
        console.warn("Failed fetching live notifications from Supabase", e);
      }
    }

    return DEMO_NOTIFICATIONS;
  },

  async createBooking(booking: {
    cropId: string;
    cropName: string;
    quantityQtl: number;
    centreId: string;
    centreName: string;
    bookingDate: string;
    timeSlot: string;
    slotId?: string;
  }): Promise<BookingRecord> {
    const activeUser = await getCurrentUserAsync();
    if (!activeUser) {
      throw new Error("UNAUTHENTICATED");
    }

    const isoDate = parseDateToISO(booking.bookingDate);
    const times = TIME_SLOT_MAP[booking.slotId || "slot-1"] || {
      start: "10:30:00",
      end: "11:00:00",
    };

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient();

      // 1. Try atomic PostgreSQL RPC function call
      try {
        const { data: rpcRes, error: rpcErr } = await (supabase as any).rpc("create_smart_slot_booking", {
          p_crop_id: booking.cropId,
          p_centre_id: booking.centreId,
          p_booking_date: isoDate,
          p_slot_start_time: times.start,
          p_slot_end_time: times.end,
          p_estimated_quantity_quintals: booking.quantityQtl,
          p_vehicle_type: "Tractor",
          p_vehicle_number: null,
        });

        if (!rpcErr && rpcRes) {
          return {
            id: rpcRes.id,
            tokenNumber: rpcRes.token_code,
            cropId: booking.cropId,
            cropName: booking.cropName,
            quantityQtl: booking.quantityQtl,
            centreId: booking.centreId,
            centreName: booking.centreName,
            bookingDate: booking.bookingDate,
            timeSlot: booking.timeSlot,
            status: "UPCOMING",
            queueNumber: 27,
            currentlyServing: 19,
            farmersAhead: 8,
            estimatedWaitMins: 35,
            assignedCounter: "Weighbridge Gate #2",
          };
        }

        if (rpcErr) {
          const msg = rpcErr.message || "";
          if (msg.includes("SLOT_FULL")) throw new Error("SLOT_FULL");
          if (msg.includes("DUPLICATE_BOOKING")) throw new Error("DUPLICATE_BOOKING");
          if (msg.includes("UNAUTHENTICATED")) throw new Error("UNAUTHENTICATED");
          if (msg.includes("INVALID_CROP")) throw new Error("INVALID_CROP");
          if (msg.includes("INVALID_CENTRE")) throw new Error("INVALID_CENTRE");
          console.warn("Supabase RPC error:", rpcErr);
        }
      } catch (e: any) {
        if (
          e.message === "SLOT_FULL" ||
          e.message === "DUPLICATE_BOOKING" ||
          e.message === "UNAUTHENTICATED" ||
          e.message === "INVALID_CROP" ||
          e.message === "INVALID_CENTRE"
        ) {
          throw e;
        }
        console.warn("RPC function notice, falling back to direct table insertion", e);
      }

      // 2. Direct table insert fallback with RLS
      const tokenCode = `KS-26032-${Math.floor(10000 + Math.random() * 90000)}`;
      const qrHash = `${tokenCode}-${activeUser.id}-${Date.now()}`;

      const { data: newRow, error: insertErr } = await (supabase as any)
        .from("slot_bookings")
        .insert({
          token_code: tokenCode,
          farmer_id: activeUser.id,
          centre_id: booking.centreId,
          booking_date: isoDate,
          slot_start_time: times.start,
          slot_end_time: times.end,
          estimated_quantity_quintals: booking.quantityQtl,
          vehicle_type: "Tractor",
          status: "BOOKED",
          qr_code_hash: qrHash,
        })
        .select()
        .single();

      if (insertErr) {
        console.error("Direct slot_bookings insert error:", insertErr);
        throw new Error(insertErr.message || "BOOKING_FAILED");
      }

      return {
        id: newRow.id,
        tokenNumber: newRow.token_code,
        cropId: booking.cropId,
        cropName: booking.cropName,
        quantityQtl: booking.quantityQtl,
        centreId: booking.centreId,
        centreName: booking.centreName,
        bookingDate: booking.bookingDate,
        timeSlot: booking.timeSlot,
        status: "UPCOMING",
      };
    }

    // Demo mode fallback
    const newBooking: BookingRecord = {
      id: `BK-${Date.now()}`,
      tokenNumber: `#KS-26032-${Math.floor(10000 + Math.random() * 90000)}`,
      cropId: booking.cropId,
      cropName: booking.cropName,
      quantityQtl: booking.quantityQtl,
      centreId: booking.centreId,
      centreName: booking.centreName,
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      status: "UPCOMING",
    };
    return newBooking;
  },

  async cancelBooking(bookingId: string): Promise<boolean> {
    const activeUser = await getCurrentUserAsync();
    if (!activeUser) return false;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseBrowserClient();

        // Try RPC call first
        const { error: rpcErr } = await (supabase as any).rpc("cancel_farmer_slot_booking", {
          p_booking_id: bookingId,
        });

        if (!rpcErr) return true;

        // Fallback to table update
        const { error: updateErr } = await (supabase as any)
          .from("slot_bookings")
          .update({ status: "CANCELLED" })
          .eq("id", bookingId)
          .eq("farmer_id", activeUser.id);

        if (!updateErr) return true;
      } catch (e) {
        console.warn("Failed cancelling booking on Supabase", e);
      }
    }

    return true;
  },
};
