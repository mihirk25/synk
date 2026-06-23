"use client";

import { usePathname } from "next/navigation";
import { ManagerAppProvider } from "@/context/ManagerAppContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;
  return <ManagerAppProvider>{children}</ManagerAppProvider>;
}
