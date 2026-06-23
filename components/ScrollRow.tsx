import type { ReactNode } from "react";

export function ScrollRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`scroll-x -mx-4 px-4 md:mx-0 md:overflow-visible md:px-0 ${className}`}>{children}</div>;
}
