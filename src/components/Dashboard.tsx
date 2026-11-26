"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { VideoCard } from "@/components/VideoCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { BookOpen, Clock, Globe, PenLine, RotateCcw, Sparkles } from "lucide-react";
import { isGenerationInProgress } from "@/lib/generation-status";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

type VideoStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

interface Video {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  videoUrl: string | null;
  status: VideoStatus;
  stage: string | null;
  errorMessage: string | null;
}

const LANGUAGES = [
  { value: "english", label: "English", name: "English" },
  { value: "hindi", label: "हिन्दी", name: "Hindi" },
  { value: "telugu", label: "తెలుగు", name: "Telugu" },
  { value: "tamil", label: "தமிழ்", name: "Tamil" },
  { value: "kannada", label: "ಕನ್ನಡ", name: "Kannada" },
  { value: "malayalam", label: "മലയാളം", name: "Malayalam" },
  { value: "bengali", label: "বাংলা", name: "Bengali" },
  { value: "marathi", label: "मराठी", name: "Marathi" },
  { value: "gujarati", label: "ગુજરાતી", name: "Gujarati" },
];

/* Level chips only add a short phrase to the prompt text the user can see and edit.
   The API payload shape is unchanged. */
const LEVELS = [
  { label: "Beginner", phrase: "for a beginner" },
  { label: "Intermediate", phrase: "for an intermediate student" },
  { label: "Advanced", phrase: "at an advanced level" },
];

const SIDE_LINKS = [
  { Icon: PenLine, label: "New lesson", href: "#composer", active: true },
  { Icon: BookOpen, label: "My notebook", href: "#notebook", active: false },
];

export function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("english");
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: videos = [], isLoading, isError, refetch } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
    queryFn: async () => {
      const res = await fetch("/api/videos");
      if (!res.ok) throw new Error("Failed to fetch videos");
      return res.json();
    },
    refetchInterval: (query) =>
      query.state.data?.some((video: Video) => isGenerationInProgress(video.status))
        ? 5000
        : false,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string; language: string }) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (res.status === 401) {
        router.push("/sign-in");
        throw new Error("Please sign in to generate a video.");
      }
      if (!res.ok) throw new Error("Failed to generate");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setPrompt("");
      // Redirect to learn page with the promptId
      if (data.promptId) {
        router.push(`/learn?id=${data.promptId}`);
      }
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generateMutation.mutate({ prompt, language });
  };

  const addLevel = (phrase: string) => {
    setPrompt((current) => {
      const withoutLevels = LEVELS.reduce((text, l) => text.replace(`, ${l.phrase}`, ""), current).trimEnd();
      return withoutLevels ? `${withoutLevels}, ${phrase}` : "";
    });
  };
  const activeLevel = LEVELS.find((l) => prompt.endsWith(`, ${l.phrase}`))?.label;

  const retryWith = (text: string) => {
    setPrompt(text);
    document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("input-prompt")?.focus();
  };

  // Show loading screen when generating
  if (generateMutation.isPending) {
    return <LoadingScreen prompt={prompt} />;
  }

  return (
    <div className="min-h-screen">
      <Navbar variant="app" />

      <div className="mx-auto mt-[72px] grid max-w-[1440px] gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[200px_minmax(0,560px)_minmax(0,1fr)] lg:px-12">
        <aside className="hidden lg:block">
          <nav className="sticky top-[104px] space-y-1" aria-label="Dashboard sections">
            {SIDE_LINKS.map(({ Icon, label, href, active }) => (
              <a
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 ${active ? "bg-board font-bold text-chalk" : "text-muted-foreground hover:text-chalk"}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" /> {label}
              </a>
            ))}
            <p className="hand px-3.5 pt-6 text-[20px] leading-tight text-yellow/80">
              tip: one clear question makes the best lesson
            </p>
          </nav>
        </aside>

        <section id="composer" className="scroll-mt-28">
          <div className="paper relative px-7 pb-7 pt-6 lg:sticky lg:top-[104px]">
            <span className="hand absolute -top-5 right-6 rotate-3 rounded-[3px] bg-yellow px-3.5 py-0.5 text-[22px] text-slate shadow-sm">
              New lesson
            </span>
            <h1 className="font-serif italic text-[34px] leading-tight text-pen">What are you curious about?</h1>

            <label htmlFor="input-prompt" className="sr-only">Your question</label>
            <textarea
              id="input-prompt"
              placeholder="Explain how derivatives work using the slope of a tangent line…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleGenerate();
              }}
              className="mt-4 h-32 w-full resize-none bg-transparent font-hand text-[27px] leading-[32px] text-pen placeholder:text-pen/45 outline-none"
              data-testid="input-prompt"
              disabled={generateMutation.isPending}
            />
            <p className="text-[13px] text-[#5A6478]">Tip: say your level and ask for a real-life example. Ctrl + Enter to send.</p>

            <fieldset className="mt-5">
              <legend className="mb-2.5 flex items-center gap-1.5 text-[14px] font-bold">
                <Globe className="h-4 w-4" aria-hidden="true" /> Narrate in
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Narration language">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    role="radio"
                    aria-checked={language === lang.value}
                    title={lang.name}
                    onClick={() => setLanguage(lang.value)}
                    className={`chip ${language === lang.value ? "chip-active" : ""}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-4">
              <legend className="mb-2.5 text-[14px] font-bold">I&apos;m a…</legend>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((level) => (
                  <button
                    key={level.label}
                    type="button"
                    aria-pressed={activeLevel === level.label}
                    onClick={() => addLevel(level.phrase)}
                    disabled={!prompt.trim()}
                    className={`chip disabled:opacity-50 ${activeLevel === level.label ? "chip-active" : ""}`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              className="btn-pill mt-6 h-[52px] w-full border-pen bg-pen text-[17px] text-paper hover:bg-pen/90 hover:text-paper disabled:opacity-50"
              onClick={handleGenerate}
              disabled={!prompt.trim() || generateMutation.isPending}
              data-testid="button-generate"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Teach me this
            </button>
            {generateMutation.isError && (
              <p role="alert" className="mt-3 text-center text-[14px] font-bold text-[#B93A36]">
                {generateMutation.error instanceof Error ? generateMutation.error.message : "Failed to generate"}
              </p>
            )}
          </div>
        </section>

        <section id="notebook" className="min-w-0 scroll-mt-28">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-serif italic text-[30px] text-chalk">My notebook</h2>
            {videos.length > 0 && <span className="mono-label">{videos.length} lessons</span>}
          </div>

          {isLoading ? (
            <div className="grid gap-3" aria-busy="true" aria-label="Loading your lessons">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[122px] rounded-[14px] border-[1.5px] border-line bg-board/60 motion-safe:animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-[14px] border-[1.5px] border-dashed border-pink/50 bg-board p-8 text-center">
              <p className="hand text-[26px] text-pink">we couldn&apos;t open your notebook</p>
              <p className="mt-1 text-muted-foreground">Check your connection and try again.</p>
              <button type="button" onClick={() => refetch()} className="btn-pill mt-4">
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
              </button>
            </div>
          ) : videos.length > 0 ? (
            <div className="grid gap-3">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  id={video.id}
                  title={video.title}
                  videoUrl={video.videoUrl}
                  status={video.status}
                  stage={video.stage}
                  errorMessage={video.errorMessage}
                  date={formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                  onRetry={video.status === "FAILED" ? () => retryWith(video.prompt) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] border-[1.5px] border-dashed border-line bg-board p-10 text-center">
              <Clock className="mx-auto h-8 w-8 text-yellow" aria-hidden="true" />
              <p className="hand mt-3 text-[28px] text-yellow">no lessons yet</p>
              <p className="mt-1 text-muted-foreground">Ask your first question on the notebook page and it will show up here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
