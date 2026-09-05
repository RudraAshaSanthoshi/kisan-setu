"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { signOutUser } from "@/lib/auth/authActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sprout,
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  Clock,
  Scale,
  CreditCard,
  Bell,
  History,
  User,
  LogOut,
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";

interface FarmerShellProps {
  children: React.ReactNode;
  user: {
    fullName: string;
    phoneNumber: string;
    role: string;
  };
}

export function FarmerShell({ children, user }: FarmerShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);

  const mainNavItems = [
    { href: "/farmer", label: t("farmer.shell.nav_home"), icon: LayoutDashboard },
    { href: "/farmer/book-slot", label: t("farmer.actions.book_slot"), icon: CalendarPlus, highlight: true },
    { href: "/farmer/bookings", label: t("farmer.actions.my_bookings"), icon: CalendarDays },
    { href: "/farmer/queue", label: t("farmer.actions.live_queue"), icon: Clock },
    { href: "/farmer/payments", label: t("farmer.actions.payments"), icon: CreditCard },
  ];

  const secondaryNavItems = [
    { href: "/farmer/procurement", label: t("farmer.actions.procurement"), icon: Scale },
    { href: "/farmer/notifications", label: t("farmer.notifications.title"), icon: Bell, badge: unreadNotifications },
    { href: "/farmer/history", label: t("farmer.actions.history"), icon: History },
    { href: "/farmer/profile", label: t("farmer.actions.profile"), icon: User },
  ];

  const handleLogout = async () => {
    await signOutUser();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground">
      {/* ================================================== */}
      {/* 1. DESKTOP SIDEBAR NAVIGATION */}
      {/* ================================================== */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col shrink-0 border-r border-border bg-card/95 backdrop-blur sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <Link href="/farmer" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-subtle">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-foreground flex items-center gap-1.5">
                KisanSetu
                <Badge variant="success" className="text-[10px] px-1.5 py-0">{t("farmer.shell.farmer_badge")}</Badge>
              </span>
              <span className="text-[11px] font-medium text-muted-foreground block">
                {t("farmer.shell.portal_subtitle")}
              </span>
            </div>
          </Link>
        </div>

        {/* Primary Desktop Nav Section */}
        <div className="p-4 space-y-6 flex-1">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2 block">
              {t("farmer.shell.core_ops")}
            </span>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-subtle"
                      : item.highlight
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="space-y-1 pt-2 border-t border-border/60">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2 block">
              {t("farmer.shell.records_account")}
            </span>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-subtle"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-bold">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Profile & Footer Controls */}
        <div className="p-4 border-t border-border space-y-3 bg-secondary/30">
          <div className="flex items-center justify-between">
            <LanguageSelector />
            <Button variant="ghost" size="icon" onClick={handleLogout} title={t("farmer.shell.sign_out")}>
              <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm border border-emerald-300">
              {user.fullName ? user.fullName[0] : "F"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{user.fullName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.phoneNumber}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ================================================== */}
      {/* 2. MOBILE TOP HEADER */}
      {/* ================================================== */}
      <header className="md:hidden sticky top-0 z-30 w-full border-b border-border bg-card/95 backdrop-blur px-4 h-14 flex items-center justify-between">
        <Link href="/farmer" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="font-black text-foreground tracking-tight">KisanSetu</span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <Link href="/farmer/notifications" aria-label={t("farmer.notifications.title")} className="relative p-2 text-muted-foreground hover:text-foreground touch-target flex items-center justify-center">
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive pulse-badge" />
            )}
          </Link>
        </div>
      </header>

      {/* ================================================== */}
      {/* 3. MAIN PAGE CONTENT AREA */}
      {/* ================================================== */}
      <main className="flex-1 pb-20 md:pb-8 overflow-y-auto">
        {children}
      </main>

      {/* ================================================== */}
      {/* 4. MOBILE BOTTOM NAVIGATION BAR (44px+ touch targets) */}
      {/* ================================================== */}
      <nav aria-label={t("farmer.shell.core_ops")} className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border h-16 px-2 flex items-center justify-around shadow-elevated">
        <Link
          href="/farmer"
          className={`flex flex-col items-center justify-center h-12 w-14 rounded-xl text-[10px] font-bold transition-colors touch-target ${
            pathname === "/farmer" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutDashboard className="h-5 w-5 mb-0.5" />
          <span>{t("farmer.shell.nav_home")}</span>
        </Link>

        <Link
          href="/farmer/book-slot"
          className={`flex flex-col items-center justify-center h-12 w-14 rounded-xl text-[10px] font-bold transition-colors touch-target ${
            pathname === "/farmer/book-slot" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarPlus className="h-5 w-5 mb-0.5 text-primary" />
          <span>{t("farmer.shell.nav_book")}</span>
        </Link>

        <Link
          href="/farmer/queue"
          className={`flex flex-col items-center justify-center h-12 w-14 rounded-xl text-[10px] font-bold transition-colors touch-target ${
            pathname === "/farmer/queue" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-5 w-5 mb-0.5" />
          <span>{t("farmer.shell.nav_queue")}</span>
        </Link>

        <Link
          href="/farmer/payments"
          className={`flex flex-col items-center justify-center h-12 w-14 rounded-xl text-[10px] font-bold transition-colors touch-target ${
            pathname === "/farmer/payments" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="h-5 w-5 mb-0.5" />
          <span>{t("farmer.shell.nav_payouts")}</span>
        </Link>

        <button
          type="button"
          aria-label={t("farmer.shell.nav_more")}
          onClick={() => setMoreMenuOpen(true)}
          className={`flex flex-col items-center justify-center h-12 w-14 rounded-xl text-[10px] font-bold transition-colors touch-target ${
            moreMenuOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MoreHorizontal className="h-5 w-5 mb-0.5" />
          <span>{t("farmer.shell.nav_more")}</span>
        </button>
      </nav>

      {/* ================================================== */}
      {/* 5. MOBILE MORE DRAWER MENU */}
      {/* ================================================== */}
      {moreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-150">
          <div className="bg-card border-t border-border rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {user.fullName ? user.fullName[0] : "F"}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{user.fullName}</h3>
                  <p className="text-[11px] text-muted-foreground">{user.phoneNumber}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMoreMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <Button variant="destructive" className="w-full font-bold" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t("farmer.shell.sign_out")}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
