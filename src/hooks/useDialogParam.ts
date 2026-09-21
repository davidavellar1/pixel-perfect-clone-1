import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * Keeps a dialog's open state in the URL so the state is linkable and the
 * browser back button closes the dialog.
 */
export function useDialogParam(param: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const value = searchParams.get(param);

  const open = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(param, next);
      setSearchParams(params);
    },
    [param, searchParams, setSearchParams],
  );

  const close = useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) {
      navigate(-1);
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.delete(param);
    setSearchParams(params, { replace: true });
  }, [navigate, param, searchParams, setSearchParams]);

  return { value, open, close };
}
