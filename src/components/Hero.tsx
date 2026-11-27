"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Sparkles } from "lucide-react";
import { FourierFigure, PythagorasFigure, TangentFigure } from "@/components/ChalkFigures";

const EQUATIONS = [
  { t: <>e<sup>iπ</sup> + 1 = 0</>, cls: "left-[6%] top-[13%] text-chalk -rotate-6 text-[30px]" },
  { t: "∫ f′(x) dx = f(x)", cls: "right-[6%] top-[12%] text-blue rotate-[5deg] text-[28px]" },
  { t: "lim (1 + 1/n)ⁿ", cls: "right-[9%] top-[29%] text-yellow rotate-3 text-[26px]" },
  { t: "a² + b² = c²", cls: "left-[5%] bottom-[8%] text-green rotate-[4deg] text-[30px]" },
  { t: "Σ 1/n² = π²/6", cls: "right-[7%] bottom-[8%] text-pink -rotate-[4deg] text-[30px]" },
];

const SAMPLES = [
  { title: "Pythagoras, by moving shapes", meta: "English · 2:14", Fig: PythagorasFigure, rot: "-rotate-3", pad: "px-16 py-2" },
  { title: "Derivatives as tangent slopes", meta: "हिन्दी · 3:02", Fig: TangentFigure, rot: "rotate-2", pad: "px-6 py-3" },
  { title: "Fourier series of a square wave", meta: "తెలుగు · 4:10", Fig: FourierFigure, rot: "-rotate-[1.5deg]", pad: "px-6 py-3" },
];

export function Hero() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  // Visitors on the landing page are signed out; send them to sign up.
  // The prompt is not carried over (kept UI-only on purpose).
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push("/sign-up");
  };

  return (
    <section className="relative w-full max-w-[1440px] mx-auto px-6 pb-16 overflow-hidden">
      {EQUATIONS.map((eq, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={`hidden lg:block absolute font-serif italic opacity-50 pointer-events-none select-none ${eq.cls}`}
        >
          {eq.t}
        </div>
      ))}

      <div className="relative text-center pt-10 lg:pt-12">
        <p className="hand text-[26px] lg:text-[28px] text-yellow">today&apos;s lesson: anything you&apos;re curious about</p>
        <h1 className="font-serif italic font-normal text-chalk text-[64px] sm:text-[88px] lg:text-[118px] leading-none mt-1">
          Ask it. Learn it.
        </h1>
        <svg className="mx-auto w-[min(560px,80%)] h-6" viewBox="0 0 560 24" aria-hidden="true">
          <path d="M6 14 C120 4, 300 22, 554 8" stroke="#F4D35E" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".85" />
        </svg>
        <p className="mx-auto mt-3 max-w-[640px] text-[18px] lg:text-[20px] leading-relaxed text-muted-foreground">
          Type a question. Get a chalkboard-style animated lesson, narrated in your language — English, Hindi, Telugu,
          Tamil, Kannada, Malayalam, Bengali, Marathi or Gujarati.
        </p>

        <div className="relative mx-auto mt-8 max-w-[760px]">
          <form
            onSubmit={onSubmit}
            className="paper !bg-none flex items-center gap-3 p-3 pl-5 text-left"
          >
            <label htmlFor="hero-prompt" className="sr-only">What do you want to learn?</label>
            <input
              id="hero-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Why does a rainbow curve?"
              className="flex-1 min-w-0 bg-transparent text-[18px] text-pen placeholder:text-[#6A7488] outline-none"
            />
            <span className="chip hidden sm:inline-flex gap-1.5">
              <Globe className="w-4 h-4" aria-hidden="true" /> తెలుగు
            </span>
            <button type="submit" className="btn-pill btn-pill-primary h-[46px]">
              <Sparkles className="w-4 h-4" aria-hidden="true" /> Teach me
            </button>
          </form>
          <p aria-hidden="true" className="hidden xl:block absolute left-full ml-5 top-3 whitespace-nowrap hand text-[24px] text-pink -rotate-[4deg]">
            ← try it in your language!
          </p>
        </div>
      </div>

      <div id="examples" className="relative mt-12 flex flex-wrap justify-center gap-9 scroll-mt-24">
        {SAMPLES.map(({ title, meta, Fig, rot, pad }) => (
          <figure key={title} className={`board !border-[7px] w-[300px] motion-safe:transition-transform hover:rotate-0 ${rot}`}>
            <div className={`h-[150px] ${pad}`}>
              <Fig className="w-full h-full" />
            </div>
            <figcaption className="px-3.5 pt-2.5 pb-3.5 border-t-[1.5px] border-dashed border-line text-left">
              <div className="font-bold text-chalk">{title}</div>
              <div className="mono-label mt-1 !text-[11px]">{meta}</div>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mono-label text-center mt-4 !text-[11px]">Sample lessons · illustrations of what ByteLearn makes</p>
    </section>
  );
}
