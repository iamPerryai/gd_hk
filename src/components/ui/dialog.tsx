"use client";

import { useEffect, useRef, useCallback, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  // Use ref to avoid effect re-execution when parent passes a new onClose (M fix)
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleBackdropClick = useCallback(() => {
    onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleBackdropClick}
      />
      {/* Content */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md mx-4 bg-white rounded-3xl border border-separator shadow-hero p-6 animate-in zoom-in-95 fade-in duration-200",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 text-center sm:text-left mb-4", className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold text-text-primary", className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-text-tertiary", className)} {...props} />
  );
}
