import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { claimPendingSignup } from "@/lib/googleSignup";
import type { Session, User } from "@supabase/supabase-js";

interface Profile {
  display_name?: string | null;
  company_name?: string | null;
  [key: string]: any;
}

export type AppView = "investor" | "developer" | "both";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  view: AppView;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const METADATA_ROLE_MAP: Record<string, string[]> = {
  dev: ["developer"],
  developer: ["developer"],
  inv: ["investor"],
  investor: ["investor"],
  both: ["investor", "developer"],
  other: ["investor"],
};

const rolesFromMetadata = (meta: Profile): string[] => {
  const out = new Set<string>();
  const add = (v: unknown) => {
    if (typeof v !== "string") return;
    (METADATA_ROLE_MAP[v] ?? [v]).forEach((r) => out.add(r));
  };
  if (Array.isArray(meta.roles)) meta.roles.forEach(add);
  add(meta.role);
  add(meta.user_type);
  return out.size ? [...out] : ["investor"];
};

const deriveView = (roles: string[]): AppView => {
  const dev = roles.includes("developer");
  const inv = roles.includes("investor");
  const admin = roles.includes("admin");
  if (dev && !inv && !admin) return "developer";
  if (admin || (inv && dev)) return "both";
  return "investor";
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [sessionReady, setSessionReady] = useState(false);
  const [rolesFor, setRolesFor] = useState<string | null>(null);

  useEffect(() => {
    const apply = (s: Session | null) => {
      setSession(s);
      setUser((prev) => (prev?.id === s?.user?.id ? prev ?? s?.user ?? null : s?.user ?? null));
      if (s?.user) {
        const meta = (s.user.user_metadata || {}) as Profile;
        setProfile({
          display_name: meta.display_name || meta.full_name || null,
          company_name: meta.company_name || null,
        });
      } else {
        setProfile(null);
        setRoles([]);
        setRolesFor(null);
      }
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => apply(s));
    supabase.auth.getSession().then(({ data }) => {
      apply(data.session);
      setSessionReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Roles come from the user_role table; metadata is only a fallback.
  useEffect(() => {
    if (!user) return;
    let active = true;
    const userId = user.id;
    const meta = (user.user_metadata || {}) as Profile;
    void supabase
      .from("user_role")
      .select("role")
      .eq("user_id", userId)
      .then(({ data, error }) => {
        if (!active) return;
        const fromDb = (data || []).map((r) => r.role as string);
        setRoles(!error && fromDb.length ? fromDb : rolesFromMetadata(meta));
        setRolesFor(userId);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const loading = !sessionReady || (!!user && rolesFor !== user.id);
  const view = deriveView(roles);

  // Someone who signed up with Google has their persona waiting in the browser.
  useEffect(() => {
    if (!user) return;
    let active = true;
    void claimPendingSignup().then((destination) => {
      if (active && destination) window.location.replace(destination);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, view, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
