/**
 * Thin compatibility layer that maps the small router surface used across the
 * app onto TanStack Router. Paths are plain strings, navigation goes through
 * the TanStack router instance (no full page reloads).
 */
import {
  Outlet,
  useLocation as useTanStackLocation,
  useParams as useTanStackParams,
  useRouter,
} from "@tanstack/react-router";
import { forwardRef, useCallback, useEffect, useMemo, type AnchorHTMLAttributes } from "react";

export { Outlet };

type AnyTo = string;

function useGo() {
  const router = useRouter();
  return useCallback(
    (to: AnyTo, options?: { replace?: boolean }) => {
      void router.navigate({ to, replace: options?.replace } as never);
    },
    [router],
  );
}

export function useNavigate() {
  const go = useGo();
  return useCallback(
    (to: AnyTo | number, options?: { replace?: boolean }) => {
      if (typeof to === "number") {
        if (typeof window !== "undefined") window.history.go(to);
        return;
      }
      go(to, options);
    },
    [go],
  );
}

export function useLocation() {
  const loc = useTanStackLocation();
  return useMemo(
    () => ({
      pathname: loc.pathname,
      search: loc.searchStr ? (loc.searchStr.startsWith("?") ? loc.searchStr : `?${loc.searchStr}`) : "",
      hash: loc.hash ? (loc.hash.startsWith("#") ? loc.hash : `#${loc.hash}`) : "",
      key: loc.pathname + loc.searchStr,
      state: {} as Record<string, unknown>,
    }),
    [loc.pathname, loc.searchStr, loc.hash],
  );
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  return useTanStackParams({ strict: false }) as T;
}

export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams, options?: { replace?: boolean }) => void,
] {
  const location = useLocation();
  const go = useGo();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const setParams = useCallback(
    (next: URLSearchParams, options?: { replace?: boolean }) => {
      const qs = next.toString();
      go(qs ? `${location.pathname}?${qs}` : location.pathname, options);
    },
    [go, location.pathname],
  );
  return [params, setParams];
}

export function Navigate({ to, replace }: { to: AnyTo; replace?: boolean }) {
  const go = useGo();
  useEffect(() => {
    go(to, { replace });
  }, [go, to, replace]);
  return null;
}

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: AnyTo;
  replace?: boolean;
  state?: unknown;
  end?: boolean;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, replace, state: _state, end: _end, onClick, target, children, ...rest }, ref) => {
    const go = useGo();
    return (
      <a
        {...rest}
        ref={ref}
        href={to}
        target={target}
        onClick={(event) => {
          onClick?.(event);
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            (target && target !== "_self")
          ) {
            return;
          }
          event.preventDefault();
          go(to, { replace });
        }}
      >
        {children}
      </a>
    );
  },
);
Link.displayName = "Link";

type NavClassName = string | ((state: { isActive: boolean; isPending: boolean }) => string);

export interface NavLinkProps extends Omit<LinkProps, "className"> {
  className?: NavClassName;
}

function isPathActive(current: string, to: string, end?: boolean) {
  const target = to.split("?")[0].split("#")[0];
  const normalized = target.length > 1 && target.endsWith("/") ? target.slice(0, -1) : target;
  if (end || normalized === "/") return current === normalized;
  return current === normalized || current.startsWith(`${normalized}/`);
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, to, end, ...rest }, ref) => {
    const { pathname } = useLocation();
    const isActive = isPathActive(pathname, to, end);
    const resolved = typeof className === "function" ? className({ isActive, isPending: false }) : className;
    return (
      <Link
        {...rest}
        ref={ref}
        to={to}
        end={end}
        className={resolved}
        aria-current={isActive ? "page" : undefined}
        data-status={isActive ? "active" : undefined}
      />
    );
  },
);
NavLink.displayName = "NavLink";
