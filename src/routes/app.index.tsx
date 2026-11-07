import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { homePathFor } from "@/lib/navigation";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

// The first page depends on what the member said brought them here, which is only known client-side.
function AppHome() {
  const { intents, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={homePathFor(intents)} replace />;
}
