"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import { signUpFarmer } from "@/lib/auth/authActions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sprout, User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Globe } from "lucide-react";

export default function RegisterPage() {
  const { t, locale, setLocale, supportedLocales } = useLanguage();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Form validations
    if (!fullName.trim()) {
      setErrorMsg(t("auth.validations.name_required"));
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg(t("auth.validations.phone_required"));
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg(t("auth.validations.invalid_email"));
      return;
    }
    if (password.length < 6) {
      setErrorMsg(t("auth.validations.password_min"));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t("auth.validations.passwords_mismatch"));
      return;
    }

    setIsLoading(true);

    try {
      // Safe registration endpoint - hardcodes role to 'FARMER'
      const res = await signUpFarmer({
        email,
        password,
        fullName,
        phoneNumber,
        preferredLanguage: locale,
      });

      if (!res.success) {
        setErrorMsg(res.error || t("auth.errors.auth_failed"));
        setIsLoading(false);
        return;
      }

      if (res.requiresConfirmation) {
        setSuccessMsg("Account created! Please check your email inbox to confirm your account before logging in.");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setSuccessMsg(t("auth.success.register"));
        setTimeout(() => {
          router.push("/farmer");
        }, 800);
      }
    } catch {
      setErrorMsg(t("auth.errors.auth_failed"));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2 text-foreground transition-transform hover:scale-105">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-subtle">
            <Sprout className="h-7 w-7" />
          </div>
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {t("auth.register_title")}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xs mx-auto">
          {t("auth.register_subtitle")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="border-border shadow-elevated">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Farmer Registration</CardTitle>
              <Badge variant="success" className="text-[10px] px-2">Role: Farmer</Badge>
            </div>
            <CardDescription className="text-xs">
              Staff & Admin accounts use controlled provisioning.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Alert */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Alert */}
            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <Label htmlFor="fullName">{t("auth.full_name_label")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t("auth.full_name_placeholder")}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Mobile Phone Number */}
              <div className="space-y-1">
                <Label htmlFor="phoneNumber">{t("auth.phone_label")}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder={t("auth.phone_placeholder")}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <Label htmlFor="email">{t("auth.email_label")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("auth.email_placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Preferred Language Selection */}
              <div className="space-y-1">
                <Label htmlFor="lang">{t("auth.language_label")}</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <select
                    id="lang"
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-target cursor-pointer font-semibold"
                  >
                    {supportedLocales.map((loc) => (
                      <option key={loc.code} value={loc.code}>
                        {loc.nativeName} ({loc.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password">{t("auth.password_label")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.password_placeholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground touch-target flex items-center justify-center -mr-2"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">{t("auth.confirm_password_label")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.confirm_password_placeholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full font-bold h-11 mt-2" disabled={isLoading}>
                {isLoading ? (
                  <span>Creating account...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>{t("auth.register_button")}</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-border pt-4 text-xs text-muted-foreground">
            <span>{t("auth.have_account")}</span>
            <Link href="/login" className="ml-1 font-bold text-primary hover:underline">
              {t("auth.login_button")}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
