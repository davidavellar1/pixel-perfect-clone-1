import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

// Google does not carry our sign-up form fields, so the chosen persona is parked
// in the browser and claimed as soon as the session comes back.
const PENDING_KEY = "dhc.pendingSignup";

export type SignupRole = "investor" | "developer";

interface PendingSignup {
  roles: SignupRole[];
  fullName: string;
  company: string;
  destination: string;
}

export const startGoogleSignup = async (pending: Partial<PendingSignup> & { roles: SignupRole[] }) => {
  const payload: PendingSignup = {
    roles: pending.roles,
    fullName: pending.fullName?.trim() || "",
    company: pending.company?.trim() || "",
    destination: pending.destination || "/app/opportunities",
  };
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
  } catch {
    // Private-mode browsers simply lose the persona; the account still works.
  }
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (result.error) {
    localStorage.removeItem(PENDING_KEY);
    throw result.error;
  }
  return result;
};

const readPending = (): PendingSignup | null => {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSignup;
    return Array.isArray(parsed.roles) && parsed.roles.length ? parsed : null;
  } catch {
    return null;
  }
};

// Called once a session exists. Writes the persona and profile, then hands back
// where the new member should land.
export const claimPendingSignup = async (): Promise<string | null> => {
  const pending = readPending();
  if (!pending) return null;
  localStorage.removeItem(PENDING_KEY);
  for (const role of pending.roles) {
    const { error } = await supabase.rpc("claim_signup_role", {
      _role: role,
      _full_name: pending.fullName,
      _company: pending.company,
    });
    if (error) console.error("Could not save the sign-up role", error);
  }
  return pending.destination;
};
