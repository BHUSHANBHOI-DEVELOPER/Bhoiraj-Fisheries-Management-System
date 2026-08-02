import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "super_admin" | "admin" | "member" | null;
export type ActiveProfile = "chairman" | "admin" | "member";

const PROFILE_KEY = "bms.activeProfile";

/** Remembers which portal the person signed in through. */
export function setActiveProfile(profile: ActiveProfile) {
  if (typeof window !== "undefined") window.localStorage.setItem(PROFILE_KEY, profile);
}

export function readActiveProfile(): ActiveProfile {
  if (typeof window === "undefined") return "member";
  const v = window.localStorage.getItem(PROFILE_KEY);
  return v === "chairman" || v === "admin" ? v : "member";
}

type AuthCtx = {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  /** The portal used for this session. Member sessions never carry admin rights. */
  activeProfile: ActiveProfile;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** True when the account holds admin rights, regardless of the active portal. */
  canElevate: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProfile, setProfileState] = useState<ActiveProfile>("member");

  useEffect(() => {
    setProfileState(readActiveProfile());
    const onStorage = () => setProfileState(readActiveProfile());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setProfileState(readActiveProfile());
      if (s?.user) {
        setTimeout(async () => {
          const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id);
          setRoles((data ?? []).map((r) => r.role as Role));
        }, 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        const { data: rs } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
        setRoles((rs ?? []).map((r) => r.role as Role));
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PROFILE_KEY);
      window.location.href = "/";
    }
  };

  const holdsAdmin = roles.includes("admin") || roles.includes("super_admin");
  const holdsSuper = roles.includes("super_admin");

  // A member-portal session is a member session, even for the Chairman or Admin.
  const isAdmin = activeProfile === "member" ? false : holdsAdmin;
  const isSuperAdmin = activeProfile === "admin" && holdsSuper;

  return (
    <Ctx.Provider
      value={{ user, session, roles, loading, activeProfile, isAdmin, isSuperAdmin, canElevate: holdsAdmin, signOut }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
