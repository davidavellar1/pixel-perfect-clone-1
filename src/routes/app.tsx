import { createFileRoute } from "@tanstack/react-router";
import ProtectedRoute from "@/components/ProtectedRoute";
import PlatformLayout from "@/pages/platform/PlatformLayout";

export const Route = createFileRoute("/app")({
  // The signed-in area reads the browser-held session, so it renders client-side.
  ssr: false,
  component: AppArea,
});

// PlatformLayout renders the nested pages through its own <Outlet />.
function AppArea() {
  return (
    <ProtectedRoute>
      <PlatformLayout />
    </ProtectedRoute>
  );
}
