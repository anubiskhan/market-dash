import {
  FileQuestion,
  Inbox,
  Search,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "default" | "search" | "data";
}

const iconMap = {
  default: Inbox,
  search: Search,
  data: TrendingUp,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  const Icon = icon || iconMap[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-lg border border-slate-700 bg-slate-800",
        className
      )}
    >
      <div className="rounded-full bg-slate-700 p-4 mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function EmptyStateInline({
  icon = FileQuestion,
  title,
  description,
  className,
}: Omit<EmptyStateProps, "action" | "variant">) {
  const Icon = icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-md bg-slate-800/50",
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0 text-slate-400" />
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-white">{title}</p>
        {description && (
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

export function EmptyStateMinimal({
  title,
  className,
}: { title: string; className?: string }) {
  return (
    <div className={cn("py-12 text-center", className)}>
      <p className="text-sm text-slate-400">{title}</p>
    </div>
  );
}
