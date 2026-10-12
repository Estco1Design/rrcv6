"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode, MouseEvent } from "react";
import { useEffect, useRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "solid",
  size = "md",
  fullWidth = false,
  className,
  children,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  const handleRipple = (e: MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement("span");
    ripple.className = "absolute rounded-full bg-rrc-wine/30 animate-liquid-ripple pointer-events-none";
    ripple.style.left = `${x - 10}px`;
    ripple.style.top = `${y - 10}px`;
    ripple.style.width = "20px";
    ripple.style.height = "20px";

    buttonRef.current.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 500);

    onClick?.(e);
  };

  const baseStyles = `
    inline-flex items-center justify-center
    font-mono text-ui tracking-widest uppercase
    transition-all duration-200 ease-out
    disabled:opacity-40 disabled:cursor-not-allowed
    relative overflow-hidden
  `;

  const variants = {
    solid: `
      bg-rrc-wine text-rrc-white border border-rrc-wine
      hover:bg-rrc-bordeaux hover:border-rrc-bordeaux
      active:bg-rrc-red
    `,
    outline: `
      bg-transparent text-rrc-white border border-rrc-line
      hover:border-rrc-wine hover:text-rrc-wine
      active:bg-rrc-wine/10
    `,
    ghost: `
      bg-transparent text-rrc-white
      hover:bg-rrc-panel
      active:bg-rrc-coal
    `,
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3 text-[11px]",
    lg: "px-8 py-4 text-[12px]",
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className
      )}
      disabled={disabled}
      onClick={handleRipple}
      {...props}
    >
      {children}
    </button>
  );
}
