"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import { signInUser } from "@/lib/auth/authActions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sprout, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Info } from "lucide-react";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Form validations
    if (!email.trim()) {
      setErrorMsg(t("auth.validations.email_required"));
      return;
    }
    if (!email.includes("@")) {
      setErrorMsg(t("auth.validations.invalid_email"));
      return;
    }
    if (!password) {
      setErrorMsg(t("auth.validations.password_required"));
      return;
    }

    setIsLoading(true);

    try {
      const res = await signInUser({ email, password });
      if (!res.success || !res.user) {
        setErrorMsg(res.error || t("auth.errors.invalid_credentials"));
        setIsLoading(false);
        return;
      }

      setSuccessMsg(t("auth.success.login"));

      // Server-side role authorization redirection
      setTimeout(() => {
        if (res.user?.role === "ADMIN") {
          router.push("/admin");
        } else if (res.user?.role === "CENTRE_STAFF") {
          router.push("/staff");
        } else {
          router.push("/farmer");
        }
      }, 600);
    } catch {
      setErrorMsg(t("auth.errors.auth_failed"));
      setIsLoading(false);
    }
  };

  // Quick preset demo login helper for prototype testing
  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setErrorMsg(null);
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
          {t("auth.login_title")}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xs mx-auto">
          {t("auth.login_subtitle")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="border-border shadow-elevated">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold text-center">
              {t("common.login")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Notification Alert */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Notification Alert */}
            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
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

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.password_label")}</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {t("auth.forgot_link")}
                  </Link>
                </div>
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
                    aria-label={showPassword ? t("auth.hide_password") : t("auth.show_password")}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Session Checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs font-medium text-muted-foreground cursor-pointer">
                  Remember session on this device
                </label>
              </div>

              {/* Submit Login Button */}
              <Button type="submit" className="w-full font-bold h-11" disabled={isLoading}>
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>{t("auth.login_button")}</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Prototype Preset Login Shortcuts */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>Prototype Quick Roles (Click to auto-fill):</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickFill("farmer.demo@kisansetu.in")}
                  className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground border border-border text-[11px] font-semibold"
                >
                  Farmer Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("staff.demo@kisansetu.in")}
                  className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 text-[11px] font-semibold"
                >
                  Staff Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin@kisansetu.in")}
                  className="px-2 py-1 rounded bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200 border border-sky-300 text-[11px] font-semibold"
                >
                  Admin Demo
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="justify-center border-t border-border pt-4 text-xs text-muted-foreground">
            <span>{t("auth.no_account")}</span>
            <Link href="/register" className="ml-1 font-bold text-primary hover:underline">
              {t("auth.register_button")}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
