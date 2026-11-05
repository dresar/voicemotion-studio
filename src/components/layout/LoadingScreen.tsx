import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

export function LoadingScreen({ message = "Memuat workspace..." }: { message?: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6" aria-busy="true">
      <Logo size="lg" />
      <span className="flex items-center gap-2 text-sm font-semibold text-muted">
        <Icon name="loader" size={18} className="animate-spin" />
        {message}
      </span>
    </main>
  );
}
