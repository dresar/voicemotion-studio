"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { id } from "@/lib/i18n/id";
import { useAuthStore } from "@/store/auth";

function LoginContent() {
  const router = useRouter();
  const hydrated = useAuthStore((state) => state.hydrated);
  const token = useAuthStore((state) => state.token);
  const loginEmail = useAuthStore((state) => state.loginEmail);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activePreset, setActivePreset] = useState<"admin" | "creator" | null>(null);

  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (hydrated && token) {
      router.replace("/app");
    }
  }, [hydrated, token, router]);

  function fillPreset(type: "admin" | "creator") {
    setActivePreset(type);
    if (type === "admin") {
      setIdentifier("admin");
      setPassword("AdminLocal2026!");
    } else {
      setIdentifier("demo");
      setPassword("Kreator2026!");
    }
    setIdentifierError("");
    setPasswordError("");
    setFormError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextIdentError = identifier.trim() ? "" : "Email atau username wajib diisi.";
    const nextPasswordError = password ? "" : id.auth.passwordRequired;
    setIdentifierError(nextIdentError);
    setPasswordError(nextPasswordError);
    if (nextIdentError || nextPasswordError) return;

    setSubmitting(true);
    setFormError("");
    const result = await loginEmail(identifier.trim(), password);
    setSubmitting(false);

    if (result.ok) {
      router.replace("/app");
      return;
    }
    setFormError(result.error ?? "Email/username atau password salah.");
  }

  if (hydrated && token) {
    return <LoadingScreen message="Mengalihkan ke workspace..." />;
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4 py-8">
      <Card padding="lg" className="w-full max-w-[440px] shadow-neu-lg">
        <div className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink">{id.auth.title}</h1>
          <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted">
            Masuk dengan akun Admin atau Kreator Anda
          </p>
        </div>

        {/* Quick Fill Preset Buttons */}
        <div className="mt-6 rounded-xl border border-line bg-sunken p-3 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Isi Kredensial Cepat:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillPreset("admin")}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                activePreset === "admin"
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-bg text-ink border-line hover:border-primary/50 shadow-neu-xs"
              }`}
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => fillPreset("creator")}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                activePreset === "creator"
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-bg text-ink border-line hover:border-primary/50 shadow-neu-xs"
              }`}
            >
              🎨 Demo Kreator
            </button>
          </div>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email atau Username"
            type="text"
            autoComplete="username"
            placeholder="admin atau nama@domain.com"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value);
              setActivePreset(null);
              setIdentifierError("");
              setFormError("");
            }}
            error={identifierError}
            required
          />
          <Input
            label={id.auth.password}
            type="password"
            autoComplete="current-password"
            placeholder={id.auth.passwordPlaceholder}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
              setFormError("");
            }}
            error={passwordError}
            required
          />

          {formError ? (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
              {formError}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={submitting}
            rightIcon={<Icon name="arrowRight" size={18} />}
          >
            {submitting ? id.auth.submitting : "Masuk"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted">{id.auth.trialNote}</p>
        <div className="mt-5 text-center">
          <Link href="/kebijakan-privasi" className="text-xs font-bold text-muted underline-offset-4 hover:text-primary-strong">
            {id.auth.privacy}
          </Link>
        </div>
      </Card>
    </main>
  );
}

export default function MasukView() {
  return (
    <Suspense fallback={<LoadingScreen message="Memuat halaman masuk..." />}>
      <LoginContent />
    </Suspense>
  );
}
