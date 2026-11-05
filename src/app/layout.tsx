import type { Metadata, Viewport } from "next";
import "@/styles/tokens.css";
import "@/styles/neumorphism.css";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { PwaRegistrar } from "@/components/layout/PwaRegistrar";

export const metadata: Metadata = {
  title: {
    default: "VoiceMotion Studio",
    template: "%s · VoiceMotion Studio"
  },
  description: "Buat video pendek vertikal dengan suara AI bahasa Indonesia. Ide, narasi, suara, animasi dalam satu alur.",
  applicationName: "VoiceMotion Studio",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg"
  },
  appleWebApp: {
    capable: true,
    title: "VoiceMotion",
    statusBarStyle: "default"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#E4EBF5"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <ToastProvider>
          {children}
          <PwaRegistrar />
        </ToastProvider>
      </body>
    </html>
  );
}
