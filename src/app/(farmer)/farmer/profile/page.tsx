"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FarmerShell } from "@/components/farmer/FarmerShell";
import { ProtectedRoleRoute } from "@/components/auth/ProtectedRoleRoute";
import { farmerService } from "@/lib/services/farmerService";
import { FarmerProfile } from "@/lib/demo/farmerData";
import { useLanguage } from "@/hooks/useLanguage";
import { signOutUser } from "@/lib/auth/authActions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, MapPin, Languages, Building2, LogOut, CheckCircle2 } from "lucide-react";

export default function FarmerProfilePage() {
  const { t, locale, setLocale, supportedLocales } = useLanguage();
  const router = useRouter();

  const [profile, setProfile] = useState<FarmerProfile | null>(null);

  useEffect(() => {
    farmerService.getProfile().then(setProfile);
  }, []);

  const handleLogout = async () => {
    await signOutUser();
    router.push("/login");
  };

  return (
    <ProtectedRoleRoute allowedRoles={["FARMER", "ADMIN"]}>
      {(user) => (
        <FarmerShell user={user}>
          <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-lg border border-emerald-300">
                  {user.fullName ? user.fullName[0] : "F"}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    {user.fullName}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {t("farmer.profile.registered_farmer")} • {profile?.district}, {profile?.state}
                  </p>
                </div>
              </div>

              <Badge variant="success" className="px-3 py-1 font-bold text-xs">
                Role: {user.role}
              </Badge>
            </div>

            {/* Profile Overview Card */}
            <Card className="border-border shadow-subtle">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span>{t("farmer.profile.personal_details")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-border/60">
                  <span className="text-muted-foreground font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {t("farmer.profile.full_name")}
                  </span>
                  <span className="font-bold text-foreground">{user.fullName}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-border/60">
                  <span className="text-muted-foreground font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {t("farmer.profile.mobile_phone")}
                  </span>
                  <span className="font-bold text-foreground">{user.phoneNumber}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-border/60">
                  <span className="text-muted-foreground font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {t("farmer.profile.email_address")}
                  </span>
                  <span className="font-bold text-foreground">{profile?.email}</span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {t("farmer.profile.district_state")}
                  </span>
                  <span className="font-bold text-foreground">{profile?.district}, {profile?.state}</span>
                </div>
              </CardContent>
            </Card>

            {/* Preferred Language & Mandi Settings Card */}
            <Card className="border-border shadow-subtle">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Languages className="h-4 w-4 text-sky-600" />
                  <span>{t("farmer.profile.preferences_title")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground block">
                    {t("farmer.profile.active_language")}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {supportedLocales.map((loc) => (
                      <button
                        key={loc.code}
                        type="button"
                        onClick={() => setLocale(loc.code)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                          locale === loc.code
                            ? "bg-primary text-primary-foreground border-primary shadow-subtle"
                            : "bg-card text-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        {loc.nativeName} ({loc.name})
                      </button>
                    ))}
                  </div>
                </div>

                {profile && (
                  <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-xs space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-primary" />
                      {t("farmer.profile.default_mandi")}: Khanna Main Grain Mandi
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      {t("farmer.profile.default_mandi_desc")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Linked Bank Account Summary Card */}
            <Card className="border-border shadow-subtle">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  <span>{t("farmer.profile.linked_bank")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {profile && (
                  <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground block">{profile.bankName}</span>
                      <span className="text-muted-foreground text-[11px]">{t("farmer.profile.account_ending_fmt", { last4: profile.bankAccountLast4 })}</span>
                    </div>
                    <Badge variant="success" className="text-[10px]">{t("farmer.profile.dbt_active")}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Logout Action */}
            <div className="pt-2">
              <Button variant="destructive" size="lg" className="w-full font-bold shadow-subtle" onClick={handleLogout}>
                <LogOut className="mr-2 h-5 w-5" />
                <span>{t("farmer.profile.sign_out_button")}</span>
              </Button>
            </div>
          </div>
        </FarmerShell>
      )}
    </ProtectedRoleRoute>
  );
}
