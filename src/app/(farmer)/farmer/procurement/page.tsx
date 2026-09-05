"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FarmerShell } from "@/components/farmer/FarmerShell";
import { ProtectedRoleRoute } from "@/components/auth/ProtectedRoleRoute";
import { farmerService } from "@/lib/services/farmerService";
import { WeighbridgeProcurement } from "@/lib/demo/farmerData";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Scale,
  CheckCircle2,
  Clock,
  QrCode,
  MapPin,
  FileCheck,
  CreditCard,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { VoiceButton } from "@/components/shared/VoiceButton";

export default function ProcurementPage() {
  const { t } = useLanguage();

  const [procurements, setProcurements] = useState<WeighbridgeProcurement[]>([]);

  useEffect(() => {
    farmerService.getProcurements().then(setProcurements);
  }, []);

  const stages = [
    { key: "BOOKED", label: t("farmer.procurement.stage_booked") },
    { key: "ARRIVED", label: t("farmer.procurement.stage_arrived") },
    { key: "WEIGHED", label: t("farmer.procurement.stage_weighed") },
    { key: "QUALITY", label: t("farmer.procurement.stage_quality") },
    { key: "COMPLETED", label: t("farmer.procurement.stage_completed") },
    { key: "PAYMENT", label: t("farmer.procurement.stage_payment") },
  ];

  return (
    <ProtectedRoleRoute allowedRoles={["FARMER", "ADMIN"]}>
      {(user) => (
        <FarmerShell user={user}>
          <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    {t("farmer.procurement.title")}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {t("farmer.procurement.subtitle")}
                  </p>
                </div>
              </div>
              <VoiceButton text={`${t("farmer.procurement.title")}. ${t("farmer.procurement.subtitle")}`} />
            </div>

            {/* Journey Timeline Header Box */}
            <Card className="border-border bg-card p-5 space-y-4 shadow-subtle">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                <span>{t("farmer.procurement.journey_title")}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-bold">
                {stages.map((st) => (
                  <div key={st.key} className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 space-y-1">
                    <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground font-black text-[10px] flex items-center justify-center mx-auto">
                      ✓
                    </div>
                    <span className="text-[11px] block">{st.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Detailed Weighbridge Slips List */}
            <div className="space-y-4">
              {procurements.map((proc) => (
                <Card key={proc.id} className="border-border shadow-elevated overflow-hidden">
                  <div className="bg-secondary/60 border-b border-border p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-primary" />
                      <span className="font-bold text-sm text-foreground">{proc.slipNumber}</span>
                      <span className="text-xs text-muted-foreground">({proc.date})</span>
                    </div>

                    <Badge variant={proc.status === "CREDITED" ? "success" : "warning"} className="text-xs font-bold">
                      {proc.status}
                    </Badge>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {/* Produce & Mandi Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div>
                        <h3 className="text-lg font-black text-foreground">{proc.cropName}</h3>
                        <p className="text-xs text-muted-foreground">{proc.centreName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-600 block">{t("farmer.procurement.total_payout")}</span>
                        <span className="text-xl font-black text-foreground">₹{proc.totalPayoutAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Transparent Weighbridge Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-background border border-border">
                        <span className="text-muted-foreground block text-[10px]">{t("farmer.procurement.gross_weight")}</span>
                        <span className="font-bold text-foreground text-sm">{proc.grossWeightKg.toLocaleString()} kg</span>
                      </div>

                      <div className="p-3 rounded-xl bg-background border border-border">
                        <span className="text-muted-foreground block text-[10px]">{t("farmer.procurement.tare_weight")}</span>
                        <span className="font-bold text-foreground text-sm">{proc.tareWeightKg.toLocaleString()} kg</span>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300">
                        <span className="text-emerald-800 dark:text-emerald-300 block text-[10px]">{t("farmer.procurement.net_produce_weight")}</span>
                        <span className="font-black text-emerald-900 dark:text-emerald-200 text-sm">{proc.netWeightQtl} Qtl</span>
                      </div>

                      <div className="p-3 rounded-xl bg-background border border-border">
                        <span className="text-muted-foreground block text-[10px]">{t("farmer.procurement.moisture_grade")}</span>
                        <span className="font-bold text-foreground text-sm">{proc.moisturePercentage}% ({proc.qualityGrade})</span>
                      </div>
                    </div>

                    {/* Transparent Math Footer */}
                    <div className="p-3 rounded-xl bg-secondary/40 text-xs font-semibold text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
                      <span>
                        {t("farmer.procurement.calc_math", { net: proc.netWeightQtl, rate: proc.mspRatePerQtl, total: proc.totalPayoutAmount.toLocaleString() })}
                      </span>
                      {proc.bankUtr && (
                        <span className="text-foreground font-bold">
                          {t("farmer.procurement.bank_utr", { utr: proc.bankUtr })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </FarmerShell>
      )}
    </ProtectedRoleRoute>
  );
}
