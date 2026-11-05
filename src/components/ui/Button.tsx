"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "neu-btn neu-btn--primary",
  secondary: "neu-btn",
  ghost: "neu-btn neu-btn--ghost",
  danger: "neu-btn neu-btn--danger"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-[30px] px-2.5 text-[11px] font-semibold rounded-md",
  md: "min-h-[34px] px-3.5 text-xs font-semibold rounded-lg",
  lg: "min-h-[38px] px-4 text-[13px] font-bold rounded-lg"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(variantClasses[variant], sizeClasses[size], fullWidth && "w-full", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Icon name="loader" size={18} className="animate-spin" /> : leftIcon}
      <span className="min-w-0">{children}</span>
      {!loading && rightIcon}
    </button>
  );
});
