"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedPage } from "@/components/layout/ProtectedPage";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { id } from "@/lib/i18n/id";
import { trialDaysLeft } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

const startOptions: Array<{
  value: string;
  icon: IconName;
  title: string;
  description: string;
}> = [
  { value: "topic", icon: "lightbulb", title: id.start.topicTitle, description: id.start.topicDescription },
  { value: "own_narration", icon: "pen", title: id.start.ownTitle, description: id.start.ownDescription },
  { value: "promo", icon: "shoppingBag", title: id.start.promoTitle, description: id.start.promoDescription }
];

function StartContent() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "Kreator";
  const daysLeft = user ? trialDaysLeft(user.trialEndsAt) : 0;

  function chooseStart(value: string) {
    window.sessionStorage.setItem("voicemotion.startFrom", value);
    router.push("/app/workspace/");
  }

  return (
    <main className="min-h-dvh bg-bg pb-10">
      <header className="page-pad safe-top border-b border-line/70 bg-bg-raised/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 py-3">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-soft px-3 text-xs font-bold text-primary-strong border border-primary/20">
              <Icon name="sparkles" size={14} />
              Open Source
            </span>
            <Avatar name={user?.name ?? firstName} src={user?.avatar} size="sm" />
          </div>
        </div>
      </header>

      <div className="page-pad mx-auto w-full max-w-[720px] pt-8">
        <div className="mb-6">
          <p className="text-sm font-bold text-muted">
            {id.start.greeting}, {firstName}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink md:text-3xl">{id.start.title}</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">{id.start.subtitle}</p>
          {user?.plan === "trial" ? (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-bold text-warning">
              <Icon name="clock" size={14} />
              {daysLeft > 0 ? id.workspace.trialLeft.replace("{days}", String(daysLeft)) : id.workspace.trialEnded}
            </span>
          ) : null}
        </div>

        <div className="space-y-3">
          {startOptions.map((option) => (
            <Card
              key={option.value}
              interactive
              padding="md"
              className="group flex min-h-[96px] items-center gap-4 px-4 py-4"
              onClick={() => chooseStart(option.value)}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sunken text-primary-strong shadow-neu-in">
                <Icon name={option.icon} size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-extrabold text-ink">{option.title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted">{option.description}</span>
              </span>
              <Icon name="chevronRight" size={20} className="shrink-0 text-muted transition-transform group-hover:translate-x-1" />
            </Card>
          ))}
        </div>

        <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-muted">
          <Link href="/kebijakan-privasi/" className="hover:text-primary-strong">
            {id.auth.privacy}
          </Link>
          {user?.role === "admin" ? (
            <Link href="/admin/" className="hover:text-primary-strong">
              {id.common.admin}
            </Link>
          ) : null}
        </footer>
      </div>
    </main>
  );
}

export default function StartPage() {
  return (
    <ProtectedPage>
      <StartContent />
    </ProtectedPage>
  );
}
