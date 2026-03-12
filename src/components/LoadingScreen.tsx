"use client";

import { useEffect, useState } from "react";
import { JetBrains_Mono, Source_Serif_4 } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"] });

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
    <div className={`fixed inset-0 z-[200] bg-bytelearn-back flex flex-col items-center justify-center overflow-hidden text-[#f0f4f2] ${sourceSerif.className}`}>

      {/* Background Grid */}
      <div className="absolute inset-0 bg-bytelearn-spatial opacity-15 pointer-events-none animate-pan-grid"></div>

      {/* Floating Background Nodes */}
      <div className="absolute inset-0 z-[2] pointer-events-none">
        <div className={`absolute w-[180px] p-3 border-[0.5px] border-[rgba(255,255,255,0.25)] bg-[rgba(0,48,73,0.4)] backdrop-blur-sm opacity-30 top-[20%] left-[15%] animate-float-1 text-[#a8b5ae] text-[9px] ${jetbrainsMono.className}`}>
          [SYS] PARSING_PROMPT<br />
          &gt; &quot;{prompt ? (prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt) : 'Visualizing concept...'}&quot;
        </div>
        <div className={`absolute w-[180px] p-3 border-[0.5px] border-[rgba(255,255,255,0.25)] bg-[rgba(0,48,73,0.4)] backdrop-blur-sm opacity-30 bottom-[25%] right-[12%] animate-float-2 text-[#a8b5ae] text-[9px] ${jetbrainsMono.className}`}>
          [MEM] BUFFER_ALLOCATED<br />
          &gt; 2.4GB / 4.0GB VRAM
        </div>
        <div className="absolute italic text-[48px] opacity-[0.03] pointer-events-none top-[10%] right-[10%]">ζ(s) = ∑ n⁻ˢ</div>
        <div className="absolute italic text-[48px] opacity-[0.03] pointer-events-none bottom-[10%] left-[10%]">∫ exp(-x²) dx = √π</div>
      </div>

      <nav className="fixed top-10 left-20 right-20 flex items-center justify-between z-[100]">
        <div className="text-[20px] tracking-[0.1em] uppercase italic font-light">Byte Learn</div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full mt-20 px-4">

        {/* Rendering Canvas */}
        <div className="w-full max-w-[600px] h-[250px] md:h-[400px] border border-[rgba(255,255,255,0.25)] bg-[rgba(0,0,0,0.2)] relative flex items-center justify-center mb-10 md:mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <span className={`absolute -top-6 left-0 text-[10px] text-[#a8b5ae] uppercase tracking-[0.1em] ${jetbrainsMono.className}`}>Live Construction: FRAME_0422.RAW</span>

          <svg className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] stroke-[#f0f4f2] stroke-[1.5] fill-none animate-draw" viewBox="0 0 100 100" style={{ animation: 'draw 8s linear infinite' }}>
            <path d="M30,70 Q30,30 50,30 Q70,30 70,70 M40,30 L40,20 M60,30 L60,20 M35,45 Q50,40 65,45"></path>
            <circle cx="43" cy="45" r="2" fill="currentColor"></circle>
            <circle cx="57" cy="45" r="2" fill="currentColor"></circle>
            <path d="M10,80 C30,80 40,20 90,20" opacity="0.4" strokeDasharray="4 4"></path>
          </svg>

          <svg className="absolute w-full h-full pointer-events-none" preserveAspectRatio="none">
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.05)" strokeWidth="1"></line>
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255,255,255,0.05)" strokeWidth="1"></line>
          </svg>
        </div>

        {/* Progress Section */}
        <section className="w-full max-w-[480px] flex flex-col gap-4">
          <div className={`flex justify-between text-[11px] text-[#a8b5ae] uppercase tracking-[0.1em] ${jetbrainsMono.className}`}>
            <span>Rendering Frames...</span>
            <span>{displayedProgress}%</span>
          </div>

          <div className="w-full h-[2px] bg-[rgba(255,255,255,0.25)] relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-[#f0f4f2] shadow-[0_0_10px_#f0f4f2] transition-all duration-500 animate-blink"
              style={{ width: `${displayedProgress}%` }}
            ></div>
          </div>

          <div className={`mt-4 md:mt-8 text-[10px] text-[#a8b5ae] opacity-50 text-center leading-[2] ${jetbrainsMono.className}`}>
            COMPILING SHADERS... DONE<br />
            RESOLVING VECTOR MANIFOLDS... {((progress / 100) * 1.5).toFixed(2)}s<br />
            OPTIMIZING ANIMATION PATHS... IN PROGRESS
          </div>
        </section>

      </main>

    </div>
  );
}
