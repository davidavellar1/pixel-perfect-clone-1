import { Navigate, useLocation } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
  </div>
);

// The signed-in workspace is the same for every member: being signed in is the only gate.
// What each member may see inside a project is still enforced by the access gate and RLS.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  if (!user) {
    const target = location.pathname + location.search;
    const to = target.startsWith("/app")
      ? `/sign-in?redirect=${encodeURIComponent(target)}`
      : "/sign-in";
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
