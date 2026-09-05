"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FarmerShell } from "@/components/farmer/FarmerShell";
import { ProtectedRoleRoute } from "@/components/auth/ProtectedRoleRoute";
import { farmerService } from "@/lib/services/farmerService";
import { WeighbridgeProcurement } from "@/lib/demo/farmerData";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { History, Search, QrCode, Filter, FileText } from "lucide-react";

export default function HistoryPage() {
  const { t } = useLanguage();

  const [procurements, setProcurements] = useState<WeighbridgeProcurement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("ALL");

  useEffect(() => {
    farmerService.getProcurements().then(setProcurements);
  }, []);

  const filteredProcurements = procurements.filter((p) => {
    const matchesSearch =
      p.slipNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.centreName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCrop = selectedCrop === "ALL" || p.cropName.toLowerCase().includes(selectedCrop.toLowerCase());
    return matchesSearch && matchesCrop;
  });

  return (
    <ProtectedRoleRoute allowedRoles={["FARMER", "ADMIN"]}>
      {(user) => (
        <FarmerShell user={user}>
          <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-secondary text-foreground flex items-center justify-center font-bold">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    {t("farmer.history.title")}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {t("farmer.history.subtitle")}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("farmer.history.search_placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs h-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-input bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ALL">{t("farmer.history.all_crops")}</option>
                  <option value="wheat">Wheat</option>
                  <option value="paddy">Paddy</option>
                </select>
              </div>
            </div>

            {/* History Table / Card List */}
            {filteredProcurements.length > 0 ? (
              <div className="space-y-3">
                {filteredProcurements.map((item) => (
                  <Card key={item.id} className="border-border shadow-subtle hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-primary" />
                          <span className="font-bold text-foreground">{item.slipNumber}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-semibold">{item.date}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">{t("farmer.history.crop_net_weight")}</span>
                          <span className="font-bold text-foreground">{item.cropName} ({item.netWeightQtl} Qtl)</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">{t("farmer.history.mandi_centre")}</span>
                          <span className="font-bold text-foreground">{item.centreName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">{t("farmer.history.total_amount")}</span>
                          <span className="font-black text-emerald-600">₹{item.totalPayoutAmount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">{t("farmer.history.status")}</span>
                          <Badge variant="success" className="text-[10px] py-0">{item.status}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border p-8 text-center">
                <p className="text-sm font-bold text-muted-foreground">
                  {t("farmer.history.no_records")}
                </p>
              </Card>
            )}
          </div>
        </FarmerShell>
      )}
    </ProtectedRoleRoute>
  );
}
