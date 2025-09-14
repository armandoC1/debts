"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** sm = 16px, md = 20px, lg = 24px, xl = 32px */
  size?: "sm" | "md" | "lg" | "xl";
};

const SIZE = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

export function Spinner({ className, size = "md" }: Props) {
  return (
    <Loader2
      className={cn("animate-spin text-primary", SIZE[size], className)}
      aria-label="Cargando..."
      role="status"
    />
  );
}
