import { useEffect, useState } from "react";
import { Navigate, useLocation } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

// Areas of the signed-in workspace that only one side of the market may open.
const DEVELOPER_ONLY = [
  "/app/submit-project",
  "/app/developer",
  "/app/my-listings",
  "/app/access-requests",
  "/app/data-room-requests",
];

const INVESTOR_ONLY = ["/app/investor", "/app/my-portfolio", "/app/portfolio"];

const matches = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [roles, setRoles] = useState<AppRole[] | null>(null);

  useEffect(() => {
    if (!user) {
      setRoles(null);
      return;
    }
    let active = true;
    void supabase
      .from("user_role")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (active) setRoles((data || []).map((row) => row.role));
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (loading) return <Spinner />;

  if (!user) {
    const target = location.pathname + location.search;
    const to = target.startsWith("/app")
      ? `/sign-in?redirect=${encodeURIComponent(target)}`
      : "/sign-in";
    return <Navigate to={to} replace />;
  }

  const developerArea = matches(location.pathname, DEVELOPER_ONLY);
  const investorArea = matches(location.pathname, INVESTOR_ONLY);

  if (developerArea || investorArea) {
    // Wait for the role lookup before deciding, so a restricted page never flashes.
    if (roles === null) return <Spinner />;
    // Members with no role row yet keep the previous behaviour and are not locked out.
    if (roles.length > 0) {
      const allowed =
        roles.includes("admin") ||
        (developerArea && roles.includes("developer")) ||
        (investorArea && roles.includes("investor"));
      if (!allowed) return <Navigate to="/app/opportunities" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
