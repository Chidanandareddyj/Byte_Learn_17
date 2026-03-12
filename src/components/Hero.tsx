import Link from "next/link";
import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export function Hero() {
  return (
    <main className="grid grid-cols-1 lg:grid-cols-2 px-8 lg:px-20 gap-10 items-center relative z-10 w-full max-w-[1440px] mx-auto min-h-[calc(100vh-160px)] pb-20">
      <section className="flex flex-col z-10">
        <div className={`inline-flex text-[11px] text-[#a8b5ae] mb-8 tracking-[0.1em] uppercase border-b border-[#ffffff40] pb-1 w-fit animate-fade-slide-up-1 ${jetbrainsMono.className}`}>
          Visual Mathematics Generator / v.2.0
        </div>
        <h1 className="text-5xl lg:text-[84px] leading-[1.1] font-light mb-8 text-[#f0f4f2] italic animate-fade-slide-up-2">
          Ask it.<br />Learn it.
        </h1>
        <p className="text-[22px] leading-[1.6] text-[#a8b5ae] font-light max-w-[520px] mb-14 animate-fade-slide-up-3">
          Generate complex, 3Blue1Brown-style mathematical animations and educational visuals from a single natural language description.
        </p>

        <div className="flex flex-wrap items-center gap-6 animate-fade-slide-up-4">
          <Link href="/sign-up" className={`flex items-center justify-center w-[180px] h-[52px] bg-transparent border border-[#f0f4f2] text-[#f0f4f2] cursor-pointer text-[12px] tracking-[0.1em] uppercase transition-all duration-300 hover:bg-[#f0f4f2] hover:text-[#003049] ${jetbrainsMono.className}`}>
            Start Learning
          </Link>
          <span className={`text-[11px] text-[#a8b5ae] opacity-60 uppercase tracking-[0.1em] flex items-center ${jetbrainsMono.className}`}>
            CTRL + ENTER TO COMPILE<span className="animate-blink ml-1">_</span>
          </span>
        </div>
      </section>

      <section className="relative h-full min-h-[500px] lg:min-h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 bg-bytelearn-spatial opacity-20 animate-pan-grid pointer-events-none"></div>

        <div className="relative w-full h-full max-w-[600px] max-h-[600px] flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full z-[1] pointer-events-none" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice">
            <path className="fill-none stroke-[#f0f4f2] stroke-[0.75] opacity-30 animate-draw" d="M100 150 L 300 300"></path>
            <path className="fill-none stroke-[#f0f4f2] stroke-[0.75] opacity-30 animate-draw" d="M150 450 L 300 300"></path>
            <path className="fill-none stroke-[#f0f4f2] stroke-[0.75] opacity-30 animate-draw" d="M500 100 L 300 300"></path>
            <path className="fill-none stroke-[#f0f4f2] stroke-[0.75] opacity-30 animate-draw" d="M550 400 L 300 300"></path>
          </svg>

          <div className="absolute bg-[#003049] border border-[rgba(255,255,255,0.25)] p-4 w-[200px] lg:w-[220px] z-[2] top-[5%] lg:top-[15%] left-0 lg:left-[5%] animate-float-1">
            <span className={`absolute -top-5 left-0 text-[10px] text-[#a8b5ae] ${jetbrainsMono.className}`}>FIG. 01</span>
            <div className="border-[0.5px] border-[rgba(255,255,255,0.25)] h-[100px] mb-3 bg-[rgba(255,255,255,0.02)] relative overflow-hidden animate-shimmer after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-10 after:h-10 after:border after:border-[#a8b5ae] after:rounded-full after:opacity-40"></div>
            <div className={`text-[10px] text-[#f0f4f2] uppercase tracking-[0.1em] ${jetbrainsMono.className}`}>Vector Spaces</div>
          </div>

          <div className="absolute bg-[#003049] border border-[rgba(255,255,255,0.25)] p-4 w-[200px] lg:w-[220px] z-[2] bottom-[5%] lg:bottom-[15%] left-[5%] lg:left-[15%] animate-float-2">
            <span className={`absolute -top-5 left-0 text-[10px] text-[#a8b5ae] ${jetbrainsMono.className}`}>FIG. 02</span>
            <div className="border-[0.5px] border-[rgba(255,255,255,0.25)] h-[100px] mb-3 bg-[rgba(255,255,255,0.02)] relative overflow-hidden animate-shimmer after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-10 after:h-10 after:border after:border-[#a8b5ae] after:rounded-full after:opacity-40"></div>
            <div className={`text-[10px] text-[#f0f4f2] uppercase tracking-[0.1em] ${jetbrainsMono.className}`}>Fourier Series</div>
          </div>

          <div className="absolute bg-[#003049] border border-[rgba(255,255,255,0.25)] p-4 w-[200px] lg:w-[220px] z-[2] top-0 lg:top-[10%] right-0 lg:right-[5%] animate-float-3">
            <span className={`absolute -top-5 left-0 text-[10px] text-[#a8b5ae] ${jetbrainsMono.className}`}>FIG. 03</span>
            <div className="border-[0.5px] border-[rgba(255,255,255,0.25)] h-[100px] mb-3 bg-[rgba(255,255,255,0.02)] relative overflow-hidden animate-shimmer after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-10 after:h-10 after:border after:border-[#a8b5ae] after:rounded-full after:opacity-40"></div>
            <div className={`text-[10px] text-[#f0f4f2] uppercase tracking-[0.1em] ${jetbrainsMono.className}`}>Manifolds</div>
          </div>

          <div className="absolute bg-[#003049] border border-[rgba(255,255,255,0.25)] p-4 w-[200px] lg:w-[220px] z-[2] bottom-[10%] lg:bottom-[20%] right-[0%] lg:right-[0%] animate-float-4">
            <span className={`absolute -top-5 left-0 text-[10px] text-[#a8b5ae] ${jetbrainsMono.className}`}>FIG. 04</span>
            <div className="border-[0.5px] border-[rgba(255,255,255,0.25)] h-[100px] mb-3 bg-[rgba(255,255,255,0.02)] relative overflow-hidden animate-shimmer after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-10 after:h-10 after:border after:border-[#a8b5ae] after:rounded-full after:opacity-40"></div>
            <div className={`text-[10px] text-[#f0f4f2] uppercase tracking-[0.1em] ${jetbrainsMono.className}`}>Stochastics</div>
          </div>

          <div className="relative z-10 text-center text-[32px] italic p-10 border border-[#f0f4f2] bg-[#003049] animate-equation-pulse">
            e<sup className="text-xl">iπ</sup> + 1 = 0
            <span className={`block text-[10px] not-italic mt-4 text-[#a8b5ae] tracking-[0.2em] uppercase ${jetbrainsMono.className}`}>
              FINAL_OUTPUT.MP4
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
