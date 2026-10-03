import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { homePathFor } from "@/lib/navigation";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

// The landing page depends on the member's role, which is only known client-side.
function AppHome() {
  const { view, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={homePathFor(view)} replace />;
}
