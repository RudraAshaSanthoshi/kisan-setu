"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FarmerShell } from "@/components/farmer/FarmerShell";
import { ProtectedRoleRoute } from "@/components/auth/ProtectedRoleRoute";
import { farmerService } from "@/lib/services/farmerService";
import { BookingRecord, QueueState, FarmerNotification } from "@/lib/demo/farmerData";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tractor,
  CalendarPlus,
  CalendarDays,
  Clock,
  Scale,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MapPin,
  QrCode,
  Bell,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react";
import { VoiceButton } from "@/components/shared/VoiceButton";

export default function FarmerDashboardPage() {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState<BookingRecord | null>(null);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [notifications, setNotifications] = useState<FarmerNotification[]>([]);
  const [toggleEmptyState, setToggleEmptyState] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [booking, queue, notifs] = await Promise.all([
          farmerService.getActiveBooking(),
          farmerService.getQueueState(),
          farmerService.getNotifications(),
        ]);
        setActiveBooking(booking);
        setQueueState(queue);
        setNotifications(notifs);
      } catch (e) {
        console.error("Failed loading dashboard data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <ProtectedRoleRoute allowedRoles={["FARMER", "ADMIN"]}>
      {(user) => (
        <FarmerShell user={user}>
          <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
            {/* ================================================== */}
            {/* 1. GREETING BANNER & PROTOTYPE STATE TOGGLE */}
            {/* ================================================== */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-background border border-primary/20">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>KisanSetu Smart Procurement</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                  {t("farmer.dashboard.greeting")}, {user.fullName}! 👋
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {t("farmer.dashboard.sub_district")}
                </p>
              </div>

              {/* Voice Guidance & Demo State Toggle */}
              <div className="flex items-center gap-2 bg-background/80 p-2 rounded-xl border border-border shrink-0 text-xs">
                <VoiceButton
                  text={`${t("farmer.dashboard.greeting")}, ${user.fullName}. ${t("farmer.dashboard.sub_district")}`}
                />
                <span className="font-bold text-muted-foreground text-[11px]">{t("farmer.dashboard.demo_state_label")}:</span>
                <button
                  type="button"
                  onClick={() => setToggleEmptyState(!toggleEmptyState)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                    toggleEmptyState
                      ? "bg-secondary text-foreground border border-border"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {toggleEmptyState ? t("farmer.dashboard.no_booking_state") : t("farmer.dashboard.active_booking_state")}
                </button>
              </div>
            </div>

            {/* ================================================== */}
            {/* 2. PRIMARY "NEXT PROCUREMENT" CARD */}
            {/* ================================================== */}
            {!toggleEmptyState && activeBooking ? (
              <Card className="border-primary/40 shadow-elevated bg-card overflow-hidden">
                <div className="bg-primary text-primary-foreground px-5 py-3 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <QrCode className="h-4 w-4" />
                    {t("farmer.dashboard.next_procurement")}
                  </span>
                  <Badge variant="secondary" className="font-bold text-xs">
                    {activeBooking.tokenNumber}
                  </Badge>
                </div>

                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-foreground">
                        {activeBooking.cropName}
                      </h2>
                      <p className="text-sm font-extrabold text-primary">
                        {activeBooking.quantityQtl} {t("farmer.booking_wizard.quintals_unit")} ({t("farmer.dashboard.harvest_batch")})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary/60 p-2.5 rounded-xl border border-border/80">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <span className="text-foreground block">{activeBooking.centreName}</span>
                        <span className="text-[11px] font-normal">{activeBooking.bookingDate} • {activeBooking.timeSlot}</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Queue Banner Strip */}
                  {queueState ? (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                      <div className="p-2 rounded-lg bg-background/60">
                        <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block uppercase">
                          {t("farmer.dashboard.queue_position")}
                        </span>
                        <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                          #{queueState.queuePosition}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-background/60">
                        <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block uppercase">
                          {t("farmer.dashboard.farmers_ahead")}
                        </span>
                        <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                          {t("farmer.dashboard.farmers_count", { count: queueState.farmersAhead })}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-background/60">
                        <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block uppercase">
                          {t("farmer.dashboard.estimated_wait")}
                        </span>
                        <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                          {t("farmer.dashboard.mins_count", { count: queueState.estimatedWaitMins })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5 text-left">
                        <span className="font-bold text-amber-900 dark:text-amber-200 block">
                          Check In Required Upon Gate Arrival
                        </span>
                        <span className="text-amber-800/80 dark:text-amber-300/80 text-[11px]">
                          Check in at the gate scanner to generate your sequential arrival token and queue number.
                        </span>
                      </div>
                      <Button size="sm" className="font-bold shrink-0 shadow-card" asChild>
                        <Link href="/farmer/queue">
                          <span>Check In Now</span>
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="bg-secondary/30 border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    {t("farmer.dashboard.currently_serving")}: <strong className="text-foreground">#{queueState?.currentlyServing || 1}</strong> {t("farmer.dashboard.at_gate")}
                  </span>

                  <Button size="lg" className="w-full sm:w-auto font-bold shadow-card" asChild>
                    <Link href="/farmer/queue">
                      <span>{t("farmer.dashboard.track_queue")}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              /* Empty State Card */
              <Card className="border-dashed border-2 border-border shadow-subtle p-8 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
                  <CalendarDays className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground">{t("farmer.dashboard.no_upcoming")}</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {t("farmer.dashboard.no_upcoming_desc")}
                  </p>
                </div>
                <Button size="lg" className="font-bold px-8 shadow-card" asChild>
                  <Link href="/farmer/book-slot">
                    <CalendarPlus className="mr-2 h-5 w-5" />
                    <span>{t("farmer.dashboard.book_slot_button")}</span>
                  </Link>
                </Button>
              </Card>
            )}

            {/* ================================================== */}
            {/* 3. QUICK ACTIONS GRID */}
            {/* ================================================== */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {t("farmer.dashboard.quick_actions")}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <Link
                  href="/farmer/book-slot"
                  className="p-4 rounded-xl bg-card border border-border shadow-subtle hover:border-primary/50 hover:bg-secondary/40 transition-all flex flex-col items-center text-center space-y-2 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CalendarPlus className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {t("farmer.actions.book_slot")}
                  </span>
                </Link>

                <Link
                  href="/farmer/bookings"
                  className="p-4 rounded-xl bg-card border border-border shadow-subtle hover:border-primary/50 hover:bg-secondary/40 transition-all flex flex-col items-center text-center space-y-2 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {t("farmer.actions.my_bookings")}
                  </span>
                </Link>

                <Link
                  href="/farmer/queue"
                  className="p-4 rounded-xl bg-card border border-border shadow-subtle hover:border-primary/50 hover:bg-secondary/40 transition-all flex flex-col items-center text-center space-y-2 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {t("farmer.actions.live_queue")}
                  </span>
                </Link>

                <Link
                  href="/farmer/procurement"
                  className="p-4 rounded-xl bg-card border border-border shadow-subtle hover:border-primary/50 hover:bg-secondary/40 transition-all flex flex-col items-center text-center space-y-2 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Scale className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {t("farmer.actions.procurement")}
                  </span>
                </Link>

                <Link
                  href="/farmer/payments"
                  className="p-4 rounded-xl bg-card border border-border shadow-subtle hover:border-primary/50 hover:bg-secondary/40 transition-all flex flex-col items-center text-center space-y-2 group col-span-2 sm:col-span-1"
                >
                  <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {t("farmer.actions.payments")}
                  </span>
                </Link>
              </div>
            </div>

            {/* ================================================== */}
            {/* 4. RECENT NOTIFICATIONS & PAYOUT HIGHLIGHTS */}
            {/* ================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notification Alerts Widget */}
              <Card className="border-border shadow-subtle">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <span>{t("farmer.dashboard.recent_alerts")}</span>
                  </CardTitle>
                  <Link href="/farmer/notifications" className="text-xs font-semibold text-primary hover:underline flex items-center">
                    {t("farmer.dashboard.view_all")}
                    <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </Link>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {notifications.slice(0, 3).map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-lg bg-secondary/50 border border-border/80 space-y-1"
                    >
                      <div className="flex justify-between font-bold text-foreground">
                        <span>{notif.title}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">{notif.timestamp}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Payment Summary Tracker Widget */}
              <Card className="border-border shadow-subtle">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <span>{t("farmer.dashboard.msp_payout_summary")}</span>
                  </CardTitle>
                  <Link href="/farmer/payments" className="text-xs font-semibold text-primary hover:underline flex items-center">
                    {t("farmer.dashboard.payout_history")}
                    <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 block">
                        {t("farmer.dashboard.processing_payout")} (Paddy 42 Qtl)
                      </span>
                      <span className="text-lg font-black text-purple-900 dark:text-purple-200">
                        ₹92,526
                      </span>
                    </div>
                    <Badge variant="warning" className="text-[10px] py-0.5">{t("farmer.dashboard.utr_pending")}</Badge>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                        {t("farmer.dashboard.last_credited")} (Wheat 50 Qtl)
                      </span>
                      <span className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                        ₹1,13,750
                      </span>
                    </div>
                    <Badge variant="success" className="text-[10px] py-0.5">{t("farmer.dashboard.credited_sbi")}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </FarmerShell>
      )}
    </ProtectedRoleRoute>
  );
}
