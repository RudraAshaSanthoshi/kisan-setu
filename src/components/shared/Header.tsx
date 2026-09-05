"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "./LanguageSelector";
import { Sprout, Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/#how-it-works", label: t("nav.how_it_works") },
    { href: "/#farmers", label: t("nav.for_farmers") },
    { href: "/#centres", label: t("nav.for_centres") },
    { href: "/#multilingual", label: t("nav.languages") },
    { href: "/#smart-ops", label: t("nav.features") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.01]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-subtle">
            <Sprout className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-foreground flex items-center gap-1.5">
              {t("common.app_name")}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
              Smart Procurement Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-muted-foreground">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-primary transition-colors py-1"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Action Controls */}
        <div className="hidden sm:flex items-center gap-3">
          <LanguageSelector />
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">{t("common.login")}</Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href="/register">{t("common.get_started")}</Link>
          </Button>
        </div>

        {/* Mobile Menu Trigger & Quick Language Switcher */}
        <div className="flex items-center gap-2 sm:hidden">
          <LanguageSelector />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="h-10 w-10"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border bg-card p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                <span>{link.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </nav>

          <div className="pt-2 border-t border-border flex flex-col gap-2">
            <Button variant="outline" className="w-full justify-center" asChild>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                {t("common.login")}
              </Link>
            </Button>
            <Button variant="default" className="w-full justify-center" asChild>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                {t("common.get_started")}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
