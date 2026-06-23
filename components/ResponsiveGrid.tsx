import type { ReactNode } from "react";

const COLS_CLASS = {
  2: "grid-cols-2 min-w-[36rem]",
  3: "grid-cols-3 min-w-[48rem]",
  4: "grid-cols-4 min-w-[64rem]",
  7: "grid-cols-7 min-w-[44rem]",
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
  return (
    <div className="scroll-x -mx-4 px-4 md:mx-0 md:overflow-visible md:px-0">
      <div className={`grid gap-4 ${COLS_CLASS[cols]} md:min-w-0 ${className}`}>{children}</div>
    </div>
  );
}
