import { createFileRoute, Outlet } from "@tanstack/react-router";
import ProtectedRoute from "@/components/ProtectedRoute";
import PlatformLayout from "@/pages/platform/PlatformLayout";

export const Route = createFileRoute("/app")({
  // The signed-in area reads the browser-held session, so it renders client-side.
  ssr: false,
  component: AppArea,
});

function AppArea() {
  return (
    <ProtectedRoute>
      <PlatformLayout />
    </ProtectedRoute>
  );
}

// PlatformLayout renders its own <Outlet /> for the nested pages.
export { Outlet };
