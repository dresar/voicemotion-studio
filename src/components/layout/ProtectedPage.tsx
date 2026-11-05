"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { useAuthStore } from "@/store/auth";

function ProtectedPageInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tokenQuery = searchParams.get("token");
  const hydrated = useAuthStore((state) => state.hydrated);
  const token = useAuthStore((state) => state.token);
  const [processingToken, setProcessingToken] = useState(Boolean(tokenQuery));

  useEffect(() => {
    if (tokenQuery) {
      setProcessingToken(true);
      void useAuthStore
        .getState()
        .loginWithToken(tokenQuery)
        .finally(() => {
          setProcessingToken(false);
          router.replace(pathname);
        });
      return;
    }
    void useAuthStore.getState().hydrate();
  }, [tokenQuery, pathname, router]);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/masuk/");
    }
  }, [hydrated, token, router]);

  if (!hydrated || processingToken) {
    return <LoadingScreen />;
  }

  if (!token) {
    return <LoadingScreen message="Mengalihkan ke halaman masuk..." />;
  }

  return <>{children}</>;
}

export function ProtectedPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ProtectedPageInner>{children}</ProtectedPageInner>
    </Suspense>
  );
}
