import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CountryProfile } from "@/lib/countryProfile";

export function useCountryProfile(code: string | null | undefined) {
  const cc = code?.trim().toUpperCase() ?? "";
  const [state, setState] = useState<{ code: string; row: CountryProfile | null; loading: boolean; failed: boolean }>({ code: "", row: null, loading: false, failed: false });
  useEffect(() => {
    if (!/^[A-Z]{2}$/.test(cc)) { setState({ code: cc, row: null, loading: false, failed: false }); return; }
    let active = true;
    setState({ code: cc, row: null, loading: true, failed: false });
    void supabase.from("country_profile").select("*").eq("country_code", cc).maybeSingle().then(({ data, error }) => {
      if (active) setState({ code: cc, row: data ?? null, loading: false, failed: Boolean(error) });
    });
    return () => { active = false; };
  }, [cc]);
  return { row: state.code === cc ? state.row : null, loading: state.code !== cc || state.loading, failed: state.failed };
}
