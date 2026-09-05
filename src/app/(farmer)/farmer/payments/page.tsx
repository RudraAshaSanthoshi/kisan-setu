"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FarmerShell } from "@/components/farmer/FarmerShell";
import { ProtectedRoleRoute } from "@/components/auth/ProtectedRoleRoute";
import { farmerService } from "@/lib/services/farmerService";
import { PaymentRecord } from "@/lib/demo/farmerData";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  FileCheck,
  ChevronRight,
} from "lucide-react";
import { VoiceButton } from "@/components/shared/VoiceButton";

export default function PaymentsPage() {
  const { t } = useLanguage();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"PENDING" | "PROCESSING" | "CREDITED">("PENDING");

  useEffect(() => {
    farmerService.getPayments().then((data) => {
      setPayments(data);
      if (data.some((p) => p.status === "PENDING")) {
        setActiveTab("PENDING");
      } else if (data.some((p) => p.status === "PROCESSING")) {
        setActiveTab("PROCESSING");
      } else {
        setActiveTab("CREDITED");
      }
    });
  }, []);

  const filteredPayments = payments.filter((p) => p.status === activeTab);

  return (
    <ProtectedRoleRoute allowedRoles={["FARMER", "ADMIN"]}>
      {(user) => (
        <FarmerShell user={user}>
          <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    {t("farmer.payments.title")}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {t("farmer.payments.subtitle")}
                  </p>
                </div>
              </div>
              <VoiceButton text={`${t("farmer.payments.title")}. ${t("farmer.payments.subtitle")}`} />
            </div>

            {/* Payout Status Tabs */}
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("PENDING")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "PENDING"
                    ? "bg-primary text-primary-foreground shadow-subtle"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                Pending ({payments.filter((p) => p.status === "PENDING").length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("PROCESSING")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "PROCESSING"
                    ? "bg-primary text-primary-foreground shadow-subtle"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {t("farmer.payments.tab_processing")} ({payments.filter((p) => p.status === "PROCESSING").length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("CREDITED")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "CREDITED"
                    ? "bg-primary text-primary-foreground shadow-subtle"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                Processed / Credited ({payments.filter((p) => p.status === "CREDITED").length})
              </button>
            </div>

            {/* Payments List */}
            {filteredPayments.length > 0 ? (
              <div className="space-y-4">
                {filteredPayments.map((pay) => (
                  <Card key={pay.id} className="border-border shadow-subtle hover:border-purple-300 transition-colors">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-purple-600" />
                        <CardTitle className="text-base font-bold">{pay.procurementSlip}</CardTitle>
                      </div>

                      <Badge
                        variant={pay.status === "CREDITED" ? "success" : "warning"}
                        className="text-[11px] font-bold"
                      >
                        {pay.status}
                      </Badge>
                    </CardHeader>

                    <CardContent className="space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                        <div>
                          <span className="text-xs font-bold text-foreground block">{pay.cropName} ({pay.quantityQtl} Qtl)</span>
                          <span className="text-muted-foreground text-[11px]">{t("farmer.payments.calc_msp_rate", { rate: pay.ratePerQtl })}</span>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-xs font-bold text-muted-foreground block">{t("farmer.payments.payout_amount")}</span>
                          <span className="text-xl font-black text-purple-700 dark:text-purple-300">
                            ₹{pay.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {t("farmer.payments.credited_to")}: <strong>{pay.bankName} ({t("farmer.payments.account_ending", { last4: pay.accountEnding })})</strong>
                          </span>
                        </div>

                        {pay.bankUtr && (
                          <div className="flex items-center gap-2 sm:justify-end text-emerald-600 font-bold">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>UTR: {pay.bankUtr}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border p-8 text-center space-y-2">
                <p className="text-sm font-bold text-muted-foreground">
                  {t("farmer.payments.no_records")}
                </p>
              </Card>
            )}
          </div>
        </FarmerShell>
      )}
    </ProtectedRoleRoute>
  );
}
