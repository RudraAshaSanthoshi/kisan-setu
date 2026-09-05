import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KisanSetu | Multilingual Smart Procurement Management Platform",
  description:
    "Connecting Farmers, Procurement Centre Staff, and Administrators with real-time slot scheduling, live queue tracking, and transparent MSP payouts. (SIH Problem Statement 26032)",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" className={`${inter.variable} suppressHydrationWarning scroll-smooth`}>
      <body className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <LanguageProvider>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
