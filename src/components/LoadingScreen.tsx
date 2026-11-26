"use client";

import { useEffect, useState } from "react";
import { PythagorasFigure } from "@/components/ChalkFigures";

interface LoadingScreenProps {
  prompt?: string;
}

export function LoadingScreen({ prompt }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(prev + 0.4, 100);
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const displayedProgress = Math.round(progress);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden px-4 text-chalk"
      style={{ background: "radial-gradient(ellipse 80% 70% at 50% 35%, var(--glow) 0%, var(--slate) 75%)" }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute left-[8%] top-[12%] font-serif italic text-[40px] text-blue opacity-30 -rotate-6">ζ(s) = Σ n⁻ˢ</div>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[12%] right-[8%] font-serif italic text-[40px] text-pink opacity-30 rotate-3">∫ e^(−x²) dx = √π</div>

      <p className="hand text-[30px] text-yellow">give us a moment…</p>
      <h2 className="mt-1 text-center font-serif italic text-[40px] leading-tight md:text-[52px]">Setting up your lesson</h2>

      <div className="board mt-8 flex h-[240px] w-full max-w-[560px] items-center justify-center p-6 md:h-[320px]">
        <PythagorasFigure className="h-full w-auto motion-safe:animate-pulse" />
      </div>

      {prompt && (
        <p className="mt-6 max-w-[560px] text-center text-[17px] text-muted-foreground">
          “{prompt.length > 120 ? `${prompt.slice(0, 120)}…` : prompt}”
        </p>
      )}

      <div className="mt-6 w-full max-w-[480px]">
        <div className="flex justify-between mono-label">
          <span>Sending your question</span>
          <span>{displayedProgress}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-chalk/15">
          <div className="h-full rounded-full bg-yellow transition-all duration-500" style={{ width: `${displayedProgress}%` }} />
        </div>
      </div>
    </div>
  );
}
