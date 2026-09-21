import { createContext, useContext } from "react";

interface AppShellContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const AppShellContext = createContext<AppShellContextValue>({ collapsed: false, toggleCollapsed: () => undefined });

export const AppShellProvider = AppShellContext.Provider;
export const useAppShell = () => useContext(AppShellContext);
