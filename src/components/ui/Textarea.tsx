"use client";

import { useEffect, useId, useRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
  autoResize?: boolean;
  showCount?: boolean;
  containerClassName?: string;
}

export function Textarea({
  label,
  error,
  helper,
  autoResize = false,
  showCount = false,
  containerClassName,
  className,
  id,
  value,
  maxLength,
  onChange,
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const helperId = `${textareaId}-helper`;
  const errorId = `${textareaId}-error`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const descriptionId = error ? errorId : helper ? helperId : undefined;
  const currentLength = typeof value === "string" ? value.length : 0;

  useEffect(() => {
    if (!autoResize) return;
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight, 96)}px`;
  }, [autoResize, value]);

  return (
    <div className={cn("w-full", containerClassName)}>
      {label ? (
        <label htmlFor={textareaId} className="neu-label">
          {label}
          {rest.required ? <span className="ml-1 text-danger">*</span> : null}
        </label>
      ) : null}
      <textarea
        ref={textareaRef}
        id={textareaId}
        className={cn("neu-field", className)}
        value={value}
        maxLength={maxLength}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionId}
        {...rest}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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
        {showCount && maxLength ? (
          <p className="mt-1.5 shrink-0 text-xs font-semibold text-muted" aria-live="polite">
            {currentLength}/{maxLength}
          </p>
        ) : null}
      </div>
    </div>
  );
}
