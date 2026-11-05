import { cn } from "@/lib/utils";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const markSizes = {
  sm: "h-9 w-9 rounded-xl",
  md: "h-11 w-11 rounded-2xl",
  lg: "h-14 w-14 rounded-[18px]"
};

const wordSizes = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl"
};

export function Logo({ size = "md", showWordmark = true, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center bg-gradient-to-br from-primary to-primary-strong shadow-neu-sm",
          markSizes[size]
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 40 40" className="h-[62%] w-[62%]" fill="none">
          <path d="M15 10v20l16-10-16-10Z" fill="#FFFFFF" />
          <path d="M9 17v6" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity=".72" />
          <path d="M5 19v2" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity=".48" />
        </svg>
      </span>
      {showWordmark ? (
        <span className={cn("leading-none", wordSizes[size])}>
          <span className="font-extrabold tracking-tight text-ink">VoiceMotion</span>
          <span className="ml-1.5 font-semibold text-muted">Studio</span>
        </span>
      ) : null}
    </span>
  );
}
