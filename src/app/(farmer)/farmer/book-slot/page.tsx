"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FarmerShell } from "@/components/farmer/FarmerShell";
import { ProtectedRoleRoute } from "@/components/auth/ProtectedRoleRoute";
import { farmerService } from "@/lib/services/farmerService";
import { CropOption, ProcurementCentre, TimeSlot, BookingRecord } from "@/lib/demo/farmerData";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CalendarPlus,
  Sprout,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  QrCode,
  Calendar,
  ChevronRight,
  Info,
  Check,
} from "lucide-react";
import { VoiceButton } from "@/components/shared/VoiceButton";

function getDynamicBookingDates(): string[] {
  const dates: string[] = ["Today", "Tomorrow"];
  const now = new Date();

  const d2 = new Date(now);
  d2.setDate(now.getDate() + 2);
  const d2Str = `${d2.getDate()} ${d2.toLocaleString("en-US", { month: "short" })} ${d2.getFullYear()}`;

  const d3 = new Date(now);
  d3.setDate(now.getDate() + 3);
  const d3Str = `${d3.getDate()} ${d3.toLocaleString("en-US", { month: "short" })} ${d3.getFullYear()}`;

  dates.push(d2Str, d3Str);
  return dates;
}

export default function BookSlotPage() {
  const { t } = useLanguage();
  const router = useRouter();

  // Wizard Step state (1 to 7)
  const [step, setStep] = useState(1);

  // Loaded demo datasets
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [centres, setCentres] = useState<ProcurementCentre[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  // Selected Booking parameters
  const [selectedCrop, setSelectedCrop] = useState<CropOption | null>(null);
  const [quantityQtl, setQuantityQtl] = useState<number>(40);
  const [selectedCentre, setSelectedCentre] = useState<ProcurementCentre | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("Today");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Confirmed booking state
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function initData() {
      const [cList, mList] = await Promise.all([
        farmerService.getCrops(),
        farmerService.getCentres(),
      ]);
      setCrops(cList);
      setCentres(mList);
      if (cList.length > 0) setSelectedCrop(cList[0]);
      if (mList.length > 0) setSelectedCentre(mList[0]);
    }
    initData();
  }, []);

  useEffect(() => {
    if (selectedCentre) {
      farmerService.getTimeSlots(selectedCentre.id, selectedDate).then((sList) => {
        setSlots(sList);
        if (sList.length > 0 && !selectedSlot) {
          setSelectedSlot(sList[0]);
        }
      });
    }
  }, [selectedCentre, selectedDate]);

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1 && step < 7) setStep(step - 1);
  };

  const [bookingErrorMsg, setBookingErrorMsg] = useState<string | null>(null);

  const handleConfirmBooking = async () => {
    if (!selectedCrop || !selectedCentre || !selectedSlot) return;
    setIsSubmitting(true);
    setBookingErrorMsg(null);

    try {
      const result = await farmerService.createBooking({
        cropId: selectedCrop.id,
        cropName: selectedCrop.name,
        quantityQtl: Number(quantityQtl),
        centreId: selectedCentre.id,
        centreName: selectedCentre.name,
        bookingDate: selectedDate,
        timeSlot: selectedSlot.timeRange,
        slotId: selectedSlot.id,
      });

      setConfirmedBooking(result);
      setIsSubmitting(false);
      setStep(7); // Jump to Confirmation state
    } catch (e: any) {
      setIsSubmitting(false);
      if (e.message === "SLOT_FULL") {
        setBookingErrorMsg(t("farmer.booking_wizard.error_slot_full"));
      } else if (e.message === "DUPLICATE_BOOKING") {
        setBookingErrorMsg(t("farmer.booking_wizard.error_duplicate_booking"));
      } else if (e.message === "UNAUTHENTICATED") {
        setBookingErrorMsg(t("farmer.booking_wizard.error_unauthenticated"));
      } else {
        setBookingErrorMsg(t("farmer.booking_wizard.error_generic"));
      }
    }
  };

  return (
    <ProtectedRoleRoute allowedRoles={["FARMER", "ADMIN"]}>
      {(user) => (
        <FarmerShell user={user}>
          <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <CalendarPlus className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    {t("farmer.booking_wizard.title")}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {t("farmer.booking_wizard.step_counter", {
                      step,
                      label: step === 7 ? t("farmer.booking_wizard.step_confirmation") : t("farmer.booking_wizard.step_interactive"),
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <VoiceButton text={`${t("farmer.booking_wizard.title")}. ${t("farmer.booking_wizard.select_crop_title")}`} />
                {step > 1 && step < 7 && (
                  <Button variant="outline" size="sm" onClick={handleBack}>
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    <span>{t("farmer.booking_wizard.back_button")}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Step Progress Bar */}
            {step < 7 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                  <span className="text-primary font-extrabold">
                    {t("farmer.booking_wizard.step_counter", {
                      step,
                      label:
                        step === 1 ? t("farmer.booking_wizard.step1") :
                        step === 2 ? t("farmer.booking_wizard.step2") :
                        step === 3 ? t("farmer.booking_wizard.step3") :
                        step === 4 ? t("farmer.booking_wizard.step4") :
                        step === 5 ? t("farmer.booking_wizard.step5") :
                        t("farmer.booking_wizard.step6")
                    })}
                  </span>
                  <span>{Math.round((step / 6) * 100)}% {t("farmer.booking_wizard.completed")}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${(step / 6) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* ================================================== */}
            {/* STEP 1: SELECT PRODUCE */}
            {/* ================================================== */}
            {step === 1 && (
              <Card className="border-border shadow-elevated">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">
                    {t("farmer.booking_wizard.select_crop_title")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("farmer.booking_wizard.select_crop_desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {crops.map((crop) => (
                      <div
                        key={crop.id}
                        onClick={() => setSelectedCrop(crop)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          selectedCrop?.id === crop.id
                            ? "border-primary bg-primary/5 shadow-subtle"
                            : "border-border hover:border-primary/40 bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Sprout className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">{crop.name}</h4>
                            <p className="text-xs text-muted-foreground">{crop.localName}</p>
                            <p className="text-[11px] font-semibold text-emerald-600">
                              {t("farmer.booking_wizard.msp_label", { rate: crop.mspRatePerQtl })}
                            </p>
                          </div>
                        </div>

                        {selectedCrop?.id === crop.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="justify-end border-t border-border pt-4">
                  <Button size="lg" className="font-bold px-8" onClick={handleNext} disabled={!selectedCrop}>
                    <span>{t("farmer.booking_wizard.next_quantity")}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* ================================================== */}
            {/* STEP 2: QUANTITY */}
            {/* ================================================== */}
            {step === 2 && (
              <Card className="border-border shadow-elevated">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">
                    {t("farmer.booking_wizard.quantity_title")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("farmer.booking_wizard.quantity_desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-bold">
                      {t("farmer.booking_wizard.quantity_label")}
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max="500"
                        value={quantityQtl}
                        onChange={(e) => setQuantityQtl(Number(e.target.value))}
                        className="text-lg font-black h-12 text-center"
                      />
                      <span className="text-sm font-bold text-muted-foreground">{t("farmer.booking_wizard.quintals_unit")}</span>
                    </div>
                  </div>

                  {/* Quick Quantity Presets */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted-foreground block">{t("farmer.booking_wizard.quick_add_presets")}</span>
                    <div className="flex flex-wrap gap-2">
                      {[10, 25, 40, 50, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setQuantityQtl(val)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                            quantityQtl === val
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary hover:bg-secondary/80 border-border text-foreground"
                          }`}
                        >
                          {val} {t("farmer.booking_wizard.qtl_unit")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedCrop && (
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-900 dark:text-purple-200">
                        {t("farmer.booking_wizard.estimated_msp_payout", { rate: selectedCrop.mspRatePerQtl })}
                      </span>
                      <span className="text-base font-black text-purple-700 dark:text-purple-300">
                        ₹{(quantityQtl * selectedCrop.mspRatePerQtl).toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="justify-between border-t border-border pt-4">
                  <Button variant="outline" onClick={handleBack}>
                    {t("farmer.booking_wizard.back_button")}
                  </Button>
                  <Button size="lg" className="font-bold px-8" onClick={handleNext} disabled={quantityQtl <= 0}>
                    <span>{t("farmer.booking_wizard.next_choose_centre")}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* ================================================== */}
            {/* STEP 3: PROCUREMENT CENTRE */}
            {/* ================================================== */}
            {step === 3 && (
              <Card className="border-border shadow-elevated">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">
                    {t("farmer.booking_wizard.select_centre_title")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("farmer.booking_wizard.select_centre_desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {centres.map((centre) => (
                    <div
                      key={centre.id}
                      onClick={() => setSelectedCentre(centre)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        selectedCentre?.id === centre.id
                          ? "border-primary bg-primary/5 shadow-subtle"
                          : "border-border hover:border-primary/40 bg-card"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{centre.name}</h4>
                          <Badge variant={centre.status === "OPEN" ? "success" : "warning"} className="text-[10px] py-0">
                            {centre.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{centre.address}</p>
                        <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            {t("farmer.booking_wizard.distance_away", { km: centre.distanceKm })}
                          </span>
                          <span>•</span>
                          <span>{t("farmer.booking_wizard.slots_available", { count: centre.availableSlotsToday })}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-muted-foreground block">
                          {t("farmer.booking_wizard.expected_wait")}
                        </span>
                        <span className="text-sm font-black text-foreground">
                          {t("farmer.booking_wizard.expected_wait_val", { mins: centre.expectedWaitMins })}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="justify-between border-t border-border pt-4">
                  <Button variant="outline" onClick={handleBack}>
                    {t("farmer.booking_wizard.back_button")}
                  </Button>
                  <Button size="lg" className="font-bold px-8" onClick={handleNext} disabled={!selectedCentre}>
                    <span>{t("farmer.booking_wizard.next_date_time")}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* ================================================== */}
            {/* STEP 4 & 5: DATE & TIME SLOT SELECTION */}
            {/* ================================================== */}
            {(step === 4 || step === 5) && (
              <Card className="border-border shadow-elevated">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">
                    {t("farmer.booking_wizard.date_time_title")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("farmer.booking_wizard.date_time_desc", { centre: selectedCentre?.name || "" })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date Selector */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t("farmer.booking_wizard.select_date_label")}
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {getDynamicBookingDates().map((dStr) => (
                        <button
                          key={dStr}
                          type="button"
                          onClick={() => setSelectedDate(dStr)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                            selectedDate === dStr
                              ? "bg-primary text-primary-foreground border-primary shadow-subtle"
                              : "bg-card border-border hover:border-primary/40 text-foreground"
                          }`}
                        >
                          {dStr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slot Grid */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t("farmer.booking_wizard.select_slot_label")} ({selectedDate})
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {slots.map((s) => {
                        const isFull = s.status === "FULL";
                        const isSelected = selectedSlot?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => setSelectedSlot(s)}
                            className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                              isFull
                                ? "opacity-50 cursor-not-allowed bg-secondary/30 border-border"
                                : isSelected
                                ? "border-primary bg-primary/5 shadow-subtle"
                                : "border-border hover:border-primary/40 bg-card"
                            }`}
                          >
                            <div>
                              <span className="text-sm font-black text-foreground block">
                                {s.timeRange}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {t("farmer.booking_wizard.slots_remaining", { count: s.remainingCapacity })}
                              </span>
                            </div>

                            <Badge
                              variant={
                                isFull ? "destructive" : s.status === "LIMITED" ? "warning" : "success"
                              }
                              className="text-[10px]"
                            >
                              {s.status}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between border-t border-border pt-4">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    {t("farmer.booking_wizard.back_button")}
                  </Button>
                  <Button
                    size="lg"
                    className="font-bold px-8"
                    onClick={() => setStep(6)}
                    disabled={!selectedSlot || selectedSlot.status === "FULL"}
                  >
                    <span>{t("farmer.booking_wizard.review_booking")}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* ================================================== */}
            {/* STEP 6: REVIEW BOOKING */}
            {/* ================================================== */}
            {step === 6 && (
              <Card className="border-border shadow-elevated">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">
                    {t("farmer.booking_wizard.review_title")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("farmer.booking_wizard.review_desc")}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 text-xs">
                  {bookingErrorMsg && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive font-semibold flex items-start gap-2 animate-in fade-in">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{bookingErrorMsg}</span>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                    <div className="flex justify-between py-1.5 border-b border-border/60">
                      <span className="text-muted-foreground font-medium">{t("farmer.booking_wizard.crop_label")}</span>
                      <span className="font-bold text-foreground">{selectedCrop?.name}</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-border/60">
                      <span className="text-muted-foreground font-medium">{t("farmer.booking_wizard.quantity_qtl_label")}</span>
                      <span className="font-bold text-foreground">{quantityQtl} {t("farmer.booking_wizard.quintals_unit")}</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-border/60">
                      <span className="text-muted-foreground font-medium">{t("farmer.booking_wizard.target_mandi_label")}</span>
                      <span className="font-bold text-foreground">{selectedCentre?.name}</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-border/60">
                      <span className="text-muted-foreground font-medium">{t("farmer.booking_wizard.date_slot_label")}</span>
                      <span className="font-bold text-foreground">{selectedDate} ({selectedSlot?.timeRange})</span>
                    </div>

                    <div className="flex justify-between py-1.5">
                      <span className="text-muted-foreground font-medium">{t("farmer.booking_wizard.estimated_value_label")}</span>
                      <span className="font-black text-emerald-600 text-sm">
                        ₹{selectedCrop ? (quantityQtl * selectedCrop.mspRatePerQtl).toLocaleString() : 0}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      {t("farmer.booking_wizard.checkin_note")}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="justify-between border-t border-border pt-4">
                  <Button variant="outline" onClick={() => setStep(5)}>
                    {t("farmer.booking_wizard.back_button")}
                  </Button>
                  <Button
                    size="lg"
                    className="font-bold px-8 shadow-card"
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span>{t("farmer.booking_wizard.generating_token")}</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>{t("farmer.booking_wizard.confirm_booking_button")}</span>
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* ================================================== */}
            {/* STEP 7: CONFIRMATION STATE */}
            {/* ================================================== */}
            {step === 7 && confirmedBooking && (
              <Card className="border-emerald-300 dark:border-emerald-800 shadow-elevated bg-card text-center space-y-6 p-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-subtle animate-in zoom-in duration-300">
                  <CheckCircle2 className="h-10 w-10" />
                </div>

                <div className="space-y-1">
                  <Badge variant="success" className="px-3 py-1 font-bold text-xs">
                    {t("farmer.booking_wizard.confirmed_badge")}
                  </Badge>
                  <h2 className="text-2xl font-black text-foreground pt-2">
                    {t("farmer.booking_wizard.confirmed_title")}
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {t("farmer.booking_wizard.confirmed_desc")}
                  </p>
                </div>

                {/* Digital Token Box */}
                <div className="max-w-md mx-auto p-5 rounded-2xl bg-secondary/60 border border-border space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      {t("farmer.booking_wizard.token_label")}
                    </span>
                    <span className="text-lg font-black text-primary">
                      {confirmedBooking.tokenNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-left text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">{t("farmer.bookings.crop_quantity")}</span>
                      <span className="font-bold text-foreground">{confirmedBooking.cropName} ({confirmedBooking.quantityQtl} Qtl)</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">{t("farmer.bookings.date_time")}</span>
                      <span className="font-bold text-foreground">{confirmedBooking.bookingDate} ({confirmedBooking.timeSlot})</span>
                    </div>
                  </div>

                  <div className="text-left text-xs pt-1 border-t border-border/60">
                    <span className="text-muted-foreground block text-[10px]">{t("farmer.bookings.target_mandi")}</span>
                    <span className="font-bold text-foreground">{confirmedBooking.centreName}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button size="lg" className="w-full sm:w-auto font-bold shadow-card" asChild>
                    <Link href="/farmer/bookings">
                      {t("farmer.booking_wizard.view_booking")}
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold" onClick={() => alert(t("farmer.booking_wizard.calendar_alert"))}>
                    {t("farmer.booking_wizard.add_calendar")}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </FarmerShell>
      )}
    </ProtectedRoleRoute>
  );
}
