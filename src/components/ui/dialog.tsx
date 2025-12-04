"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function DialogContent({
  children,
  className,
}: DialogContentProps) {
  return (
    <div
      className={cn(
        "relative z-50 w-full max-w-lg rounded-2xl border bg-card p-6 shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

export function DialogTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
  );
}

export function DialogClose({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClose}
      className="h-6 w-6"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Fechar</span>
    </Button>
  );
}

