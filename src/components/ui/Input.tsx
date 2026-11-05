"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helper,
  containerClassName,
  className,
  id,
  type = "text",
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && passwordVisible ? "text" : type;
  const descriptionId = error ? errorId : helper ? helperId : undefined;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="neu-label">
          {label}
          {rest.required ? <span className="ml-1 text-danger">*</span> : null}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={inputId}
          type={resolvedType}
          className={cn("neu-field", isPassword && "pr-14", className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionId}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-ink"
            onClick={() => setPasswordVisible((current) => !current)}
            aria-label={passwordVisible ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={passwordVisible}
          >
            <Icon name={passwordVisible ? "eyeOff" : "eye"} size={14} />
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="neu-error">
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="neu-help">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
