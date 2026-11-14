import { Lock, TrendingUp, Building2 } from "lucide-react";
import { Link, useLocation } from "@/lib/router-compat";
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
  locked?: boolean;
}

const LockedTabOverlay = ({
  tabName,
  children,
  mode = "signin",
  pending = false,
  onExpressInterest,
  description,
  locked = true,
}: LockedTabOverlayProps) => {
  const location = useLocation();
  const redirect = encodeURIComponent(location.pathname + location.search);

  if (!locked) return <>{children}</>;

  return (
    <div className="flex min-h-[360px] items-start justify-center pt-8">
      <div className="flex w-full justify-center">
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
                Opens when the developer accepts your request.
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
                Create an account to request access. The developer decides whether the {tabName.toLowerCase()} details unlock.
              </p>
              <div className="flex flex-col gap-3">
                <Button asChild className="w-full"><Link to={`/sign-up?redirect=${redirect}`}>Create a free account</Link></Button>
                <Link to={`/sign-in?redirect=${redirect}`} className="text-sm text-accent underline">Sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LockedTabOverlay;
