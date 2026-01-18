import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export function LoadingSpinner({
  size = "md",
  className,
  text,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      <Loader2
        className={cn("animate-spin text-emerald-500", sizeClasses[size])}
      />
      {text && (
        <p className={cn("text-slate-400", textSizeClasses[size])}>{text}</p>
      )}
    </div>
  );
}

export function LoadingSpinnerFullScreen({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}

export function LoadingSpinnerInline({
  text,
  className,
}: { text?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
      {text && <span className="text-sm text-slate-400">{text}</span>}
    </div>
  );
}
