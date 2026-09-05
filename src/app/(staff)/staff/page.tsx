"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoleRoute } from "@/components/auth/ProtectedRoleRoute";
import { signOutUser } from "@/lib/auth/authActions";
import { staffService, StaffDashboardSummary, StaffQueueItem, FarmerSearchResult, CentreAnalyticsData } from "@/lib/services/staffService";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";
import {
  UserCheck,
  LogOut,
  MapPin,
  Megaphone,
  ArrowRight,
  Clock,
  Truck,
  SkipForward,
  RefreshCw,
  QrCode,
  AlertCircle,
  Play,
  CheckCheck,
  Scale,
  FileText,
  CheckCircle2,
  X,
  UserPlus,
  Search,
  Check,
  CalendarPlus,
  ShieldCheck,
  Phone,
  Wheat,
  BarChart3,
  TrendingUp,
  CreditCard,
  Layers,
} from "lucide-react";

export default function StaffPortalPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<StaffDashboardSummary | null>(null);
  const [analyticsData, setAnalyticsData] = useState<CentreAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Manual Check-In Modal / Input state
  const [manualToken, setManualToken] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInNotice, setCheckInNotice] = useState<string | null>(null);

  // Procurement Workflow Modal state
  const [selectedItemForProcurement, setSelectedItemForProcurement] = useState<StaffQueueItem | null>(null);
  const [grossWeightInput, setGrossWeightInput] = useState<string>("4200");
  const [tareWeightInput, setTareWeightInput] = useState<string>("200");
  const [moistureInput, setMoistureInput] = useState<string>("12.5");
  const [qualityGradeInput, setQualityGradeInput] = useState<"GRADE_A" | "FAQ" | "REJECTED">("GRADE_A");
  const [remarksInput, setRemarksInput] = useState<string>("");
  const [isSubmittingProcurement, setIsSubmittingProcurement] = useState(false);
  const [procurementSuccessMsg, setProcurementSuccessMsg] = useState<string | null>(null);

  // Assisted Booking Modal state
  const [isAssistedBookingOpen, setIsAssistedBookingOpen] = useState(false);
  const [farmerSearchQuery, setFarmerSearchQuery] = useState("");
  const [farmerSearchResults, setFarmerSearchResults] = useState<FarmerSearchResult[]>([]);
  const [isSearchingFarmers, setIsSearchingFarmers] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerSearchResult | null>(null);

  const [availableCrops, setAvailableCrops] = useState<{ id: string; nameEn: string; nameHi: string; mspPerQuintal: number }[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>("");
  const [bookingDateInput, setBookingDateInput] = useState<string>(new Date().toISOString().split("T")[0]);
  const [slotTimeInput, setSlotTimeInput] = useState<string>("09:00:00");
  const [quantityInput, setQuantityInput] = useState<string>("40");
  const [vehicleTypeInput, setVehicleTypeInput] = useState<string>("Tractor");
  const [vehicleNumberInput, setVehicleNumberInput] = useState<string>("");

  const [isSubmittingAssistedBooking, setIsSubmittingAssistedBooking] = useState(false);
  const [assistedBookingSuccess, setAssistedBookingSuccess] = useState<any | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await staffService.getDashboardData();
      setDashboard(data);
      if (data?.centreId) {
        const analytics = await staffService.getCentreAnalytics(data.centreId);
        setAnalyticsData(analytics);
      }
      setActionError(null);
    } catch (e: any) {
      setActionError(e.message || "Failed loading staff dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Supabase Realtime Subscription for Live Staff Queue Updates
    let channel: any;
    try {
      const supabase = getSupabaseBrowserClient();
      channel = supabase
        .channel("staff_queue_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "queue_entries" },
          () => {
            fetchDashboard();
          }
        )
        .subscribe();
    } catch {
      // Ignore realtime subscription notice
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

  const handleLogout = async () => {
    await signOutUser();
    router.push("/login");
  };

  const handleCallNext = async () => {
    if (!dashboard) return;
    setIsCallingNext(true);
    setActionError(null);

    const res = await staffService.callNext(dashboard.centreId, "Weighbridge Gate #1");
    setIsCallingNext(false);

    if (!res.success) {
      if (res.error === "NO_WAITING_FARMERS") {
        setActionError("No waiting farmers currently in line.");
      } else {
        setActionError(res.error || "Failed to call next farmer.");
      }
    } else {
      fetchDashboard();
    }
  };

  const handleUpdateStatus = async (queueEntryId: string, newStatus: string) => {
    setActionError(null);
    const res = await staffService.updateQueueStatus(queueEntryId, newStatus, "Weighbridge Gate #1");
    if (!res.success) {
      setActionError(res.error || "Failed to update queue status.");
    } else {
      fetchDashboard();
    }
  };

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim() || !dashboard) return;
    setIsCheckingIn(true);
    setCheckInNotice(null);

    const res = await staffService.checkInByToken(manualToken.trim(), dashboard.centreId);
    setIsCheckingIn(false);

    if (res.success) {
      setCheckInNotice(`Token ${manualToken.trim()} checked in successfully!`);
      setManualToken("");
      fetchDashboard();
    } else {
      setCheckInNotice(`Check-in failed: ${res.error || "Token not found or invalid."}`);
    }
  };

  const handleAdvancePayment = async (paymentId: string, targetStatus: "PROCESSING" | "PROCESSED") => {
    setActionError(null);
    const res = await staffService.updatePaymentStatus(paymentId, targetStatus);
    if (res.success) {
      fetchDashboard();
    } else {
      setActionError(res.error || `Failed to update payment status to ${targetStatus}`);
    }
  };

  const openProcurementModal = (item: StaffQueueItem) => {
    setSelectedItemForProcurement(item);
    const defaultTare = 200;
    const defaultGross = item.quantityQtl * 100 + defaultTare;
    setGrossWeightInput(defaultGross.toString());
    setTareWeightInput(defaultTare.toString());
    setMoistureInput("12.5");
    setQualityGradeInput("GRADE_A");
    setRemarksInput("");
    setProcurementSuccessMsg(null);
    setActionError(null);
  };

  const handleSaveProcurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForProcurement) return;

    const grossKg = parseFloat(grossWeightInput);
    const tareKg = parseFloat(tareWeightInput);
    const moisture = parseFloat(moistureInput);

    if (isNaN(grossKg) || isNaN(tareKg) || grossKg <= tareKg) {
      setActionError("Gross weight must be greater than tare weight.");
      return;
    }
    if (isNaN(moisture) || moisture < 0 || moisture > 30) {
      setActionError("Please enter a valid moisture percentage (0-30%).");
      return;
    }

    setIsSubmittingProcurement(true);
    setActionError(null);

    const res = await staffService.saveProcurementRecord({
      queueEntryId: selectedItemForProcurement.id,
      grossWeightKg: grossKg,
      tareWeightKg: tareKg,
      moisturePercentage: moisture,
      grade: qualityGradeInput,
      remarks: remarksInput.trim() || undefined,
    });

    setIsSubmittingProcurement(false);

    if (res.success) {
      const netQtl = ((grossKg - tareKg) / 100).toFixed(2);
      setProcurementSuccessMsg(`Procurement recorded! Net Weight: ${netQtl} Qtl. Status updated to COMPLETED.`);
      setTimeout(() => {
        setSelectedItemForProcurement(null);
        setProcurementSuccessMsg(null);
        fetchDashboard();
      }, 1500);
    } else {
      setActionError(res.error || "Failed to save procurement record.");
    }
  };

  // Assisted Booking Handlers
  const openAssistedBookingModal = async () => {
    setIsAssistedBookingOpen(true);
    setAssistedBookingSuccess(null);
    setSelectedFarmer(null);
    setFarmerSearchQuery("");
    setActionError(null);

    const crops = await staffService.getCrops();
    setAvailableCrops(crops);
    if (crops.length > 0) {
      setSelectedCropId(crops[0].id);
    }

    setIsSearchingFarmers(true);
    const initialFarmers = await staffService.searchFarmers("");
    setFarmerSearchResults(initialFarmers);
    setIsSearchingFarmers(false);
  };

  const handleFarmerSearch = async (query: string) => {
    setFarmerSearchQuery(query);
    setIsSearchingFarmers(true);
    const results = await staffService.searchFarmers(query);
    setFarmerSearchResults(results);
    setIsSearchingFarmers(false);
  };

  const handleCreateAssistedBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmer || !selectedCropId || !dashboard) {
      setActionError("Please select a registered farmer and crop.");
      return;
    }

    const qty = parseFloat(quantityInput);
    if (isNaN(qty) || qty <= 0) {
      setActionError("Please enter a valid harvest quantity in quintals.");
      return;
    }

    setIsSubmittingAssistedBooking(true);
    setActionError(null);

    const slotEndMap: Record<string, string> = {
      "08:00:00": "09:00:00",
      "09:00:00": "10:00:00",
      "10:00:00": "11:00:00",
      "11:00:00": "12:00:00",
      "12:00:00": "13:00:00",
      "14:00:00": "15:00:00",
      "15:00:00": "16:00:00",
      "16:00:00": "17:00:00",
    };

    const slotEndTime = slotEndMap[slotTimeInput] || "10:00:00";

    const res = await staffService.createAssistedBooking({
      farmerId: selectedFarmer.id,
      cropId: selectedCropId,
      centreId: dashboard.centreId,
      bookingDate: bookingDateInput,
      slotStartTime: slotTimeInput,
      slotEndTime: slotEndTime,
      estimatedQuantityQuintals: qty,
      vehicleType: vehicleTypeInput,
      vehicleNumber: vehicleNumberInput.trim() || undefined,
    });

    setIsSubmittingAssistedBooking(false);

    if (res.success && res.data) {
      const cropObj = availableCrops.find((c) => c.id === selectedCropId);
      setAssistedBookingSuccess({
        ...res.data,
        farmer_name: selectedFarmer.fullName,
        farmer_phone: selectedFarmer.phoneNumber,
        crop_name: cropObj?.nameEn || "Wheat (Gehun)",
        centre_name: dashboard.centreName,
      });
      fetchDashboard();
    } else {
      setActionError(res.error || "Failed to create staff-assisted booking.");
    }
  };

  // Derived live weights & payout for modal
  const grossKg = parseFloat(grossWeightInput) || 0;
  const tareKg = parseFloat(tareWeightInput) || 0;
  const netKg = Math.max(0, grossKg - tareKg);
  const netQtl = Number((netKg / 100).toFixed(2));
  const mspRate = 2275;
  const estimatedPayout = Math.round(netQtl * mspRate);

  return (
    <ProtectedRoleRoute allowedRoles={["CENTRE_STAFF", "ADMIN"]}>
      {(user) => (
        <div className="min-h-screen bg-background pb-12">
          {/* Top Operational Header */}
          <div className="bg-card border-b border-border shadow-subtle py-4 px-4 sm:px-6">
            <div className="container max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 flex items-center justify-center font-bold shadow-subtle">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-foreground">Centre Staff Operations Portal</h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-amber-600" />
                    <span>{dashboard?.centreName || "Khanna Main Mandi"}</span>
                    <span>•</span>
                    <span>Welcome back, {user.fullName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={dashboard?.operatingStatus === "OPEN" ? "success" : "warning"} className="px-3 py-1 font-bold text-xs">
                  {dashboard?.operatingStatus || "OPEN"}
                </Badge>
                <Button variant="outline" size="sm" onClick={fetchDashboard} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-1 h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
            {/* Operational Error Banners */}
            {actionError && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Daily Operational Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <Card className="border-border p-3.5 text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Booked</span>
                <div className="text-2xl font-black text-foreground font-mono">{dashboard?.totalBookingsToday || 0}</div>
              </Card>

              <Card className="border-border p-3.5 text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Checked In</span>
                <div className="text-2xl font-black text-sky-600 font-mono">{dashboard?.totalCheckedIn || 0}</div>
              </Card>

              <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 text-center space-y-1">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">Waiting</span>
                <div className="text-2xl font-black text-amber-600 font-mono">{dashboard?.waitingCount || 0}</div>
              </Card>

              <Card className="border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 text-center space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Called</span>
                <div className="text-2xl font-black text-emerald-600 font-mono">{dashboard?.calledCount || 0}</div>
              </Card>

              <Card className="border-purple-300 bg-purple-50/50 dark:bg-purple-950/20 p-3.5 text-center space-y-1">
                <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase">Processing</span>
                <div className="text-2xl font-black text-purple-600 font-mono">{dashboard?.processingCount || 0}</div>
              </Card>

              <Card className="border-border p-3.5 text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Completed</span>
                <div className="text-2xl font-black text-emerald-700 font-mono">{dashboard?.completedCount || 0}</div>
              </Card>
            </div>

            {/* Operational Analytics & Financial Performance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Procured Quantity & Payout Card */}
              <Card className="border-border p-5 space-y-3 bg-gradient-to-br from-emerald-500/5 via-card to-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-emerald-600" />
                    <span>{t("analytics.today_quantity") || "Total Quantity Procured"}</span>
                  </span>
                  <Badge variant="success" className="text-[10px] font-bold">Real DB Data</Badge>
                </div>
                <div>
                  <div className="text-3xl font-black text-foreground font-mono">
                    {analyticsData?.todayQuantityQuintals || 0} <span className="text-sm font-semibold text-muted-foreground">Qtl</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    {t("analytics.today_payout") || "Total Payout Generated"}: <strong className="text-emerald-700 font-mono">₹{(analyticsData?.todayPayoutAmount || 0).toLocaleString()}</strong>
                  </p>
                </div>
              </Card>

              {/* Payment Status Breakdown Card */}
              <Card className="border-border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span>{t("analytics.payment_status_breakdown") || "Payment Status Breakdown"}</span>
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {t("analytics.pending") || "Pending"}:
                    </span>
                    <span className="font-mono">{analyticsData?.paymentBreakdown.pendingCount || 0} (₹{(analyticsData?.paymentBreakdown.pendingAmount || 0).toLocaleString()})</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" /> {t("analytics.processing") || "Processing"}:
                    </span>
                    <span className="font-mono">{analyticsData?.paymentBreakdown.processingCount || 0} (₹{(analyticsData?.paymentBreakdown.processingAmount || 0).toLocaleString()})</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {t("analytics.processed") || "Processed"}:
                    </span>
                    <span className="font-mono">{analyticsData?.paymentBreakdown.processedCount || 0} (₹{(analyticsData?.paymentBreakdown.processedAmount || 0).toLocaleString()})</span>
                  </div>
                </div>
              </Card>

              {/* Queue Throughput & ETA Card */}
              <Card className="border-border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-sky-600" />
                    <span>{t("analytics.queue_throughput") || "Queue & Throughput Info"}</span>
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted-foreground">{t("analytics.completed_farmers") || "Completed Farmers"}:</span>
                    <span className="font-mono text-emerald-600 font-bold">{analyticsData?.throughputInfo.completedFarmers || 0}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted-foreground">{t("analytics.waiting_farmers") || "Waiting Farmers"}:</span>
                    <span className="font-mono text-amber-600 font-bold">{analyticsData?.throughputInfo.waitingFarmers || 0}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-border pt-1.5">
                    <span className="text-muted-foreground">{t("analytics.avg_wait_time") || "Avg Wait Duration"}:</span>
                    <span className="font-mono text-primary font-bold">~{analyticsData?.throughputInfo.estimatedWaitTimeMins || 15} Mins</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Staff Quick Control Bar: CALL NEXT & Check-in Token */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Call Next Action Card */}
              <Card className="md:col-span-2 border-primary/40 bg-primary/5 shadow-subtle p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <Badge variant="success" className="px-2.5 py-0.5 text-[10px] font-bold">
                    Atomic Call-Next Engine
                  </Badge>
                  <h3 className="text-lg font-black text-foreground">
                    Call Next Waiting Farmer
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Automatically selects the next waiting farmer in arrival sequence for Gate #1.
                  </p>
                </div>

                <Button
                  size="lg"
                  className="font-bold px-8 shadow-card shrink-0 w-full sm:w-auto h-12 text-sm"
                  onClick={handleCallNext}
                  disabled={isCallingNext || (dashboard?.waitingCount || 0) === 0}
                >
                  {isCallingNext ? (
                    <span>Calling Next...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5" />
                      <span>CALL NEXT FARMER</span>
                    </span>
                  )}
                </Button>
              </Card>

              {/* Manual Token Scan/Check-in Card */}
              <Card className="border-border p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-primary" />
                  <span>Scan / Token Check-In</span>
                </h4>

                <form onSubmit={handleManualCheckIn} className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. KS-26032-48291"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="font-mono font-bold text-xs uppercase h-10"
                    />
                    <Button type="submit" size="sm" className="font-bold shrink-0 h-10" disabled={isCheckingIn}>
                      {isCheckingIn ? "Checking..." : "Check In"}
                    </Button>
                  </div>
                </form>

                {checkInNotice && (
                  <p className="text-[11px] font-semibold text-primary">{checkInNotice}</p>
                )}
              </Card>
            </div>

            {/* Assisted Booking Action Banner Card */}
            <Card className="border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-subtle p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] font-bold border-emerald-600 text-emerald-800 dark:text-emerald-300">
                  <UserPlus className="h-3 w-3 mr-1" />
                  <span>{t("assisted_booking.badge") || "Staff-Assisted Scheduling"}</span>
                </Badge>
                <h3 className="text-lg font-black text-foreground">
                  {t("assisted_booking.title") || "Create Slot Booking for Farmer"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("assisted_booking.subtitle") || "Help farmers book procurement slots directly at the Mandi counter."}
                </p>
              </div>

              <Button
                size="lg"
                variant="default"
                className="font-bold px-6 shadow-card shrink-0 w-full sm:w-auto h-11 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={openAssistedBookingModal}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                <span>{t("assisted_booking.tab_title") || "Assisted Booking"}</span>
              </Button>
            </Card>

            {/* Live Queue Operations Table */}
            <Card className="border-border shadow-elevated overflow-hidden">
              <CardHeader className="border-b border-border bg-secondary/30 py-4 px-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    <span>Active Gate & Weighbridge Queue</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Real-time list of checked-in farmers sorted by queue order.
                  </CardDescription>
                </div>

                <Badge variant="outline" className="font-mono text-xs">
                  {dashboard?.queueItems.length || 0} Active Entries
                </Badge>
              </CardHeader>

              <CardContent className="p-0">
                {!dashboard || dashboard.queueItems.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <Clock className="h-10 w-10 text-muted-foreground mx-auto" />
                    <h4 className="text-sm font-bold text-foreground">No Active Queue Entries</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Farmers who check in at the gate scanner will automatically appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-secondary/60 text-muted-foreground font-bold uppercase text-[10px] tracking-wider border-b border-border">
                        <tr>
                          <th className="py-3 px-4"># Pos</th>
                          <th className="py-3 px-4">Token Code</th>
                          <th className="py-3 px-4">Farmer Name</th>
                          <th className="py-3 px-4">Crop & Qtl</th>
                          <th className="py-3 px-4">Check-In Time</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-border">
                        {dashboard.queueItems.map((item) => {
                          const isCalled = item.status === "CALLED";
                          const isProcessing = item.status === "PROCESSING" || item.status === "AT_COUNTER";
                          const isCompleted = item.status === "COMPLETED";

                          return (
                            <tr
                              key={item.id}
                              className={`transition-colors ${
                                isCalled
                                  ? "bg-emerald-50/70 dark:bg-emerald-950/40 font-semibold"
                                  : isProcessing
                                  ? "bg-purple-50/70 dark:bg-purple-950/40 font-semibold"
                                  : "hover:bg-secondary/20"
                              }`}
                            >
                              <td className="py-3.5 px-4 font-mono font-black text-sm text-foreground">
                                #{item.queueNumber}
                              </td>

                              <td className="py-3.5 px-4 font-mono font-bold text-primary">
                                {item.tokenCode}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-foreground">{item.farmerName}</div>
                                <div className="text-[10px] text-muted-foreground">{item.farmerPhone}</div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-foreground">{item.cropName}</div>
                                <div className="text-[10px] text-muted-foreground">{item.quantityQtl} Qtl</div>
                              </td>

                              <td className="py-3.5 px-4 text-muted-foreground font-medium">
                                {item.checkInTime}
                              </td>

                              <td className="py-3.5 px-4">
                                <Badge
                                  variant={
                                    isCompleted
                                      ? "success"
                                      : isCalled
                                      ? "warning"
                                      : isProcessing
                                      ? "secondary"
                                      : item.status === "SKIPPED"
                                      ? "destructive"
                                      : "outline"
                                  }
                                  className="text-[10px] font-bold"
                                >
                                  {item.status}
                                </Badge>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {item.status === "WAITING" && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-8 text-[11px] font-bold px-3"
                                      onClick={() => handleUpdateStatus(item.id, "CALLED")}
                                    >
                                      <Megaphone className="h-3 w-3 mr-1" />
                                      <span>Call</span>
                                    </Button>
                                  )}

                                  {item.status === "CALLED" && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-8 text-[11px] font-bold px-3 bg-purple-600 hover:bg-purple-700 text-white"
                                      onClick={() => handleUpdateStatus(item.id, "AT_COUNTER")}
                                    >
                                      <ArrowRight className="h-3 w-3 mr-1" />
                                      <span>To Counter</span>
                                    </Button>
                                  )}

                                  {item.status === "AT_COUNTER" && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-8 text-[11px] font-bold px-3 bg-purple-700 hover:bg-purple-800 text-white"
                                      onClick={() => handleUpdateStatus(item.id, "PROCESSING")}
                                    >
                                      <Play className="h-3 w-3 mr-1" />
                                      <span>Start</span>
                                    </Button>
                                  )}

                                  {!isCompleted && item.status !== "SKIPPED" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-[11px] font-bold px-2.5 border-amber-500 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
                                      onClick={() => openProcurementModal(item)}
                                    >
                                      <Scale className="h-3.5 w-3.5 mr-1 text-amber-600" />
                                      <span>Procure</span>
                                    </Button>
                                  )}

                                  {isCompleted && item.paymentId && (
                                    <>
                                      {item.paymentStatus === "PENDING" && (
                                        <Button
                                          size="sm"
                                          className="h-8 text-[11px] font-bold px-3 bg-amber-600 hover:bg-amber-700 text-white"
                                          onClick={() => handleAdvancePayment(item.paymentId!, "PROCESSING")}
                                        >
                                          <span>Mark Processing</span>
                                        </Button>
                                      )}
                                      {item.paymentStatus === "PROCESSING" && (
                                        <Button
                                          size="sm"
                                          className="h-8 text-[11px] font-bold px-3 bg-purple-600 hover:bg-purple-700 text-white"
                                          onClick={() => handleAdvancePayment(item.paymentId!, "PROCESSED")}
                                        >
                                          <span>Mark Processed</span>
                                        </Button>
                                      )}
                                      {(item.paymentStatus === "PROCESSED" || item.paymentStatus === "DISBURSED") && (
                                        <Badge variant="success" className="text-[10px] font-extrabold px-2.5 py-1">
                                          Paid ₹{item.totalPayoutAmount?.toLocaleString() || ""} ✓
                                        </Badge>
                                      )}
                                    </>
                                  )}

                                  {!isCompleted && item.status !== "SKIPPED" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 text-[11px] text-muted-foreground hover:text-destructive px-2"
                                      onClick={() => {
                                        if (confirm(`Skip farmer ${item.farmerName} (${item.tokenCode})?`)) {
                                          handleUpdateStatus(item.id, "SKIPPED");
                                        }
                                      }}
                                    >
                                      <SkipForward className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Complete Procurement & Weighbridge Processing Modal Overlay */}
          {selectedItemForProcurement && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
              <Card className="w-full max-w-2xl border-border shadow-elevated overflow-hidden bg-card">
                <CardHeader className="bg-secondary/40 border-b border-border py-4 px-6 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                      <Scale className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black text-foreground">
                        Procurement & Weighbridge Workflow
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Token: <strong className="font-mono text-primary">{selectedItemForProcurement.tokenCode}</strong> • {selectedItemForProcurement.farmerName}
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setSelectedItemForProcurement(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>

                <form onSubmit={handleSaveProcurement}>
                  <CardContent className="p-6 space-y-5 text-xs">
                    {/* Lifecycle Progress Bar */}
                    <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Farmer Lifecycle Progress
                      </span>
                      <div className="grid grid-cols-6 gap-1 text-center font-bold text-[10px]">
                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Booked ✓</div>
                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Arrived ✓</div>
                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Token Called ✓</div>
                        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-400">Weighing ⚡</div>
                        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-400">Quality Check ⚡</div>
                        <div className="p-1.5 rounded-lg bg-secondary text-muted-foreground">Completed</div>
                      </div>
                    </div>

                    {procurementSuccessMsg && (
                      <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span>{procurementSuccessMsg}</span>
                      </div>
                    )}

                    {/* Produce & Crop Summary Header */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-background border border-border">
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Crop Type</span>
                        <span className="font-extrabold text-foreground text-sm">{selectedItemForProcurement.cropName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Est. Booking Quantity</span>
                        <span className="font-extrabold text-foreground text-sm">{selectedItemForProcurement.quantityQtl} Quintals</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Govt MSP Rate</span>
                        <span className="font-extrabold text-emerald-600 text-sm">₹{mspRate} / Qtl</span>
                      </div>
                    </div>

                    {/* Weighbridge Section */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground flex items-center gap-1.5">
                        <Scale className="h-4 w-4 text-primary" />
                        <span>1. Weighbridge Measurements (kg)</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground">Gross Weight (kg)</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={grossWeightInput}
                            onChange={(e) => setGrossWeightInput(e.target.value)}
                            className="font-mono font-bold text-sm h-10"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground">Tare Weight (kg)</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={tareWeightInput}
                            onChange={(e) => setTareWeightInput(e.target.value)}
                            className="font-mono font-bold text-sm h-10"
                            required
                          />
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 space-y-0.5">
                          <span className="text-emerald-800 dark:text-emerald-300 text-[10px] font-bold block">Calculated Net Produce</span>
                          <span className="font-black text-emerald-900 dark:text-emerald-200 text-base">{netQtl} Quintals</span>
                          <span className="text-[9px] text-emerald-700 dark:text-emerald-400 block">({netKg} kg)</span>
                        </div>
                      </div>
                    </div>

                    {/* Quality Inspection Section */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-primary" />
                        <span>2. Quality Check & Inspection</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground">Moisture Content (%)</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={moistureInput}
                            onChange={(e) => setMoistureInput(e.target.value)}
                            className="font-mono font-bold text-sm h-10"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground">Quality Grade Classification</label>
                          <select
                            value={qualityGradeInput}
                            onChange={(e) => setQualityGradeInput(e.target.value as any)}
                            className="w-full h-10 px-3 rounded-xl border border-input bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="GRADE_A">Grade A (Super Fine - Full MSP)</option>
                            <option value="FAQ">FAQ (Fair Average Quality - Standard)</option>
                            <option value="REJECTED">Rejected (Non-compliant)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground">Staff Remarks / Observations (Optional)</label>
                        <Input
                          placeholder="e.g. Moisture within 14% limit, clean grain sample"
                          value={remarksInput}
                          onChange={(e) => setRemarksInput(e.target.value)}
                          className="text-xs h-10"
                        />
                      </div>
                    </div>

                    {/* Total Payout Summary Box */}
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">Total Calculated Payout</span>
                        <span className="text-[10px] text-purple-700 dark:text-purple-300">
                          {netQtl} Quintals × ₹{mspRate} MSP = Total Amount
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-black text-purple-800 dark:text-purple-300 font-mono">
                          ₹{estimatedPayout.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <div className="bg-secondary/40 border-t border-border p-4 px-6 flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedItemForProcurement(null)}
                      disabled={isSubmittingProcurement}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      size="sm"
                      className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                      disabled={isSubmittingProcurement}
                    >
                      {isSubmittingProcurement ? (
                        <span>Saving Record...</span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Complete Procurement & Issue Slip</span>
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
          {/* Assisted Booking Modal Dialog */}
          {isAssistedBookingOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
              <Card className="w-full max-w-2xl bg-card border-border shadow-modal overflow-hidden max-h-[90vh] flex flex-col">
                <CardHeader className="bg-emerald-700 text-white p-5 flex flex-row items-center justify-between shrink-0">
                  <div>
                    <CardTitle className="text-lg font-black flex items-center gap-2 text-white">
                      <UserPlus className="h-5 w-5 text-emerald-200" />
                      <span>{t("assisted_booking.title") || "Create Slot Booking for Farmer"}</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-emerald-100 font-medium">
                      {dashboard?.centreName} • Mandi Staff Assisted Portal
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAssistedBookingOpen(false)}
                    className="text-white hover:bg-emerald-800 rounded-full h-8 w-8"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </CardHeader>

                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                  {assistedBookingSuccess ? (
                    // Assisted Booking Confirmation Voucher Card
                    <div className="space-y-5 animate-in zoom-in-95">
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-2">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                        <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-200">
                          {t("assisted_booking.success_title") || "Assisted Booking Confirmed!"}
                        </h3>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                          {t("assisted_booking.notif_sent_message") || "In-app notification sent to farmer's mobile account."}
                        </p>
                      </div>

                      {/* Token Ticket Card */}
                      <Card className="border-2 border-dashed border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 p-5 space-y-4 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {t("assisted_booking.token_label") || "Digital Token Code"}
                        </span>
                        <div className="text-3xl font-black text-emerald-700 font-mono tracking-wide">
                          {assistedBookingSuccess.token_code}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 text-left text-xs border-t border-emerald-200 dark:border-emerald-800">
                          <div>
                            <span className="text-muted-foreground font-semibold block">{t("assisted_booking.farmer_name_label") || "Farmer Name"}:</span>
                            <span className="font-bold text-foreground">{assistedBookingSuccess.farmer_name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-semibold block">{t("assisted_booking.farmer_phone_label") || "Farmer Phone"}:</span>
                            <span className="font-mono font-bold text-foreground">{assistedBookingSuccess.farmer_phone}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-semibold block">{t("assisted_booking.crop_label") || "Selected Crop"}:</span>
                            <span className="font-bold text-foreground">{assistedBookingSuccess.crop_name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-semibold block">{t("assisted_booking.date_time_label") || "Date & Time"}:</span>
                            <span className="font-bold text-foreground">{assistedBookingSuccess.booking_date} ({assistedBookingSuccess.slot_start_time?.slice(0, 5)})</span>
                          </div>
                        </div>
                      </Card>

                      <Button
                        onClick={() => {
                          setAssistedBookingSuccess(null);
                          setSelectedFarmer(null);
                          setFarmerSearchQuery("");
                        }}
                        className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                      >
                        {t("assisted_booking.book_another") || "Create Another Assisted Booking"}
                      </Button>
                    </div>
                  ) : (
                    // Assisted Booking Entry Form
                    <form onSubmit={handleCreateAssistedBookingSubmit} className="space-y-6">
                      {/* Step 1: Farmer Lookup */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Search className="h-4 w-4 text-emerald-600" />
                          <span>1. {t("assisted_booking.search_farmer_label") || "Search Registered Farmer"}</span>
                        </h4>

                        <div className="relative">
                          <Input
                            placeholder={t("assisted_booking.search_farmer_placeholder") || "Enter farmer phone number or name..."}
                            value={farmerSearchQuery}
                            onChange={(e) => handleFarmerSearch(e.target.value)}
                            className="font-medium text-xs h-10 pr-9"
                          />
                          <Search className="h-4 w-4 text-muted-foreground absolute right-3 top-3" />
                        </div>

                        {/* Search Results List */}
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                          {isSearchingFarmers ? (
                            <p className="text-xs text-muted-foreground py-2 text-center">{t("assisted_booking.searching") || "Searching farmers..."}</p>
                          ) : farmerSearchResults.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2 text-center">{t("assisted_booking.no_farmers_found") || "No registered farmers found matching query."}</p>
                          ) : (
                            farmerSearchResults.map((farmer) => {
                              const isSelected = selectedFarmer?.id === farmer.id;
                              return (
                                <div
                                  key={farmer.id}
                                  onClick={() => setSelectedFarmer(farmer)}
                                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                                    isSelected
                                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 font-bold"
                                      : "bg-card border-border hover:bg-secondary/50"
                                  }`}
                                >
                                  <div>
                                    <span className="font-bold text-foreground block">{farmer.fullName}</span>
                                    <span className="text-muted-foreground font-mono text-[11px]">{farmer.phoneNumber} {farmer.district ? `• ${farmer.district}` : ""}</span>
                                  </div>

                                  {isSelected && (
                                    <Badge variant="success" className="flex items-center gap-1 text-[10px] px-2 py-0.5">
                                      <Check className="h-3 w-3" />
                                      <span>Selected</span>
                                    </Badge>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Selected Farmer Badge */}
                      {selectedFarmer && (
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">Selected Farmer</span>
                            <span className="font-bold text-foreground">{selectedFarmer.fullName} ({selectedFarmer.phoneNumber})</span>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                      )}

                      {/* Step 2: Crop & Slot Parameters */}
                      <div className="space-y-4 border-t border-border pt-4">
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Wheat className="h-4 w-4 text-emerald-600" />
                          <span>2. Select Crop & Slot Details</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground">{t("assisted_booking.select_crop_label") || "Select Crop"}</label>
                            <select
                              value={selectedCropId}
                              onChange={(e) => setSelectedCropId(e.target.value)}
                              className="w-full h-10 px-3 rounded-xl border border-input bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              {availableCrops.map((crop) => (
                                <option key={crop.id} value={crop.id}>
                                  {crop.nameEn} (₹{crop.mspPerQuintal}/Qtl)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground">{t("assisted_booking.select_date_label") || "Booking Date"}</label>
                            <Input
                              type="date"
                              value={bookingDateInput}
                              onChange={(e) => setBookingDateInput(e.target.value)}
                              className="font-bold text-xs h-10"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground">{t("assisted_booking.select_time_label") || "Time Slot"}</label>
                            <select
                              value={slotTimeInput}
                              onChange={(e) => setSlotTimeInput(e.target.value)}
                              className="w-full h-10 px-3 rounded-xl border border-input bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              <option value="08:00:00">08:00 AM - 09:00 AM</option>
                              <option value="09:00:00">09:00 AM - 10:00 AM</option>
                              <option value="10:00:00">10:00 AM - 11:00 AM</option>
                              <option value="11:00:00">11:00 AM - 12:00 PM</option>
                              <option value="12:00:00">12:00 PM - 01:00 PM</option>
                              <option value="14:00:00">02:00 PM - 03:00 PM</option>
                              <option value="15:00:00">03:00 PM - 04:00 PM</option>
                              <option value="16:00:00">04:00 PM - 05:00 PM</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground">{t("assisted_booking.quantity_label") || "Estimated Quantity (Quintals)"}</label>
                            <Input
                              type="number"
                              value={quantityInput}
                              onChange={(e) => setQuantityInput(e.target.value)}
                              className="font-mono font-bold text-xs h-10"
                              required
                            />
                          </div>
                        </div>

                        {/* Quick Presets for Quantity */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground">Quick Quantity:</span>
                          {[20, 40, 60, 80].map((q) => (
                            <Button
                              key={q}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setQuantityInput(q.toString())}
                              className="h-7 text-[10px] font-bold px-2.5"
                            >
                              {q} Qtl
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Modal Action Buttons */}
                      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAssistedBookingOpen(false)}
                          disabled={isSubmittingAssistedBooking}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-10"
                          disabled={isSubmittingAssistedBooking || !selectedFarmer}
                        >
                          {isSubmittingAssistedBooking ? (
                            <span>Creating Booking...</span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <UserPlus className="h-4 w-4" />
                              <span>{t("assisted_booking.submit_button") || "Confirm & Book Slot for Farmer"}</span>
                            </span>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </ProtectedRoleRoute>
  );
}


