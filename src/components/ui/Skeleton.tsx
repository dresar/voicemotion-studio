import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

export function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  const roundedClass = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full"
  }[rounded];
  return <div aria-hidden="true" className={cn("neu-shimmer", roundedClass, className)} />;
}
