import React from "react";
import { Badge } from "@/components/ui/badge";

interface RetiringBadgeProps {
  className?: string;
  variant?: "badge" | "compact" | "iconOnly";
  showTooltip?: boolean;
}

export const RetiringBadge: React.FC<RetiringBadgeProps> = ({
  className = "",
  variant = "badge",
  showTooltip = true,
}) => {
  const tooltipText =
    "34 anni: questo calciatore disputerà la sua ultima stagione e si ritirerà al termine del campionato.";

  if (variant === "iconOnly") {
    return (
      <span
        className={`inline-flex items-center text-amber-500 cursor-help ${className}`}
        title={showTooltip ? tooltipText : undefined}
      >
        ⏳
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <Badge
        variant="outline"
        className={`bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold text-[9px] px-1.5 py-0 h-4 leading-none rounded-sm flex items-center gap-0.5 shrink-0 shadow-xs cursor-help select-none ${className}`}
        title={showTooltip ? tooltipText : undefined}
      >
        <span>⏳</span>
        <span>Ultima Stagione</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 shadow-xs cursor-help select-none ${className}`}
      title={showTooltip ? tooltipText : undefined}
    >
      <span>⏳</span>
      <span>Ultima Stagione</span>
    </Badge>
  );
};
