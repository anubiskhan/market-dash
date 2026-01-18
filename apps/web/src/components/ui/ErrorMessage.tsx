import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorMessageProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
  variant?: "inline" | "card" | "fullscreen";
}

export function ErrorMessage({
  title = "Something went wrong",
  message,
  error,
  onRetry,
  className,
  variant = "card",
}: ErrorMessageProps) {
  const displayMessage =
    message || error?.message || "An unexpected error occurred. Please try again.";

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm",
          className
        )}
      >
        <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
        <div className="flex-1 space-y-1">
          <p className="font-medium text-red-500">{title}</p>
          <p className="text-red-400">{displayMessage}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 text-red-500 hover:text-red-400 transition-colors"
            aria-label="Retry"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-500/10 p-3">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {title}
            </h2>
            <p className="text-slate-400">{displayMessage}</p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-700 bg-slate-800 p-6",
        className
      )}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="rounded-full bg-red-500/10 p-3">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400 max-w-sm">{displayMessage}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
