import { AlertOctagon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/actions/Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({ title = "Something went wrong", description, onRetry, retryLabel = "Try again", className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-pill bg-danger-subtle text-danger">
        <AlertOctagon aria-hidden width={24} height={24} strokeWidth={1.5} />
      </span>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>}
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
