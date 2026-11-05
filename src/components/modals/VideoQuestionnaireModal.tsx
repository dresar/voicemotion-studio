"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

export interface VideoQuestionnaireAnswers {
  aspectRatio: "9:16" | "16:9" | "1:1";
  animationPacing: "dynamic" | "smooth" | "minimal";
  visualVibe: "paper_editorial" | "cyber_modern" | "clean_minimal";
  typographyEmphasis: "kinetic_pop" | "subtle_fade" | "bold_box";
  includeSoundCue: boolean;
}

interface VideoQuestionnaireModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (answers: VideoQuestionnaireAnswers) => void;
}

export function VideoQuestionnaireModal({
  open,
  onClose,
  onConfirm,
}: VideoQuestionnaireModalProps) {
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [animationPacing, setAnimationPacing] = useState<"dynamic" | "smooth" | "minimal">("dynamic");
  const [visualVibe, setVisualVibe] = useState<"paper_editorial" | "cyber_modern" | "clean_minimal">("paper_editorial");
  const [typographyEmphasis, setTypographyEmphasis] = useState<"kinetic_pop" | "subtle_fade" | "bold_box">("kinetic_pop");
  const [includeSoundCue, setIncludeSoundCue] = useState(true);

  function handleProceed() {
    onConfirm({
      aspectRatio,
      animationPacing,
      visualVibe,
      typographyEmphasis,
      includeSoundCue,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pertanyaan Pra-Pembuatan Video (Claude AI)"
      className="max-w-md p-4 space-y-4"
    >
      <div className="space-y-3.5 text-xs">
        <p className="text-muted leading-relaxed text-[11px]">
          Jawab beberapa preferensi di bawah ini sebelum kami menyusun prompt video presisi untuk dieksekusi di <strong>Claude AI</strong>:
        </p>

        {/* 1. Aspek Rasio */}
        <div className="space-y-1.5">
          <label className="font-bold text-ink text-[11px] block">
            1. Format Aspek Rasio Video:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "9:16", label: "9:16 Vertikal", sub: "Reels / TikTok" },
              { id: "16:9", label: "16:9 Horisontal", sub: "YouTube Standar" },
              { id: "1:1", label: "1:1 Persegi", sub: "Feed Instagram" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAspectRatio(opt.id as any)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  aspectRatio === opt.id
                    ? "bg-primary text-white border-primary shadow-xs font-bold"
                    : "bg-bg text-ink border-line hover:border-primary/50"
                }`}
              >
                <div className="text-[11px]">{opt.label}</div>
                <div className={`text-[9px] ${aspectRatio === opt.id ? "text-white/80" : "text-muted"}`}>
                  {opt.sub}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Tempo & Ritme Animasi */}
        <div className="space-y-1.5">
          <label className="font-bold text-ink text-[11px] block">
            2. Tempo & Transisi Animasi:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "dynamic", label: "Dinamis & Cepat", sub: "Enerjik, Hook tajam" },
              { id: "smooth", label: "Halus & Rapi", sub: "Edukasi & Naratif" },
              { id: "minimal", label: "Minimalis Calm", sub: "Fokus teks & pesan" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAnimationPacing(opt.id as any)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  animationPacing === opt.id
                    ? "bg-primary text-white border-primary shadow-xs font-bold"
                    : "bg-bg text-ink border-line hover:border-primary/50"
                }`}
              >
                <div className="text-[11px]">{opt.label}</div>
                <div className={`text-[9px] ${animationPacing === opt.id ? "text-white/80" : "text-muted"}`}>
                  {opt.sub}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Gaya Visual Background */}
        <div className="space-y-1.5">
          <label className="font-bold text-ink text-[11px] block">
            3. Nuansa Visual Visual Scene:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "paper_editorial", label: "Kertas Editorial", sub: "Tekstur & Elegan" },
              { id: "cyber_modern", label: "Tech Modern", sub: "Gradien & Geometris" },
              { id: "clean_minimal", label: "Clean Flat", sub: "Simpel tanpa distraksi" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setVisualVibe(opt.id as any)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  visualVibe === opt.id
                    ? "bg-primary text-white border-primary shadow-xs font-bold"
                    : "bg-bg text-ink border-line hover:border-primary/50"
                }`}
              >
                <div className="text-[11px]">{opt.label}</div>
                <div className={`text-[9px] ${visualVibe === opt.id ? "text-white/80" : "text-muted"}`}>
                  {opt.sub}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Tipografi Animasi */}
        <div className="space-y-1.5">
          <label className="font-bold text-ink text-[11px] block">
            4. Gaya Tipografi Teks:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "kinetic_pop", label: "Kinetic Pop", sub: "Muncul per frasa" },
              { id: "subtle_fade", label: "Subtle Fade", sub: "Transisi lembut" },
              { id: "bold_box", label: "Highlight Box", sub: "Sorot kata kunci" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTypographyEmphasis(opt.id as any)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  typographyEmphasis === opt.id
                    ? "bg-primary text-white border-primary shadow-xs font-bold"
                    : "bg-bg text-ink border-line hover:border-primary/50"
                }`}
              >
                <div className="text-[11px]">{opt.label}</div>
                <div className={`text-[9px] ${typographyEmphasis === opt.id ? "text-white/80" : "text-muted"}`}>
                  {opt.sub}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sound Cue toggle */}
        <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeSoundCue}
            onChange={(e) => setIncludeSoundCue(e.target.checked)}
            className="rounded border-line text-primary focus:ring-primary h-3.5 w-3.5"
          />
          <span className="text-[11px] text-ink font-medium">
            Sertakan timing sinkronisasi audio suara Gemini ke dalam script kode video
          </span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleProceed}
          rightIcon={<Icon name="arrowRight" size={14} />}
        >
          Lanjut ke Claude AI
        </Button>
      </div>
    </Modal>
  );
}
