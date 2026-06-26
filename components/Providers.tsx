"use client";

import { usePathname } from "next/navigation";
import { ManagerAppProvider } from "@/context/ManagerAppContext";

const PUBLIC_PATHS = new Set(["/", "/login", "/staff"]);

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (PUBLIC_PATHS.has(pathname)) return <>{children}</>;

  if (pathname === "/close") {
    return (
      <ManagerAppProvider authRedirect="/staff" logoutRedirect="/" staffSession>
        {children}
      </ManagerAppProvider>
    );
  }

  return (
    <ManagerAppProvider authRedirect="/login" logoutRedirect="/" managerSession>
      {children}
    </ManagerAppProvider>
  );
}
