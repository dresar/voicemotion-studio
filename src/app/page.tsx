"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { readToken } from "@/lib/authToken";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = readToken();
    router.replace(token ? "/app/" : "/masuk/");
  }, [router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6">
      <Logo size="lg" />
      <p className="text-sm font-semibold text-muted">Menyiapkan workspace...</p>
    </main>
  );
}
