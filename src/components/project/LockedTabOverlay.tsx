import { Lock, TrendingUp, Building2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LockedTabOverlayProps {
  tabName: string;
  children: React.ReactNode;
  /** "signin" = visitor not signed in, "interest" = signed in but no accepted request */
  mode?: "signin" | "interest";
  /** A request is already with the developer, so there is nothing to send. */
  pending?: boolean;
  onExpressInterest?: () => void;
  description?: string;
}

const LockedTabOverlay = ({
  tabName,
  children,
  mode = "signin",
  pending = false,
  onExpressInterest,
  description,
}: LockedTabOverlayProps) => {
  const location = useLocation();
  const redirect = encodeURIComponent(location.pathname + location.search);

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[6px] opacity-60 max-h-[520px] overflow-hidden" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-start justify-center bg-gradient-to-b from-background/40 via-background/80 to-background pt-16">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Lock className="h-5 w-5 text-accent" />
          </div>

          {mode === "interest" ? (
            <>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {pending ? "Awaiting the developer's decision" : "The developer decides who sees this"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {pending
                  ? `Your request is with the developer. The ${tabName.toLowerCase()} detail unlocks if they accept.`
                  : description ||
                    `The full ${tabName.toLowerCase()} detail reveals once the developer accepts your request.`}
              </p>
              <Button
                onClick={onExpressInterest}
                disabled={pending}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                {pending ? "Request pending" : "Express interest"}
              </Button>
            </>
          ) : (
            <>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {tabName} data is for members
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Sign in to view the full {tabName.toLowerCase()} details of this project.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href={`/signin?redirect=${redirect}`} className="flex-1">
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                    <TrendingUp className="h-4 w-4" /> Sign in as investor
                  </Button>
                </a>
                <a href={`/developer-signup?redirect=${redirect}`} className="flex-1">
                  <Button variant="outline" className="w-full font-medium">
                    <Building2 className="h-4 w-4" /> Join as developer
                  </Button>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LockedTabOverlay;
