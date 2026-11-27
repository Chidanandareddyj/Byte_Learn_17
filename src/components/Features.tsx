import { Clapperboard, Languages, PencilLine } from "lucide-react";

const STEPS = [
  { n: "1", Icon: PencilLine, title: "Ask in plain words", body: "One sentence is enough. Say your level and ask for an example.", color: "text-yellow" },
  { n: "2", Icon: Clapperboard, title: "We draw the lesson", body: "AI writes a step-by-step script and Manim animates every frame.", color: "text-blue" },
  { n: "3", Icon: Languages, title: "Listen in your language", body: "Narration, chapters and a transcript you can follow along with.", color: "text-pink" },
];

const LANGUAGES = [
  ["English", "English"], ["हिन्दी", "Hindi"], ["తెలుగు", "Telugu"], ["தமிழ்", "Tamil"], ["ಕನ್ನಡ", "Kannada"],
  ["മലയാളം", "Malayalam"], ["বাংলা", "Bengali"], ["मराठी", "Marathi"], ["ગુજરાતી", "Gujarati"],
];

export function Features() {
  return (
    <section className="relative w-full max-w-[1200px] mx-auto px-6 py-20">
      <div id="how-it-works" className="scroll-mt-24 text-center">
        <p className="hand text-[26px] text-yellow">how it works</p>
        <h2 className="font-serif italic text-chalk text-[44px] lg:text-[52px] leading-tight">Three steps on the board</h2>
      </div>

      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {STEPS.map(({ n, Icon, title, body, color }) => (
          <li key={n} className="relative rounded-[14px] border-[1.5px] border-line bg-board p-7">
            <span className={`hand absolute right-6 top-3 text-[44px] leading-none ${color}`} aria-hidden="true">{n}</span>
            <Icon className={`w-8 h-8 ${color}`} aria-hidden="true" />
            <h3 className="mt-5 text-[20px] font-bold text-chalk">{title}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>

      <div id="languages" className="scroll-mt-24 mt-16 paper px-8 py-8 text-center">
        <p className="hand text-[26px] text-[#D9534F]">narrated in 9 languages</p>
        <ul className="mt-4 flex flex-wrap justify-center gap-2.5">
          {LANGUAGES.map(([native, en]) => (
            <li key={en} className="chip !h-10 !text-[16px] gap-2">
              <span>{native}</span>
              {native !== en && <span className="text-[12px] text-[#5A6478]">{en}</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
