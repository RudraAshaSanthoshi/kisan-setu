"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getCurrentUserAsync, signOutUser } from "@/lib/auth/authActions";
import { UserRole, UserProfile } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, LogOut, ArrowLeft, Loader2 } from "lucide-react";

interface ProtectedRoleRouteProps {
  allowedRoles: UserRole[];
  children: (user: UserProfile) => React.ReactNode;
}

export function ProtectedRoleRoute({ allowedRoles, children }: ProtectedRoleRouteProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      const activeUser = await getCurrentUserAsync();
      if (!activeUser) {
        router.push("/login");
        return;
      }

      setUser(activeUser);
      if (!allowedRoles.includes(activeUser.role)) {
        setIsChecking(false);
        return;
      }

      setIsChecking(false);
    }

    checkAuth();
  }, [allowedRoles, router]);

  if (isChecking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Verifying authorization...</p>
      </div>
    );
  }

  // Access Denied State (Role Mismatch)
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="container max-w-md mx-auto px-4 py-16">
        <Card className="border-destructive/30 bg-destructive/5 text-center p-6 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-foreground">Access Denied</CardTitle>
            <div className="text-xs text-muted-foreground leading-relaxed mt-1">
              Your current account role (<Badge variant="outline" className="font-bold">{user?.role || "GUEST"}</Badge>) does not have permission to access this area.
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="default"
              onClick={() => {
                if (user?.role === "FARMER") router.push("/farmer");
                else if (user?.role === "CENTRE_STAFF") router.push("/staff");
                else if (user?.role === "ADMIN") router.push("/admin");
                else router.push("/login");
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Go to Your Authorized Workspace</span>
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                await signOutUser();
                router.push("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out & Switch Account</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children(user)}</>;
}
