"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { id } from "@/lib/i18n/id";

const storageKey = "voicemotion.coachDone";

const targetSelectors = [
  '[data-coach="topic"]',
  '[data-coach="duration"]',
  '[data-coach="style"]',
  '[data-coach="send"]',
  '[data-coach="ideas"]'
];

export function CoachMarks({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(true);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setDone(window.localStorage.getItem(storageKey) === "1");
  }, []);

  useEffect(() => {
    if (!active || done) return;
    const target = document.querySelector<HTMLElement>(targetSelectors[step]);
    if (!target) {
      setRect(null);
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    const measure = () => setRect(target.getBoundingClientRect());
    const timer = window.setTimeout(measure, 380);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, done, step]);

  function finish() {
    window.localStorage.setItem(storageKey, "1");
    setDone(true);
  }

  if (!active || done) return null;
  const coach = id.coach.steps[step];

  return (
    <>
      {rect ? (
        <div
          className="pointer-events-none fixed z-[70] rounded-lg border-2 border-primary shadow-[0_0_0_9999px_rgba(15,23,42,0.18)]"
          style={{ top: rect.top - 5, left: rect.left - 5, width: rect.width + 10, height: rect.height + 10 }}
        />
      ) : null}
      <div className="fixed inset-x-4 bottom-[calc(92px+var(--safe-bottom))] z-[71] mx-auto max-w-md rounded-lg bg-ink-dark p-3 text-white shadow-neu-lg md:bottom-8">
        <div className="flex items-start gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold">
            {step + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">{coach.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/80">{coach.body}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <button type="button" onClick={finish} className="min-h-[40px] px-1 text-xs font-bold text-white/70 hover:text-white">
            {id.coach.skip}
          </button>
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <Button variant="secondary" size="sm" onClick={() => setStep((current) => current - 1)}>
                {id.common.back}
              </Button>
            ) : null}
            <Button
              variant="primary"
              size="sm"
              onClick={() => (step === id.coach.steps.length - 1 ? finish() : setStep((current) => current + 1))}
            >
              {step === id.coach.steps.length - 1 ? id.coach.done : id.coach.next}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
