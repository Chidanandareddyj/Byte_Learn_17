"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Download, Maximize, Pause, Play, Share2, Sparkles, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PythagorasFigure } from "@/components/ChalkFigures";
import { generationStageLabel, isGenerationInProgress } from "@/lib/generation-status";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

type VideoStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

interface Video {
  id: string;
  title: string;
  prompt: string;
  explanation: string;
  narration: string;
  videoUrl: string | null;
  status: VideoStatus;
  stage: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export function LearningPage() {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [playback, setPlayback] = useState(0); // 0..1 of the video watched
  const [copied, setCopied] = useState(false);
  const quizRef = useRef<HTMLDialogElement>(null);
  const searchParams = useSearchParams();
  const videoId = searchParams.get("id") ?? undefined;

  const { data: video, isLoading, isError } = useQuery<Video>({
    queryKey: ["/api/videos", videoId],
    queryFn: async () => {
      if (!videoId) throw new Error("No video ID");
      const res = await fetch(`/api/videos/${videoId}`);
      if (!res.ok) throw new Error("Failed to fetch video");
      return res.json();
    },
    enabled: !!videoId,
    refetchInterval: (query) =>
      isGenerationInProgress(query.state.data?.status) ? 5000 : false,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (video && isGenerationInProgress(video.status)) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [video?.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (video?.status === "QUEUED") {
      return Math.min(10 + (elapsedTime * 0.5), 25);
    } else if (video?.status === "PROCESSING") {
      const estimatedDuration = 1800;
      const progress = 25 + ((elapsedTime / estimatedDuration) * 65);
      return Math.min(progress, 90);
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar variant="app" />
        <div className="flex min-h-screen items-center justify-center" role="status">
          <p className="hand text-[30px] text-yellow motion-safe:animate-pulse">opening your lesson…</p>
        </div>
      </div>
    );
  }

  if (!video || isError) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar variant="app" />
        <div className="flex flex-1 items-center justify-center px-5 pt-[72px]">
          <div className="board w-full max-w-[520px] px-8 py-10 text-center">
            <p className="hand text-[30px] text-pink">hmm, this page of the notebook is blank</p>
            <h1 className="mt-2 font-serif italic text-[34px] text-chalk">We couldn&apos;t find that lesson</h1>
            <p className="mt-2 text-muted-foreground">The link may be wrong, or the lesson was removed.</p>
            <Link href="/dashboard" className="btn-pill btn-pill-primary mt-6">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to my notebook
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isFailed = video.status === "FAILED";
  const isCompleted = video.status === "COMPLETED";

  const explanationText = video.explanation?.trim() ?? "";
  const explanationChunks = explanationText
    ? explanationText.split(/(?=\[Scene\s+\d+\])/)
    : [];
  const chapters = explanationChunks
    .filter((chunk) => /^\[Scene\s+\d+\]/.test(chunk.trim()))
    .map((chunk) => {
      const match = chunk.trim().match(/^\[Scene\s+(\d+)\]\s*/);
      const content = chunk.trim().replace(/^\[Scene\s+\d+\]\s*/, "").trim();
      return { scene: match ? match[1] : "", content };
    });
  const summaryParagraphs = explanationChunks
    .filter((chunk) => !/^\[Scene\s+\d+\]/.test(chunk.trim()))
    .join("\n\n")
    .split("\n\n")
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const generalExplanation = summaryParagraphs[0] || "";
  const extraSummaryParagraphs = summaryParagraphs.slice(1);

  const transcript = video.narration ? video.narration.split("\n\n").map((t) => t.trim()).filter(Boolean) : [];
  const currentLine = transcript.length ? Math.min(transcript.length - 1, Math.floor(playback * transcript.length)) : -1;
  const currentChapter = chapters.length ? Math.min(chapters.length - 1, Math.floor(playback * chapters.length)) : -1;
  const inProgress = isGenerationInProgress(video.status);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar variant="app" />

      <main className="mx-auto mt-[72px] grid max-w-[1440px] gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-12">
        {/* Player + lesson */}
        <section className="min-w-0">
          <div className="board relative aspect-video overflow-hidden">
            {isCompleted && video.videoUrl ? (
              <CustomVideoPlayer url={video.videoUrl} onProgress={setPlayback} />
            ) : isFailed ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <p className="hand text-[34px] text-pink">this lesson didn&apos;t finish drawing</p>
                <p className="mt-2 max-w-[520px] text-muted-foreground">
                  {video.errorMessage || "Something went wrong while making the video."}
                </p>
                <Link href="/dashboard" className="btn-pill mt-5">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to my notebook
                </Link>
              </div>
            ) : (
              <div className="relative flex h-full flex-col items-center justify-center">
                <PythagorasFigure className="h-[55%] w-auto opacity-40 motion-safe:animate-pulse" />
                <p className="hand mt-2 text-[30px] text-yellow">{generationStageLabel(video.stage)}…</p>
                <div className="absolute inset-x-5 bottom-5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-chalk/15">
                    <div className="h-full rounded-full bg-yellow transition-all duration-500" style={{ width: `${getProgressPercentage()}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between mono-label">
                    <span>{video.status === "QUEUED" ? "Waiting for a free board" : "Drawing your lesson"}</span>
                    <span>{formatTime(elapsedTime)} elapsed</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-start gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-serif italic text-[30px] leading-tight text-chalk sm:text-[34px]">{video.title || video.prompt}</h1>
              <p className="mt-1.5 text-muted-foreground">
                Created {format(new Date(video.createdAt || Date.now()), "MMM d, yyyy")}
                {inProgress && " · still drawing, this page updates by itself"}
              </p>
            </div>
            <div className="flex gap-2.5">
              <button type="button" className="btn-pill" disabled title="Download is coming soon">
                <Download className="h-4 w-4" aria-hidden="true" /> Save
              </button>
              <button type="button" className="btn-pill" onClick={share}>
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
                {copied ? "Link copied" : "Share"}
              </button>
            </div>
          </div>

          {(generalExplanation || extraSummaryParagraphs.length > 0 || chapters.length > 0) && (
            <div className="mt-6 max-w-4xl space-y-4 border-t-[1.5px] border-dashed border-line pt-6 leading-relaxed">
              {generalExplanation && <p className="text-[17px] text-chalk/90">{generalExplanation}</p>}
              {chapters.length === 0
                ? extraSummaryParagraphs.map((p, idx) => (
                    <p key={idx} className="text-muted-foreground">{p}</p>
                  ))
                : chapters.map((chap, idx) => (
                    <p key={idx} className="text-muted-foreground">
                      <span className="hand pr-2 text-[22px] text-yellow">{idx + 1}.</span>
                      {chap.content}
                    </p>
                  ))}
            </div>
          )}
        </section>

        {/* Chapters, notes, quiz */}
        <aside className="space-y-4">
          <div className="rounded-[14px] border-[1.5px] border-line bg-board p-3">
            <p className="mono-label px-3 pb-1 pt-1">Chapters</p>
            {chapters.length > 0 ? (
              <ol>
                {chapters.map((chap, idx) => (
                  <li
                    key={idx}
                    aria-current={idx === currentChapter ? "step" : undefined}
                    className={`flex items-center gap-3 rounded-[10px] px-3 py-2 ${idx === currentChapter ? "bg-yellow/15 font-bold text-yellow" : "text-muted-foreground"}`}
                  >
                    <span className="hand w-6 text-[24px] leading-none">{idx + 1}</span>
                    <span className="line-clamp-1 flex-1">{chap.content.split(" ").slice(0, 6).join(" ")}…</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-3 pb-2 text-[15px] text-muted-foreground">
                {inProgress ? "Chapters appear once the lesson is planned." : "This lesson has no chapters."}
              </p>
            )}
          </div>

          <div className="paper px-5 pb-8 pt-8 leading-[32px]">
            <h2 className="hand text-[26px] leading-[32px] text-[#D9534F]">Notes (live transcript)</h2>
            {transcript.length > 0 ? (
              <div className="max-h-[360px] overflow-y-auto pr-1">
                {transcript.map((line, idx) => (
                  <p
                    key={idx}
                    aria-current={idx === currentLine ? "true" : undefined}
                    className={`text-[16px] leading-[32px] transition-colors ${idx === currentLine ? "text-pen" : "text-[#5A6478]"}`}
                  >
                    <span
                      className={idx === currentLine ? "[box-decoration-break:clone] [-webkit-box-decoration-break:clone]" : undefined}
                      style={idx === currentLine ? { backgroundImage: "linear-gradient(transparent 55%, #F4D35E99 55%)" } : undefined}
                    >
                      {line}
                    </span>
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-[16px] text-[#5A6478]">
                {inProgress ? "The narration is being written. It will appear here." : "No transcript for this lesson."}
              </p>
            )}
          </div>

          <button
            type="button"
            className="btn-pill btn-pill-primary w-full"
            onClick={() => quizRef.current?.showModal()}
            disabled={!isCompleted}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Quiz me on this
          </button>

          <div className="rounded-[14px] border-[1.5px] border-dashed border-line p-4">
            <p className="mono-label">Your question</p>
            <p className="mt-1.5 font-serif italic text-[18px] text-chalk break-words">“{video.prompt}”</p>
          </div>
        </aside>
      </main>

      {/* Quiz me: UI-only placeholder. No API calls. */}
      <dialog
        ref={quizRef}
        aria-labelledby="quiz-title"
        className="paper m-auto w-[min(520px,92vw)] p-0 backdrop:bg-slate/70 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) quizRef.current?.close();
        }}
      >
        <div className="relative px-8 pb-8 pt-8 leading-[32px]">
          <button
            type="button"
            onClick={() => quizRef.current?.close()}
            className="absolute right-4 top-4 rounded-full p-1 text-pen hover:bg-pen/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <p className="hand text-[26px] text-[#D9534F]">coming soon</p>
          <h2 id="quiz-title" className="font-serif italic text-[28px] leading-tight text-pen">Quizzes are on the way</h2>
          <p className="mt-2 text-[16px] leading-[26px] text-pen/80">
            Soon you&apos;ll get three quick questions written from this lesson to check what stuck.
          </p>
          <div className="mt-4 rounded-[10px] border-[1.5px] border-dashed border-pen/30 bg-white/50 px-4 py-3 leading-[24px]">
            <p className="mono-label !text-pen/70">Example (not from this lesson)</p>
            <p className="mt-1 font-bold text-pen">A right triangle has legs 3 and 4. How long is the longest side?</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {["5", "6", "7"].map((a) => (
                <li key={a} className="chip">{a}</li>
              ))}
            </ul>
          </div>
          <button type="button" onClick={() => quizRef.current?.close()} className="btn-pill mt-5 w-full border-pen bg-pen text-paper hover:bg-pen/90 hover:text-paper">
            Got it
          </button>
        </div>
      </dialog>
    </div>
  );
}

function CustomVideoPlayer({ url, onProgress }: { url: string; onProgress?: (fraction: number) => void }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (!videoElement) return;

        const handleTimeUpdate = () => {
            setCurrentTime(videoElement.currentTime);
            const fraction = videoElement.duration ? videoElement.currentTime / videoElement.duration : 0;
            setProgress(fraction * 100);
            onProgress?.(fraction);
        };

        const handleLoadedMetadata = () => {
            setDuration(videoElement.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
        };

        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.addEventListener('ended', handleEnded);

        return () => {
            videoElement.removeEventListener('timeupdate', handleTimeUpdate);
            videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
            videoElement.removeEventListener('ended', handleEnded);
        };
    }, [videoElement, onProgress]);

    const togglePlay = () => {
        if (!videoElement) return;
        if (isPlaying) {
            videoElement.pause();
        } else {
            videoElement.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds)) return "0:00";
        const m = Math.floor(timeInSeconds / 60).toString();
        const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="group relative h-full w-full bg-slate" onClick={togglePlay}>
            <video
                ref={setVideoElement}
                src={url}
                className="relative z-10 h-full w-full object-contain"
                controlsList="nodownload"
            />

            <div className={`absolute inset-x-0 bottom-0 z-20 flex items-center gap-3.5 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3.5 pt-8 transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100 focus-within:opacity-100' : 'opacity-100'}`}>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow text-slate"
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                </button>
                <span className="mono-label !text-chalk">{formatTime(currentTime)} / {formatTime(duration)}</span>
                <div
                    className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/20"
                    role="slider"
                    aria-label="Seek"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!videoElement) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos = (e.clientX - rect.left) / rect.width;
                        videoElement.currentTime = pos * videoElement.duration;
                    }}
                >
                    <div className="h-full rounded-full bg-yellow" style={{ width: `${progress}%` }} />
                </div>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); videoElement?.requestFullscreen?.(); }}
                    className="text-chalk hover:text-yellow"
                    aria-label="Full screen"
                >
                    <Maximize className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>

            {!isPlaying && (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow/90 text-slate shadow-lg">
                        <Play className="ml-1 h-7 w-7" aria-hidden="true" />
                    </div>
                </div>
            )}
        </div>
    );
}
