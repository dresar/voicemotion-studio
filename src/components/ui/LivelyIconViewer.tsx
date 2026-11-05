"use client";

import React from "react";
import * as Lively from "livelyicons";
import { cn } from "@/lib/utils";
import { findLivelyIcon, type LivelyMotionType } from "@/lib/livelyIconsCatalog";

export interface LivelyIconViewerProps {
  name: string;
  lively?: LivelyMotionType;
  trigger?: "hover" | "click" | "load";
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  loop?: boolean;
}

export function LivelyIconViewer({
  name,
  lively,
  trigger = "hover",
  size = 32,
  strokeWidth = 2,
  className,
  color,
  loop = true
}: LivelyIconViewerProps) {
  const meta = findLivelyIcon(name);
  const componentName = meta ? meta.componentName : name;
  const motionType = lively || (meta ? meta.defaultMotion : "draw");

  const IconComponent = (Lively as unknown as Record<string, React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
    animated?: boolean;
    lively?: string;
    trigger?: string;
  }>>)[componentName];

  if (!IconComponent) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color || "currentColor"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "inline-block transition-transform duration-300",
          loop && "animate-pulse",
          className
        )}
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center transition-transform",
        loop && motionType === "pulse" && "animate-pulse",
        loop && motionType === "bounce" && "animate-bounce",
        loop && motionType === "spin" && "animate-spin",
        className
      )}
      style={color ? { color } : undefined}
    >
      <IconComponent
        size={size}
        strokeWidth={strokeWidth}
        lively={motionType}
        trigger={trigger}
        animated={true}
      />
    </span>
  );
}

