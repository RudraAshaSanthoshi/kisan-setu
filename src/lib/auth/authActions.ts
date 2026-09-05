import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { UserRole, UserProfile } from "@/types";
import { Database } from "@/types/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
}

const DEMO_USERS: Record<string, UserProfile> = {
  "farmer@kisansetu.in": {
    id: "f1111111-1111-1111-1111-111111111111",
    fullName: "Ramesh Singh",
    phoneNumber: "9876543210",
    role: "FARMER",
    preferredLanguage: "hi",
    district: "Ludhiana",
    state: "Punjab",
    created_at: new Date().toISOString(),
  },
  "staff@kisansetu.in": {
    id: "e2222222-2222-2222-2222-222222222222",
    fullName: "Gurpreet Singh",
    phoneNumber: "9876543211",
    role: "CENTRE_STAFF",
    preferredLanguage: "pa",
    assignedCentreId: "b1000000-0000-0000-0000-000000000001",
    district: "Ludhiana",
    state: "Punjab",
    created_at: new Date().toISOString(),
  },
  "admin@kisansetu.in": {
    id: "a3333333-3333-3333-3333-333333333333",
    fullName: "Dr. A. K. Sharma",
    phoneNumber: "9876543212",
    role: "ADMIN",
    preferredLanguage: "en",
    district: "Ludhiana",
    state: "Punjab",
    created_at: new Date().toISOString(),
  },
};

/**
 * Checks if current Supabase client is configured with valid production credentials.
 */
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.length > 0 && !url.includes("placeholder-project");
}

/**
 * Registers a new Farmer user with safe default role 'FARMER'.
 * Admin/Staff role assignment is strictly prohibited during public registration.
 */
export async function signUpFarmer(data: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  preferredLanguage: string;
  district?: string;
  state?: string;
}): Promise<{ success: boolean; error?: string; user?: UserProfile; requiresConfirmation?: boolean }> {
  const districtName = data.district || "Ludhiana";
  const stateName = data.state || "Punjab";

  try {
    const supabase = getSupabaseBrowserClient();

    // 1. Register account with Supabase Auth
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: {
          full_name: data.fullName.trim(),
          phone_number: data.phoneNumber.trim(),
          role: "FARMER",
          preferred_language: data.preferredLanguage,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (authData.user) {
      // 2. Explicitly upsert profile record in public.profiles table
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .upsert({
          id: authData.user.id,
          full_name: data.fullName.trim(),
          phone_number: data.phoneNumber.trim(),
          role: "FARMER",
          preferred_language: data.preferredLanguage,
          district: districtName,
          state: stateName,
        });

      if (profileError) {
        console.warn("Profile table sync notice:", profileError.message);
      }

      // Check if email confirmation is required (no session returned)
      if (!authData.session) {
        return {
          success: true,
          requiresConfirmation: true,
        };
      }

      const userProfile: UserProfile = {
        id: authData.user.id,
        fullName: data.fullName.trim(),
        phoneNumber: data.phoneNumber.trim(),
        role: "FARMER",
        preferredLanguage: data.preferredLanguage,
        district: districtName,
        state: stateName,
        created_at: authData.user.created_at || new Date().toISOString(),
      };

      try {
        localStorage.setItem("kisan_setu_user", JSON.stringify(userProfile));
      } catch {
        // Ignore storage error
      }

      return { success: true, user: userProfile };
    }

    return { success: false, error: "Failed to create user account" };
  } catch (e: any) {
    return { success: false, error: e?.message || "Registration service unavailable" };
  }
}

/**
 * Signs in user with email and password, retrieving authenticated profile role from database.
 */
export async function signInUser(data: {
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
  try {
    const supabase = getSupabaseBrowserClient();

    // 1. Authenticate with Supabase Auth
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email.trim(),
      password: data.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (authData.user && authData.session) {
      // 2. Fetch profile from public.profiles table
      let { data: rawProfile } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      const metadata = authData.user.user_metadata || {};

      // If profile row doesn't exist yet, attempt to insert it
      if (!rawProfile) {
        const defaultRole = (metadata.role || "FARMER") as UserRole;
        const { data: newProfile } = await (supabase as any)
          .from("profiles")
          .upsert({
            id: authData.user.id,
            full_name: metadata.full_name || authData.user.email || "Farmer User",
            phone_number: metadata.phone_number || "",
            role: defaultRole,
            preferred_language: metadata.preferred_language || "hi",
            district: "Ludhiana",
            state: "Punjab",
          })
          .select()
          .single();

        rawProfile = newProfile;
      }

      const profile = rawProfile as ProfileRow | null;
      const role: UserRole = (profile?.role || metadata.role || "FARMER") as UserRole;

      const userProfile: UserProfile = {
        id: authData.user.id,
        fullName: profile?.full_name || metadata.full_name || authData.user.email || "Farmer User",
        phoneNumber: profile?.phone_number || metadata.phone_number || "",
        role,
        preferredLanguage: profile?.preferred_language || metadata.preferred_language || "hi",
        assignedCentreId: profile?.assigned_centre_id || metadata.assigned_centre_id,
        district: profile?.district || "Ludhiana",
        state: profile?.state || "Punjab",
        created_at: profile?.created_at || authData.user.created_at,
      };

      try {
        localStorage.setItem("kisan_setu_user", JSON.stringify(userProfile));
      } catch {
        // Ignore storage error
      }

      return { success: true, user: userProfile };
    }

    return { success: false, error: "Failed to establish authenticated session" };
  } catch (e: any) {
    return { success: false, error: e?.message || "Authentication service unavailable" };
  }
}

/**
 * Async session recovery & profile fetching directly from Supabase.
 */
export async function getCurrentUserAsync(): Promise<UserProfile | null> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: authData, error } = await supabase.auth.getUser();

    if (error || !authData?.user) {
      try {
        localStorage.removeItem("kisan_setu_user");
      } catch {
        // Ignore
      }
      return null;
    }

    // Fetch user profile from public.profiles
    const { data: rawProfile } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    const profile = rawProfile as ProfileRow | null;
    const metadata = authData.user.user_metadata || {};
    const role: UserRole = (profile?.role || metadata.role || "FARMER") as UserRole;

    const userProfile: UserProfile = {
      id: authData.user.id,
      fullName: profile?.full_name || metadata.full_name || authData.user.email || "Farmer User",
      phoneNumber: profile?.phone_number || metadata.phone_number || "",
      role,
      preferredLanguage: profile?.preferred_language || metadata.preferred_language || "hi",
      assignedCentreId: profile?.assigned_centre_id || metadata.assigned_centre_id,
      district: profile?.district || "Ludhiana",
      state: profile?.state || "Punjab",
      created_at: profile?.created_at || authData.user.created_at,
    };

    try {
      localStorage.setItem("kisan_setu_user", JSON.stringify(userProfile));
    } catch {
      // Ignore
    }

    return userProfile;
  } catch {
    try {
      localStorage.removeItem("kisan_setu_user");
    } catch {
      // Ignore
    }
    return null;
  }
}

/**
 * Signs out current user session.
 */
export async function signOutUser(): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore error
  }

  try {
    localStorage.removeItem("kisan_setu_user");
  } catch {
    // Storage error
  }
}

/**
 * Sends password reset email.
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: "Password reset service unavailable" };
    }
  }

  return { success: true };
}

/**
 * Updates user password from reset token.
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: "Password update service unavailable" };
    }
  }

  return { success: true };
}

/**
 * Retrieves currently active authenticated user profile synchronously from localStorage.
 */
export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem("kisan_setu_user");
    if (saved) {
      return JSON.parse(saved) as UserProfile;
    }
  } catch {
    return null;
  }

  return null;
}
