"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { LoadingScreen } from "@/components/layout/LoadingScreen";

const LandingView = dynamic(() => import("@/views/LandingView"), { ssr: false, loading: () => <LoadingScreen /> });
const MasukView = dynamic(() => import("@/views/MasukView"), { ssr: false, loading: () => <LoadingScreen /> });
const AppView = dynamic(() => import("@/views/AppView"), { ssr: false, loading: () => <LoadingScreen /> });
const WorkspaceView = dynamic(() => import("@/views/WorkspaceView"), { ssr: false, loading: () => <LoadingScreen /> });
const AdminView = dynamic(() => import("@/views/AdminView"), { ssr: false, loading: () => <LoadingScreen /> });
const HargaView = dynamic(() => import("@/views/HargaView"), { ssr: false, loading: () => <LoadingScreen /> });
const KebijakanPrivasiView = dynamic(() => import("@/views/KebijakanPrivasiView"), { ssr: false, loading: () => <LoadingScreen /> });
const UiView = dynamic(() => import("@/views/UiView"), { ssr: false, loading: () => <LoadingScreen /> });

export function ClientRouter() {
  const nextPathname = usePathname();
  const [path, setPath] = useState<string>("/");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const updatePath = () => {
      setPath(window.location.pathname.replace(/\/$/, "") || "/");
    };
    updatePath();
    setMounted(true);
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  const activePath = mounted ? (nextPathname?.replace(/\/$/, "") || path) : "/";

  if (!mounted) {
    return <LandingView />;
  }

  if (activePath === "/masuk") return <MasukView />;
  if (activePath.startsWith("/admin")) return <AdminView />;
  if (activePath.startsWith("/app/workspace")) return <WorkspaceView />;
  if (activePath === "/app") return <AppView />;
  if (activePath === "/harga") return <HargaView />;
  if (activePath === "/kebijakan-privasi") return <KebijakanPrivasiView />;
  if (activePath === "/ui") return <UiView />;

  return <LandingView />;
}
