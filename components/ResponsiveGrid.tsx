import type { ReactNode } from "react";

const COLS_CLASS = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  7: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7",
} as const;

type Cols = keyof typeof COLS_CLASS;

export function ResponsiveGrid({
  cols,
  children,
  className = "",
}: {
  cols: Cols;
  children: ReactNode;
  className?: string;
}) {
  return <div className={`grid gap-4 ${COLS_CLASS[cols]} ${className}`}>{children}</div>;
}
