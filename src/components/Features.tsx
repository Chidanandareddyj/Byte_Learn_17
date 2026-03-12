import { Languages, Globe, Sparkles } from "lucide-react";
import { JetBrains_Mono, Source_Serif_4 } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"] });

export function Features() {
  return (
    <section id="features" className="py-20 bg-bytelearn-back relative z-10 w-full max-w-[1440px] mx-auto px-8 lg:px-20 border-t border-[rgba(255,255,255,0.15)] mt-10">
      <div className="text-center mb-16 animate-fade-slide-up-1">
        <h2 className={`text-4xl lg:text-5xl text-[#f0f4f2] italic font-light mb-6 ${sourceSerif.className}`}>Axioms of Learning</h2>
        <p className={`text-lg text-[#a8b5ae] max-w-2xl mx-auto font-light ${sourceSerif.className}`}>
          Experience learning like never before with features designed for modern education.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="bg-[#003049] border border-[rgba(255,255,255,0.15)] p-10 hover:-translate-y-1 hover:border-[#f0f4f2] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-300 relative group animate-fade-slide-up-2">
          <div className={`absolute top-0 right-0 border-b border-l border-[rgba(255,255,255,0.15)] px-3 py-1 text-[9px] text-[#a8b5ae] uppercase tracking-wider ${jetbrainsMono.className} group-hover:border-[#f0f4f2] transition-all`}>FIG. 01</div>
          <Sparkles className="w-8 h-8 text-[#f0f4f2] mb-6 opacity-80" />
          <h3 className={`text-[11px] uppercase tracking-[0.1em] text-[#f0f4f2] mb-4 ${jetbrainsMono.className}`}>AI-powered animations</h3>
          <p className={`text-[#a8b5ae] font-light leading-relaxed text-base ${sourceSerif.className}`}>Generate Manim animations from your prompts with advanced AI technology.</p>
        </div>

        <div className="bg-[#003049] border border-[rgba(255,255,255,0.15)] p-10 hover:-translate-y-1 hover:border-[#f0f4f2] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-300 relative group animate-fade-slide-up-3">
          <div className={`absolute top-0 right-0 border-b border-l border-[rgba(255,255,255,0.15)] px-3 py-1 text-[9px] text-[#f0f4f2] bg-[rgba(255,255,255,0.1)] uppercase tracking-wider ${jetbrainsMono.className} group-hover:border-[#f0f4f2] group-hover:bg-[#f0f4f2] group-hover:text-[#003049] transition-all`}>NEW_FEATURE</div>
          <Languages className="w-8 h-8 text-[#f0f4f2] mb-6 opacity-80" />
          <h3 className={`text-[11px] uppercase tracking-[0.1em] text-[#f0f4f2] mb-4 ${jetbrainsMono.className}`}>Indian Languages Narration</h3>
          <p className={`text-[#a8b5ae] font-light leading-relaxed text-base ${sourceSerif.className}`}>Learn in your preferred language with natural, conversational narration in Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Marathi, and Gujarati.</p>
        </div>

        <div className="bg-[#003049] border border-[rgba(255,255,255,0.15)] p-10 hover:-translate-y-1 hover:border-[#f0f4f2] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-300 relative group animate-fade-slide-up-4">
          <div className={`absolute top-0 right-0 border-b border-l border-[rgba(255,255,255,0.15)] px-3 py-1 text-[9px] text-[#a8b5ae] uppercase tracking-wider ${jetbrainsMono.className} group-hover:border-[#f0f4f2] transition-all`}>FIG. 02</div>
          <Globe className="w-8 h-8 text-[#f0f4f2] mb-6 opacity-80" />
          <h3 className={`text-[11px] uppercase tracking-[0.1em] text-[#f0f4f2] mb-4 ${jetbrainsMono.className}`}>Interactive learning</h3>
          <p className={`text-[#a8b5ae] font-light leading-relaxed text-base ${sourceSerif.className}`}>Explore concepts visually and intuitively with synchronized animations and narration.</p>
        </div>
      </div>

      <div className={`mt-16 text-center animate-fade-slide-up-4`}>
        <div className={`inline-flex items-center gap-3 border border-[rgba(255,255,255,0.15)] px-4 py-3 text-[10px] text-[#a8b5ae] uppercase tracking-[0.1em] bg-[rgba(255,255,255,0.02)] ${jetbrainsMono.className}`}>
          <div className="w-2 h-2 rounded-full bg-[#f0f4f2] animate-pulse"></div>
          Supporting 9 languages for inclusive education
        </div>
      </div>
    </section>
  );
}
