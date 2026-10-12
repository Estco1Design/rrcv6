"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "sold-out" | "pre-order" | "limited" | "sale" | "default";
  children: string;
}

export function Badge({ variant = "default", children }: BadgeProps) {
  const variants = {
    "sold-out": "bg-rrc-muted text-rrc-black",
    "pre-order": "bg-rrc-navy text-rrc-white",
    limited: "bg-rrc-wine text-rrc-white",
    sale: "bg-rrc-bordeaux text-rrc-white",
    default: "bg-rrc-panel text-rrc-white",
  };

  return (
    <span
      className={cn(
        "inline-block px-2 py-1 text-[9px] font-mono tracking-widest uppercase",
        variants[variant]
      )}
    >
      {children}
    </span>
  );
}
