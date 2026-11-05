"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { id } from "@/lib/i18n/id";

export default function KebijakanPrivasiView() {
  return (
    <main className="min-h-dvh bg-bg pb-12">
      <header className="page-pad safe-top border-b border-line/70 bg-bg-raised/90 backdrop-blur">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3 py-3">
          <Logo size="sm" />
          <Link
            href="/masuk"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-bg px-4 text-xs font-bold text-primary-strong shadow-neu-sm"
          >
            <Icon name="arrowLeft" size={15} />
            {id.auth.title}
          </Link>
        </div>
      </header>

      <div className="page-pad mx-auto w-full max-w-[900px] pt-7">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">{id.privacy.title}</h1>
        <p className="mt-1 text-xs font-semibold text-muted">{id.privacy.updated}</p>

        <Card variant="raised" padding="lg" className="mt-5 space-y-6">
          <p className="text-sm leading-relaxed text-muted">{id.privacy.intro}</p>
          {id.privacy.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-extrabold text-ink">{section.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{section.body}</p>
            </section>
          ))}
          <p className="rounded-md border border-line bg-bg-sunken p-3 text-sm leading-relaxed text-muted">{id.privacy.contact}</p>
        </Card>

        <footer className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-muted">
          <Link href="/masuk" className="hover:text-primary-strong">
            {id.auth.title}
          </Link>
          <Link href="/app/workspace" className="hover:text-primary-strong">
            Studio
          </Link>
        </footer>
      </div>
    </main>
  );
}
