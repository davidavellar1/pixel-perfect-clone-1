import { Navigate, useLocation } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

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
