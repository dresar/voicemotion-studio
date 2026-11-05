"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { id } from "@/lib/i18n/id";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/project";

export interface IdeaGridProps {
  onCopyPrompt: () => void;
  onSendPrompt: () => void;
  onOpenPaste: () => void;
}

export function IdeaGrid({ onCopyPrompt, onSendPrompt, onOpenPaste }: IdeaGridProps) {
  const ideas = useProjectStore((state) => state.ideas);
  const selectedIdea = useProjectStore((state) => state.selectedIdea);
  const selectIdea = useProjectStore((state) => state.selectIdea);

  return (
    <section data-coach="ideas" className="space-y-4">
      <Card variant="raised" padding="sm" className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-strong shadow-neu-sm">
          <Icon name="sparkles" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-ink">{id.ideas.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {ideas.length > 0 ? id.ideas.banner : id.ideas.emptyDescription}
          </p>
        </div>
      </Card>

      {ideas.length === 0 ? (
        <EmptyState
          title={id.ideas.emptyTitle}
          description={id.ideas.emptyDescription}
          icon="lightbulb"
          action={
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <Button variant="primary" onClick={onSendPrompt} leftIcon={<Icon name="send" size={18} />}>
                {id.config.sendButton}
              </Button>
              <Button variant="secondary" onClick={onOpenPaste} leftIcon={<Icon name="paste" size={18} />}>
                {id.paste.title}
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold tracking-tight text-ink">{id.ideas.title}</h2>
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-extrabold text-primary-strong">
                {id.ideas.badge.replace("{count}", String(ideas.length))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onCopyPrompt} leftIcon={<Icon name="copy" size={16} />}>
                {id.config.copyButton}
              </Button>
              <Button variant="secondary" size="sm" onClick={onSendPrompt} leftIcon={<Icon name="refresh" size={16} />}>
                {id.ideas.regenerate}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {ideas.map((idea, index) => {
              const selected = selectedIdea?.id === idea.id;
              return (
                <Card
                  key={idea.id}
                  interactive
                  selected={selected}
                  padding="md"
                  className={cn("relative flex flex-col gap-3", selected && "border-primary/40")}
                  onClick={() => selectIdea(idea)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary-strong">
                      {id.ideas.ideaLabel.replace("{number}", String(index + 1).padStart(2, "0"))}
                    </span>
                    {selected ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                        <Icon name="check" size={13} />
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-sm font-extrabold leading-snug text-ink">{idea.title}</h3>
                  <div className="neu-quote text-xs">
                    <span className="not-italic">“</span>
                    {idea.hook}
                    <span className="not-italic">”</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted">{idea.angle}</p>
                  <p className="mt-auto text-[10px] font-semibold leading-relaxed text-muted">
                    <span className="text-ink">{id.ideas.visualLabel}:</span> {idea.visualStyle}
                  </p>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" fullWidth onClick={onOpenPaste} leftIcon={<Icon name="paste" size={18} />}>
              {id.config.hasAnswer}
            </Button>
            <Button variant="primary" fullWidth onClick={onSendPrompt} leftIcon={<Icon name="send" size={18} />}>
              {id.config.sendButton}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
