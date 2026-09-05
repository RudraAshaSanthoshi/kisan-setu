"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FarmerShell } from "@/components/farmer/FarmerShell";
import { ProtectedRoleRoute } from "@/components/auth/ProtectedRoleRoute";
import { farmerService } from "@/lib/services/farmerService";
import { BookingRecord } from "@/lib/demo/farmerData";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CalendarPlus,
  MapPin,
  Clock,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Info,
} from "lucide-react";

export default function MyBookingsPage() {
  const { t } = useLanguage();

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "COMPLETED" | "CANCELLED">("UPCOMING");
  const [cancelModalBooking, setCancelModalBooking] = useState<BookingRecord | null>(null);

  useEffect(() => {
    farmerService.getBookings().then(setBookings);
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "UPCOMING") return b.status === "UPCOMING" || b.status === "CHECKED_IN";
    if (activeTab === "COMPLETED") return b.status === "COMPLETED";
    return b.status === "CANCELLED";
  });

  const handleCancelConfirm = async () => {
    if (!cancelModalBooking) return;
    await farmerService.cancelBooking(cancelModalBooking.id);
    setBookings((prev) =>
      prev.map((b) => (b.id === cancelModalBooking.id ? { ...b, status: "CANCELLED" } : b))
    );
    setCancelModalBooking(null);
  };

  return (
    <ProtectedRoleRoute allowedRoles={["FARMER", "ADMIN"]}>
      {(user) => (
        <FarmerShell user={user}>
          <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    {t("farmer.bookings.title")}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {t("farmer.bookings.subtitle")}
                  </p>
                </div>
              </div>

              <Button size="sm" className="font-bold shadow-subtle" asChild>
                <Link href="/farmer/book-slot">
                  <CalendarPlus className="mr-1.5 h-4 w-4" />
                  <span>{t("farmer.bookings.book_new_slot")}</span>
                </Link>
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("UPCOMING")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "UPCOMING"
                    ? "bg-primary text-primary-foreground shadow-subtle"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {t("farmer.bookings.tab_upcoming")} ({bookings.filter((b) => b.status === "UPCOMING" || b.status === "CHECKED_IN").length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("COMPLETED")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "COMPLETED"
                    ? "bg-primary text-primary-foreground shadow-subtle"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {t("farmer.bookings.tab_completed")} ({bookings.filter((b) => b.status === "COMPLETED").length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("CANCELLED")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "CANCELLED"
                    ? "bg-primary text-primary-foreground shadow-subtle"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {t("farmer.bookings.tab_cancelled")} ({bookings.filter((b) => b.status === "CANCELLED").length})
              </button>
            </div>

            {/* Bookings Card List */}
            {filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {filteredBookings.map((b) => (
                  <Card key={b.id} className="border-border shadow-subtle hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base font-bold">{b.tokenNumber}</CardTitle>
                      </div>

                      <Badge
                        variant={
                          b.status === "COMPLETED"
                            ? "success"
                            : b.status === "CANCELLED"
                            ? "destructive"
                            : "warning"
                        }
                        className="text-[11px] font-bold"
                      >
                        {b.status}
                      </Badge>
                    </CardHeader>

                    <CardContent className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-secondary/50 border border-border/80">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">{t("farmer.bookings.crop_quantity")}</span>
                          <span className="font-bold text-foreground">{b.cropName} ({b.quantityQtl} Qtl)</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">{t("farmer.bookings.date_time")}</span>
                          <span className="font-bold text-foreground">{b.bookingDate} • {b.timeSlot}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">{t("farmer.bookings.target_mandi")}</span>
                          <span className="font-bold text-foreground">{b.centreName}</span>
                        </div>
                      </div>
                    </CardContent>

                    {(b.status === "UPCOMING" || b.status === "CHECKED_IN") && (
                      <CardFooter className="justify-end border-t border-border pt-3 gap-2">
                        <Button variant="outline" size="sm" onClick={() => alert(t("farmer.bookings.reschedule_button"))}>
                          {t("farmer.bookings.reschedule_button")}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCancelModalBooking(b)}
                        >
                          {t("farmer.bookings.cancel_button")}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              /* Empty State */
              <Card className="border-dashed border-2 border-border p-8 text-center space-y-3">
                <p className="text-sm font-bold text-muted-foreground">
                  {t("farmer.bookings.no_bookings")}
                </p>
                <Button size="sm" asChild>
                  <Link href="/farmer/book-slot">{t("farmer.bookings.book_slot_now")}</Link>
                </Button>
              </Card>
            )}

            {/* Cancel Confirmation Modal Dialog */}
            {cancelModalBooking && (
              <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-destructive/30 shadow-elevated animate-in zoom-in-95 duration-150">
                  <CardHeader className="space-y-2">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg font-bold">
                      {t("farmer.bookings.cancel_confirm_title")}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t("farmer.bookings.cancel_confirm_desc")} {t("farmer.bookings.token_invalidated", { token: cancelModalBooking.tokenNumber })}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="justify-end gap-2 border-t border-border pt-4">
                    <Button variant="outline" onClick={() => setCancelModalBooking(null)}>
                      {t("farmer.bookings.keep_booking")}
                    </Button>
                    <Button variant="destructive" className="font-bold" onClick={handleCancelConfirm}>
                      {t("farmer.bookings.yes_cancel_slot")}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </FarmerShell>
      )}
    </ProtectedRoleRoute>
  );
}
