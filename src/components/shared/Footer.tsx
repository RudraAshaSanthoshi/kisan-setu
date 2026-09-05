"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";
import { Sprout, ShieldCheck, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Footer() {
  const { t, locale, setLocale, supportedLocales } = useLanguage();

  return (
    <footer className="border-t border-border bg-card text-card-foreground pt-12 pb-8">
      <div className="container max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border/80">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sprout className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-foreground">
                {t("common.app_name")}
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("footer.desc")}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>{t("footer.sih_ref")}</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a href="#how-it-works" className="hover:text-primary transition-colors">
                  {t("nav.how_it_works")}
                </a>
              </li>
              <li>
                <a href="#farmers" className="hover:text-primary transition-colors">
                  {t("nav.for_farmers")}
                </a>
              </li>
              <li>
                <a href="#centres" className="hover:text-primary transition-colors">
                  {t("nav.for_centres")}
                </a>
              </li>
              <li>
                <a href="#smart-ops" className="hover:text-primary transition-colors">
                  {t("nav.features")}
                </a>
              </li>
            </ul>
          </div>

          {/* User Portals & Roles */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Portals
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a href="#roles" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <span>{t("common.roles.farmer")}</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1">Mobile</Badge>
                </a>
              </li>
              <li>
                <a href="#roles" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <span>{t("common.roles.staff")}</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1">Scanner</Badge>
                </a>
              </li>
              <li>
                <a href="#roles" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <span>{t("common.roles.admin")}</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1">Analytics</Badge>
                </a>
              </li>
            </ul>
          </div>

          {/* Language Selector & Accessibility */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Regional Languages
            </h4>
            <p className="text-xs text-muted-foreground">
              Switch script and locale instantly:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {supportedLocales.map((loc) => (
                <button
                  key={loc.code}
                  onClick={() => setLocale(loc.code)}
                  className={`text-xs px-2 py-1 rounded-md border transition-all ${
                    locale === loc.code
                      ? "bg-primary text-primary-foreground border-primary font-bold"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {loc.nativeName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>{t("footer.rights")}</p>
          <p className="flex items-center gap-1 text-[11px]">
            <span>Empowering Indian Farmers with Transparency</span>
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
