"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tractor,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Languages,
  Clock,
  Calendar,
  QrCode,
  Smartphone,
  BarChart3,
  Sparkles,
  Scale,
  MapPin,
} from "lucide-react";

export default function Home() {
  const { t, locale, setLocale, supportedLocales } = useLanguage();
  const [activeTab, setActiveTab] = useState<"farmer" | "staff" | "admin">("farmer");

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ================================================== */}
      {/* 1. HERO SECTION */}
      {/* ================================================== */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-border/60 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                <span>SIH Problem Statement 26032</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
                {t("hero.title_line1")}{" "}
                <span className="text-primary block sm:inline">{t("hero.title_line2")}</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t("hero.subtitle")}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Button size="lg" className="w-full sm:w-auto font-bold shadow-card" asChild>
                  <Link href="/register">
                    <span>{t("common.get_started")}</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold" asChild>
                  <a href="#how-it-works">{t("common.see_how_it_works")}</a>
                </Button>
              </div>

              {/* Micro Trust Indicators */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  No Mandi Overnight Waiting
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  100% Offline Digital Tokens
                </span>
              </div>
            </div>

            {/* Hero Right Visual Product Preview Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-elevated transition-transform hover:scale-[1.01]">
                {/* Product Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Smart Token Receipt
                      </h4>
                      <p className="text-sm font-black text-foreground">Token #KS-2025-8841</p>
                    </div>
                  </div>
                  <Badge variant="success" className="pulse-badge text-xs">
                    Live Verified
                  </Badge>
                </div>

                {/* Card Details */}
                <div className="py-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/60">
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      Centre:
                    </span>
                    <span className="font-bold text-foreground">Khanna Grain Mandi</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-background border border-border">
                      <span className="text-muted-foreground block text-[10px]">Crop & Quantity</span>
                      <span className="font-bold text-foreground">Wheat (50 Qtl)</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-background border border-border">
                      <span className="text-muted-foreground block text-[10px]">Slot Time</span>
                      <span className="font-bold text-foreground">10:00 - 11:00 AM</span>
                    </div>
                  </div>

                  {/* Realtime Live Queue Counter Widget */}
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Live Queue Counter
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        ETA: ~20 Mins
                      </span>
                    </div>
                    <div className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                      Position: #3 in Line
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      2 tractors ahead of you at weighbridge
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-center text-[11px] text-muted-foreground border-t border-border">
                  🔒 Encrypted HMAC payload string for offline scanner check-in
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 2. TRUST / VALUE STRIP */}
      {/* ================================================== */}
      <section id="value-strip" className="py-12 bg-card border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-background border border-border/80 shadow-subtle hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-3">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">{t("value_strip.slots_title")}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t("value_strip.slots_desc")}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-background border border-border/80 shadow-subtle hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 flex items-center justify-center mb-3">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">{t("value_strip.queue_title")}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t("value_strip.queue_desc")}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-background border border-border/80 shadow-subtle hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-300 flex items-center justify-center mb-3">
                <Languages className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">{t("value_strip.i18n_title")}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t("value_strip.i18n_desc")}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-background border border-border/80 shadow-subtle hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 flex items-center justify-center mb-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">{t("value_strip.payout_title")}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t("value_strip.payout_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 3. HOW IT WORKS */}
      {/* ================================================== */}
      <section id="how-it-works" className="py-16 md:py-24 bg-background border-b border-border/60">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <Badge variant="outline" className="px-3 py-1 font-semibold border-primary/30 text-primary">
              {t("how_it_works.section_badge")}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t("how_it_works.section_title")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              From produce declaration to bank account transfer confirmation in 5 clear steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="relative overflow-hidden border-border/80">
              <CardHeader className="p-5 space-y-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
                  1
                </div>
                <CardTitle className="text-base font-bold">{t("how_it_works.step1_title")}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {t("how_it_works.step1_desc")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="relative overflow-hidden border-border/80">
              <CardHeader className="p-5 space-y-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
                  2
                </div>
                <CardTitle className="text-base font-bold">{t("how_it_works.step2_title")}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {t("how_it_works.step2_desc")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="relative overflow-hidden border-border/80">
              <CardHeader className="p-5 space-y-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
                  3
                </div>
                <CardTitle className="text-base font-bold">{t("how_it_works.step3_title")}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {t("how_it_works.step3_desc")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="relative overflow-hidden border-border/80">
              <CardHeader className="p-5 space-y-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
                  4
                </div>
                <CardTitle className="text-base font-bold">{t("how_it_works.step4_title")}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {t("how_it_works.step4_desc")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="relative overflow-hidden border-border/80 bg-primary/5">
              <CardHeader className="p-5 space-y-2">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center">
                  5
                </div>
                <CardTitle className="text-base font-bold">{t("how_it_works.step5_title")}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {t("how_it_works.step5_desc")}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 4. FARMER-FIRST SECTION */}
      {/* ================================================== */}
      <section id="farmers" className="py-16 md:py-24 bg-card border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Text Description */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              <Badge variant="success" className="px-3 py-1 font-semibold">
                {t("farmer_section.badge")}
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {t("farmer_section.title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
                {t("farmer_section.subtitle")}
              </p>

              <div className="space-y-3 pt-2 text-left">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border/60">
                  <Smartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Touch-Friendly UI</h4>
                    <p className="text-xs text-muted-foreground">
                      Minimum 44px touch targets designed for seamless operation on mobile screens under direct sunlight.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border/60">
                  <QrCode className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Offline Digital Tokens</h4>
                    <p className="text-xs text-muted-foreground">
                      Booking tokens and QR payloads are saved locally in browser storage so farmers can present them even with zero cellular coverage.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Interface UI Mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-sm rounded-[2.5rem] border-4 border-foreground/15 bg-background p-4 shadow-elevated">
                <div className="w-20 h-4 bg-foreground/10 rounded-full mx-auto mb-4" />
                <div className="space-y-4">
                  {/* Phone Header */}
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-xs font-bold text-foreground">KisanSetu Mobile App</span>
                    <Badge variant="outline" className="text-[10px] py-0">ਪੰਜਾਬੀ / हिन्दी</Badge>
                  </div>

                  {/* Active Booking Card */}
                  <Card className="border-primary/30 bg-primary/5 p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-primary">Active Booking</span>
                      <span className="text-[10px] text-muted-foreground">Today</span>
                    </div>
                    <div className="text-sm font-black text-foreground">Wheat Procurement</div>
                    <div className="text-xs text-muted-foreground">Slot: 10:00 AM - 11:00 AM</div>
                  </Card>

                  {/* Live Waiting Widget */}
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-amber-800 dark:text-amber-300">
                      <span>Gate Status</span>
                      <span>Checked-In</span>
                    </div>
                    <div className="text-base font-black text-amber-900 dark:text-amber-200">
                      Position: #2 in Queue
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      Estimated turn in ~12 minutes
                    </p>
                  </div>

                  {/* Payment Status Tracker Widget */}
                  <div className="p-3 rounded-xl bg-background border border-border space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-muted-foreground">
                      <span>Calculated MSP Payout</span>
                      <span className="text-emerald-600 font-bold">₹1,13,750</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Bank UTR Disbursement Processing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 5. PROCUREMENT CENTRE SECTION */}
      {/* ================================================== */}
      <section id="centres" className="py-16 md:py-24 bg-background border-b border-border/60">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Staff Portal Interface Mockup */}
            <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center">
              <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-elevated space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase">Staff Portal</h4>
                      <p className="text-sm font-black text-foreground">Khanna Mandi - Gate #1</p>
                    </div>
                  </div>
                  <Badge variant="warning" className="text-xs">Staff Active</Badge>
                </div>

                {/* Weighbridge Logger Preview */}
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-background border border-border">
                      <span className="text-muted-foreground block text-[10px]">Gross Weight</span>
                      <span className="font-bold text-foreground">18,500 kg</span>
                    </div>
                    <div className="p-2 rounded bg-background border border-border">
                      <span className="text-muted-foreground block text-[10px]">Tare Weight</span>
                      <span className="font-bold text-foreground">13,500 kg</span>
                    </div>
                    <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950 border border-emerald-300">
                      <span className="text-emerald-800 dark:text-emerald-300 block text-[10px]">Net Weight</span>
                      <span className="font-black text-emerald-900 dark:text-emerald-200">50.00 Qtl</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-background border border-border space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Moisture Content: <strong>13.2%</strong> (Pass)</span>
                      <span>Grade: <strong className="text-emerald-600">Grade A</strong></span>
                    </div>
                    <div className="flex justify-between font-bold text-foreground border-t border-border pt-1.5">
                      <span>Calculated Payout (₹2,275/Qtl):</span>
                      <span className="text-base text-primary">₹1,13,750</span>
                    </div>
                  </div>

                  <Button variant="harvest" className="w-full text-xs h-9">
                    Issue Digital Procurement Slip
                  </Button>
                </div>
              </div>
            </div>

            {/* Text Description */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5 text-center lg:text-left">
              <Badge variant="warning" className="px-3 py-1 font-semibold">
                {t("centre_section.badge")}
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {t("centre_section.title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
                {t("centre_section.subtitle")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-left">
                <div className="p-3 rounded-lg bg-card border border-border">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5 mb-1">
                    <QrCode className="h-4 w-4 text-amber-600" />
                    Rapid Camera Check-in
                  </h4>
                  <p className="text-muted-foreground">Scan farmer token QR codes at gate in under 3 seconds.</p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5 mb-1">
                    <Scale className="h-4 w-4 text-amber-600" />
                    Automated MSP Math
                  </h4>
                  <p className="text-muted-foreground">Automatic net weight subtraction and active crop MSP calculation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 6. MULTILINGUAL INDIA SECTION */}
      {/* ================================================== */}
      <section id="multilingual" className="py-16 md:py-24 bg-card border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <Badge variant="outline" className="px-3 py-1 font-semibold border-sky-400 text-sky-700 dark:text-sky-300">
              {t("multilingual_section.badge")}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t("multilingual_section.title")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              {t("multilingual_section.subtitle")}
            </p>
          </div>

          {/* Interactive Language Selector Concept Grid */}
          <div className="max-w-4xl mx-auto p-6 rounded-2xl bg-background border border-border shadow-subtle space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {supportedLocales.map((loc) => (
                <button
                  key={loc.code}
                  onClick={() => setLocale(loc.code)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    locale === loc.code
                      ? "bg-primary text-primary-foreground shadow-subtle scale-105"
                      : "bg-card text-muted-foreground border border-border hover:border-primary/40"
                  }`}
                >
                  {loc.nativeName} ({loc.name})
                </button>
              ))}
            </div>

            {/* Live Translation Key Rendering Demonstration Box */}
            <div className="p-6 rounded-xl bg-secondary/50 border border-border text-center space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Live Translation Output Preview (Locale: {locale.toUpperCase()})
              </span>
              <p className="text-xl sm:text-2xl font-black text-foreground">
                &quot;{t("hero.title_line1")} {t("hero.title_line2")}&quot;
              </p>
              <p className="text-xs text-muted-foreground italic">
                Translation Key: <code className="bg-background px-1.5 py-0.5 rounded border">t(&apos;hero.title_line1&apos;)</code>
              </p>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              ℹ️ {t("multilingual_section.note")}
            </p>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 7. SMART OPERATIONS SECTION */}
      {/* ================================================== */}
      <section id="smart-ops" className="py-16 md:py-24 bg-background border-b border-border/60">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <Badge variant="outline" className="px-3 py-1 font-semibold border-primary/30 text-primary">
              {t("smart_ops.badge")}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t("smart_ops.title")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              {t("smart_ops.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border/80">
              <CardHeader className="space-y-2">
                <Calendar className="h-6 w-6 text-primary" />
                <CardTitle className="text-base font-bold">{t("smart_ops.op1_title")}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {t("smart_ops.op1_desc")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/80">
              <CardHeader className="space-y-2">
                <Clock className="h-6 w-6 text-amber-600" />
                <CardTitle className="text-base font-bold">{t("smart_ops.op2_title")}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {t("smart_ops.op2_desc")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/80">
              <CardHeader className="space-y-2">
                <BarChart3 className="h-6 w-6 text-sky-600" />
                <CardTitle className="text-base font-bold">{t("smart_ops.op3_title")}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {t("smart_ops.op3_desc")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/80">
              <CardHeader className="space-y-2">
                <ShieldCheck className="h-6 w-6 text-purple-600" />
                <CardTitle className="text-base font-bold">{t("smart_ops.op4_title")}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {t("smart_ops.op4_desc")}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 8. IMPACT SECTION (DEMO / TARGET NUMBERS) */}
      {/* ================================================== */}
      <section className="py-16 md:py-24 bg-card border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <Badge variant="success" className="px-3 py-1 font-semibold">
              {t("impact_section.badge")}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t("impact_section.title")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              {t("impact_section.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-6 rounded-2xl bg-background border border-border shadow-subtle">
              <div className="text-3xl sm:text-5xl font-black text-primary mb-1">
                {t("impact_section.metric1_val")}
              </div>
              <div className="text-xs sm:text-sm font-bold text-foreground">
                {t("impact_section.metric1_lbl")}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-border shadow-subtle">
              <div className="text-3xl sm:text-5xl font-black text-amber-600 mb-1">
                {t("impact_section.metric2_val")}
              </div>
              <div className="text-xs sm:text-sm font-bold text-foreground">
                {t("impact_section.metric2_lbl")}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-border shadow-subtle">
              <div className="text-3xl sm:text-5xl font-black text-sky-600 mb-1">
                {t("impact_section.metric3_val")}
              </div>
              <div className="text-xs sm:text-sm font-bold text-foreground">
                {t("impact_section.metric3_lbl")}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-border shadow-subtle">
              <div className="text-3xl sm:text-5xl font-black text-purple-600 mb-1">
                {t("impact_section.metric4_val")}
              </div>
              <div className="text-xs sm:text-sm font-bold text-foreground">
                {t("impact_section.metric4_lbl")}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-center text-muted-foreground mt-6 italic">
            * Note: Target metrics represent simulated demonstration parameters for SIH Problem Statement 26032.
          </p>
        </div>
      </section>

      {/* ================================================== */}
      {/* 9. ROLE PORTAL SELECTION (INTERACTIVE PREVIEW) */}
      {/* ================================================== */}
      <section id="roles" className="py-16 md:py-24 bg-background border-b border-border/60">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <Badge variant="outline" className="px-3 py-1 font-semibold border-primary/30 text-primary">
              Portal Access
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Select Your Role to Access KisanSetu
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              Choose your user role to preview the tailored workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card
              className={`cursor-pointer transition-all border-2 ${
                activeTab === "farmer"
                  ? "border-primary shadow-elevated scale-[1.02]"
                  : "border-border hover:border-primary/40"
              }`}
              onClick={() => setActiveTab("farmer")}
            >
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                  <Tractor className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold">{t("common.roles.farmer")}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Mobile produce declarations, smart slot selection, digital token generation, and bank payout tracker.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button className="w-full font-bold" variant={activeTab === "farmer" ? "default" : "outline"} asChild>
                  <Link href="/farmer">Access Farmer Portal</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card
              className={`cursor-pointer transition-all border-2 ${
                activeTab === "staff"
                  ? "border-amber-600 shadow-elevated scale-[1.02]"
                  : "border-border hover:border-amber-600/40"
              }`}
              onClick={() => setActiveTab("staff")}
            >
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center">
                  <UserCheck className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold">{t("common.roles.staff")}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Camera QR check-in scanner, active queue board, weighbridge gross/tare input, and digital slip creation.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button className="w-full font-bold" variant={activeTab === "staff" ? "harvest" : "outline"} asChild>
                  <Link href="/staff">Access Staff Portal</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card
              className={`cursor-pointer transition-all border-2 ${
                activeTab === "admin"
                  ? "border-sky-600 shadow-elevated scale-[1.02]"
                  : "border-border hover:border-sky-600/40"
              }`}
              onClick={() => setActiveTab("admin")}
            >
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold">{t("common.roles.admin")}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  District procurement heatmaps, daily slot capacity controls, crop MSP master configuration, and audits.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button className="w-full font-bold" variant={activeTab === "admin" ? "secondary" : "outline"} asChild>
                  <Link href="/admin">Access Admin Dashboard</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 10. FINAL CTA */}
      {/* ================================================== */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground text-center">
        <div className="container max-w-4xl mx-auto px-4 sm:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            {t("final_cta.title")}
          </h2>
          <p className="text-base sm:text-lg font-medium opacity-90 max-w-2xl mx-auto leading-relaxed">
            {t("final_cta.subtitle")}
          </p>
          <div className="pt-2">
            <Button size="lg" variant="harvest" className="font-bold shadow-elevated text-base px-8" asChild>
              <Link href="/register">
                <span>{t("final_cta.button")}</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
