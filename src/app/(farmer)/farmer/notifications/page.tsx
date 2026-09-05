"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FarmerShell } from "@/components/farmer/FarmerShell";
import { ProtectedRoleRoute } from "@/components/auth/ProtectedRoleRoute";
import { farmerService } from "@/lib/services/farmerService";
import { FarmerNotification } from "@/lib/demo/farmerData";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Calendar, Clock, CreditCard, Info } from "lucide-react";

export default function NotificationsPage() {
  const { t } = useLanguage();

  const [notifications, setNotifications] = useState<FarmerNotification[]>([]);

  useEffect(() => {
    farmerService.getNotifications().then(setNotifications);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <ProtectedRoleRoute allowedRoles={["FARMER", "ADMIN"]}>
      {(user) => (
        <FarmerShell user={user}>
          <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    {t("farmer.notifications.title")}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {t("farmer.notifications.subtitle")}
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="mr-1.5 h-4 w-4 text-primary" />
                <span>{t("farmer.notifications.mark_all_read")}</span>
              </Button>
            </div>

            {/* Notifications List */}
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <Card
                    key={notif.id}
                    className={`border transition-colors ${
                      notif.read ? "bg-card border-border" : "bg-primary/5 border-primary/30 shadow-subtle"
                    }`}
                  >
                    <CardContent className="p-4 flex items-start gap-3 text-xs">
                      <div className="h-9 w-9 rounded-xl bg-secondary text-foreground flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        {notif.category === "SLOT" ? <Calendar className="h-4 w-4 text-primary" /> :
                         notif.category === "QUEUE" ? <Clock className="h-4 w-4 text-amber-600" /> :
                         notif.category === "PAYMENT" ? <CreditCard className="h-4 w-4 text-purple-600" /> :
                         <Info className="h-4 w-4 text-sky-600" />}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-foreground text-sm">{notif.title}</h4>
                          <span className="text-[10px] font-semibold text-muted-foreground">{notif.timestamp}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{notif.message}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border p-8 text-center">
                <p className="text-sm font-bold text-muted-foreground">
                  {t("farmer.notifications.no_notifications")}
                </p>
              </Card>
            )}
          </div>
        </FarmerShell>
      )}
    </ProtectedRoleRoute>
  );
}
