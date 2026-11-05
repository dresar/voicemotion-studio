"use client";

import { useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export function Select({
  label,
  error,
  helper,
  options,
  placeholder,
  containerClassName,
  className,
  id,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helperId = `${selectId}-helper`;
  const errorId = `${selectId}-error`;
  const descriptionId = error ? errorId : helper ? helperId : undefined;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label ? (
        <label htmlFor={selectId} className="neu-label">
          {label}
          {rest.required ? <span className="ml-1 text-danger">*</span> : null}
        </label>
      ) : null}
      <select
        id={selectId}
        className={cn("neu-field", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionId}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
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
