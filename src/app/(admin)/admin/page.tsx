"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoleRoute } from "@/components/auth/ProtectedRoleRoute";
import { signOutUser } from "@/lib/auth/authActions";
import { adminService, AdminAnalyticsData } from "@/lib/services/adminService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import {
  ShieldCheck,
  LogOut,
  BarChart3,
  Users,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Scale,
  CreditCard,
  RefreshCw,
  Clock,
  TrendingUp,
  MapPin,
  AlertCircle,
} from "lucide-react";

export default function AdminPortalPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getSystemAnalytics();
      setAnalytics(data);
      setActionError(null);
    } catch (e: any) {
      setActionError(e.message || "Failed loading system analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleLogout = async () => {
    await signOutUser();
    router.push("/login");
  };

  return (
    <ProtectedRoleRoute allowedRoles={["ADMIN"]}>
      {(user) => (
        <div className="min-h-screen bg-background pb-12">
          {/* Header Bar */}
          <div className="bg-card border-b border-border shadow-subtle py-4 px-4 sm:px-6">
            <div className="container max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-300 flex items-center justify-center font-bold shadow-subtle">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-foreground">
                    {t("analytics.system_overview") || "System Oversight & Admin Analytics"}
                  </h1>
                  <p className="text-xs text-muted-foreground font-semibold">
                    District Collectorate • Welcome back, {user.fullName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="info" className="px-3 py-1 font-bold text-xs">
                  Role: ADMIN
                </Badge>
                <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-1.5 h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
            {/* Error Banner */}
            {actionError && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <Card className="border-border p-3.5 text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-center gap-1">
                  <Building2 className="h-3 w-3 text-sky-600" />
                  <span>Active Mandis</span>
                </span>
                <div className="text-2xl font-black text-foreground font-mono">
                  {analytics?.totalActiveCentres || 0}
                </div>
              </Card>

              <Card className="border-border p-3.5 text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-center gap-1">
                  <Users className="h-3 w-3 text-emerald-600" />
                  <span>Farmers</span>
                </span>
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  {analytics?.totalRegisteredFarmers || 0}
                </div>
              </Card>

              <Card className="border-border p-3.5 text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-center gap-1">
                  <CalendarCheck className="h-3 w-3 text-amber-600" />
                  <span>Bookings</span>
                </span>
                <div className="text-2xl font-black text-amber-600 font-mono">
                  {analytics?.totalSlotBookings || 0}
                </div>
              </Card>

              <Card className="border-border p-3.5 text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-purple-600" />
                  <span>Completed</span>
                </span>
                <div className="text-2xl font-black text-purple-600 font-mono">
                  {analytics?.totalCompletedProcurements || 0}
                </div>
              </Card>

              <Card className="border-border p-3.5 text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-center gap-1">
                  <Scale className="h-3 w-3 text-emerald-600" />
                  <span>Quantity (Qtl)</span>
                </span>
                <div className="text-xl font-black text-foreground font-mono">
                  {(analytics?.totalQuantityQuintals || 0).toLocaleString()}
                </div>
              </Card>

              <Card className="border-border p-3.5 text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-center gap-1">
                  <CreditCard className="h-3 w-3 text-emerald-600" />
                  <span>Total Payout</span>
                </span>
                <div className="text-xl font-black text-emerald-700 font-mono">
                  ₹{(analytics?.totalPayoutAmount || 0).toLocaleString()}
                </div>
              </Card>
            </div>

            {/* System Payment Status Breakdown */}
            <Card className="border-border shadow-subtle p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>{t("analytics.payment_status_breakdown") || "Payment Status Breakdown"}</span>
                </h3>
                <Badge variant="success" className="text-[10px] font-bold">System Wide Audit</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-1">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Pending Disbursements
                  </span>
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-200 font-mono">
                    {analytics?.paymentBreakdown.pendingCount || 0} <span className="text-xs font-normal">Txns</span>
                  </div>
                  <p className="text-xs font-bold text-amber-900/80 dark:text-amber-300/80 font-mono">
                    Total: ₹{(analytics?.paymentBreakdown.pendingAmount || 0).toLocaleString()}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-1">
                  <span className="text-xs font-bold text-purple-800 dark:text-purple-300 block flex items-center gap-1">
                    <RefreshCw className="h-3.5 w-3.5" /> Bank Processing
                  </span>
                  <div className="text-2xl font-black text-purple-700 dark:text-purple-200 font-mono">
                    {analytics?.paymentBreakdown.processingCount || 0} <span className="text-xs font-normal">Txns</span>
                  </div>
                  <p className="text-xs font-bold text-purple-900/80 dark:text-purple-300/80 font-mono">
                    Total: ₹{(analytics?.paymentBreakdown.processingAmount || 0).toLocaleString()}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Processed / Credited
                  </span>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-200 font-mono">
                    {analytics?.paymentBreakdown.processedCount || 0} <span className="text-xs font-normal">Txns</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-900/80 dark:text-emerald-300/80 font-mono">
                    Total: ₹{(analytics?.paymentBreakdown.processedAmount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Centre-Wise Performance Comparison Table */}
            <Card className="border-border shadow-elevated overflow-hidden">
              <CardHeader className="border-b border-border bg-secondary/30 py-4 px-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-sky-600" />
                    <span>{t("analytics.centre_performance") || "Centre-Wise Performance Comparison"}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Multi-centre throughput comparison and financial audit
                  </CardDescription>
                </div>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/50 border-b border-border font-bold uppercase text-[10px] text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4">{t("analytics.centre_name") || "Procurement Centre"}</th>
                      <th className="py-3 px-4">{t("analytics.district_state") || "District & State"}</th>
                      <th className="py-3 px-4 text-center">Today&apos;s Bookings</th>
                      <th className="py-3 px-4 text-center">Checked In</th>
                      <th className="py-3 px-4 text-center">Completed</th>
                      <th className="py-3 px-4 text-right">Quantity (Qtl)</th>
                      <th className="py-3 px-4 text-right">{t("analytics.payout_generated") || "Payout Amount"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analytics?.centrePerformance && analytics.centrePerformance.length > 0 ? (
                      analytics.centrePerformance.map((cp) => (
                        <tr key={cp.centreId} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-foreground flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                            <span>{cp.centreName}</span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground font-semibold">
                            {cp.district}, {cp.state}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                            {cp.todayBookings}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-sky-600">
                            {cp.checkedInCount}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">
                            {cp.completedProcurements}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                            {cp.totalQuantityQuintals.toLocaleString()} Qtl
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                            ₹{cp.totalPayoutAmount.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-muted-foreground font-medium">
                          No procurement centres active or found in system database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </ProtectedRoleRoute>
  );
}
