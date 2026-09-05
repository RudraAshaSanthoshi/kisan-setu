"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FarmerShell } from "@/components/farmer/FarmerShell";
import { ProtectedRoleRoute } from "@/components/auth/ProtectedRoleRoute";
import { farmerService } from "@/lib/services/farmerService";
import { QueueState, BookingRecord } from "@/lib/demo/farmerData";
import { useLanguage } from "@/hooks/useLanguage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  QrCode,
  AlertCircle,
  Truck,
  ArrowRight,
  RefreshCw,
  Megaphone,
  CalendarPlus,
} from "lucide-react";
import { VoiceButton } from "@/components/shared/VoiceButton";

export default function LiveQueuePage() {
  const { t } = useLanguage();

  const [queue, setQueue] = useState<QueueState | null>(null);
  const [activeBooking, setActiveBooking] = useState<BookingRecord | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  const fetchQueueAndBooking = async () => {
    setRefreshing(true);
    const [qData, bData] = await Promise.all([
      farmerService.getQueueState(),
      farmerService.getActiveBooking(),
    ]);
    setQueue(qData);
    setActiveBooking(bData);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchQueueAndBooking();

    // Supabase Realtime Live Queue Subscription
    let channel: any;
    try {
      const supabase = getSupabaseBrowserClient();
      channel = supabase
        .channel("farmer_queue_realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "queue_entries" },
          () => {
            fetchQueueAndBooking();
          }
        )
        .subscribe();
    } catch {
      // Ignore realtime subscription error
    }

    return () => {
      if (channel) {
        try {
          const supabase = getSupabaseBrowserClient();
          supabase.removeChannel(channel);
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const handleCheckIn = async () => {
    if (!activeBooking) return;
    setIsCheckingIn(true);
    setCheckInError(null);

    const res = await farmerService.checkInBooking(activeBooking.id);
    setIsCheckingIn(false);

    if (res.success) {
      fetchQueueAndBooking();
    } else {
      setCheckInError(res.error || "Check-in failed. Please try again.");
    }
  };

  return (
    <ProtectedRoleRoute allowedRoles={["FARMER", "ADMIN"]}>
      {(user) => (
        <FarmerShell user={user}>
          <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    Live Queue Tracker
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Real-time gate arrival queue position and estimated arrival wait time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <VoiceButton text={`Live Queue Tracker. ${queue ? `Token ${queue.tokenNumber}. Your queue position is ${queue.queuePosition}. ${queue.farmersAhead} farmers ahead.` : "No active queue entry."}`} />
                <Button variant="outline" size="sm" onClick={fetchQueueAndBooking} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {checkInError && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{checkInError}</span>
              </div>
            )}

            {/* STATE 1: ACTIVE QUEUE ENTRY PRESENT */}
            {queue ? (
              <>
                {/* Status Notice Banner */}
                {queue.delayNotice && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{queue.delayNotice}</span>
                    </span>
                    <Badge variant="success" className="text-[10px] shrink-0 font-bold">
                      {queue.operatingStatus}
                    </Badge>
                  </div>
                )}

                {/* Primary Dual Counter Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Currently Serving Token */}
                  <Card className="border-border bg-card shadow-elevated text-center p-6 space-y-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Currently Serving
                    </span>
                    <div className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      #{queue.currentlyServing}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
                      <Truck className="h-3.5 w-3.5" />
                      <span>Active at {queue.assignedCounter}</span>
                    </div>
                  </Card>

                  {/* Your Token Position */}
                  <Card className="border-primary/40 bg-primary/5 shadow-elevated text-center p-6 space-y-3">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                      Your Queue Position
                    </span>
                    <div className="text-4xl sm:text-5xl font-black text-foreground font-mono">
                      #{queue.queuePosition}
                    </div>
                    <div className="flex items-center justify-center gap-3 text-xs font-bold text-muted-foreground pt-1">
                      <span>{queue.farmersAhead} Farmers Ahead</span>
                      <span>•</span>
                      <span>ETA ~{queue.estimatedWaitMins} Mins</span>
                    </div>
                  </Card>
                </div>

                {/* Live Progress Line Visualization */}
                <Card className="border-border shadow-subtle p-5 space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>Gate & Weighbridge Arrival Line</span>
                  </h3>

                  <div className="flex items-center justify-between overflow-x-auto pb-4 pt-2 gap-3 no-scrollbar">
                    {queue.progressSteps.map((step) => {
                      const isCurrent = step.status === "CURRENT";
                      const isUser = step.isUser;
                      return (
                        <div
                          key={step.token}
                          className={`flex flex-col items-center min-w-[70px] p-3 rounded-xl border-2 transition-all ${
                            isUser
                              ? "border-primary bg-primary text-primary-foreground font-black shadow-card scale-105"
                              : isCurrent
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
                              : "border-border bg-secondary/40 text-muted-foreground"
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold opacity-80">
                            {isUser ? "YOU" : isCurrent ? "NOW" : "WAIT"}
                          </span>
                          <span className="text-base font-mono font-black">#{step.token}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 rounded-lg bg-secondary/60 text-xs text-muted-foreground flex items-center justify-between">
                    <span>Token Code:</span>
                    <span className="font-bold text-foreground font-mono">{queue.tokenNumber}</span>
                  </div>
                </Card>
              </>
            ) : activeBooking ? (
              /* STATE 2: BOOKING EXISTS, BUT NOT YET CHECKED IN */
              <Card className="border-primary/30 bg-card shadow-elevated p-8 text-center space-y-5">
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-subtle">
                  <QrCode className="h-8 w-8" />
                </div>

                <div className="space-y-1 max-w-md mx-auto">
                  <Badge variant="outline" className="font-mono text-xs">
                    {activeBooking.tokenNumber}
                  </Badge>
                  <h3 className="text-xl font-black text-foreground pt-1">
                    You Have an Active Procurement Booking
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Click below to check in when you arrive at the mandi gate.
                  </p>
                </div>

                <div className="max-w-xs mx-auto p-4 rounded-xl bg-secondary/50 border border-border text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Mandi:</span>
                    <span className="font-bold text-foreground">{activeBooking.centreName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Crop & Volume:</span>
                    <span className="font-bold text-foreground">{activeBooking.cropName} ({activeBooking.quantityQtl} Qtl)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slot Time:</span>
                    <span className="font-bold text-foreground">{activeBooking.bookingDate} ({activeBooking.timeSlot})</span>
                  </div>
                </div>

                <Button size="lg" className="font-bold px-8 shadow-card" onClick={handleCheckIn} disabled={isCheckingIn}>
                  {isCheckingIn ? (
                    <span>Checking In...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Check In Now at Mandi Gate</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </Card>
            ) : (
              /* STATE 3: NO BOOKING AT ALL */
              <Card className="border-border shadow-elevated p-8 text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
                  <Clock className="h-7 w-7" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-lg font-bold text-foreground">
                    No Active Queue or Booking
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Book a procurement slot to receive your digital QR token and queue position.
                  </p>
                </div>
                <Button size="lg" className="font-bold px-6 shadow-card" asChild>
                  <Link href="/farmer/book-slot">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    <span>Book Procurement Slot</span>
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        </FarmerShell>
      )}
    </ProtectedRoleRoute>
  );
}
