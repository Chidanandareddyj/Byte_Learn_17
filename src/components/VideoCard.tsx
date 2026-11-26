import Link from "next/link";
import { Play, RotateCcw } from "lucide-react";
import { FigureFor } from "@/components/ChalkFigures";
import { generationStageLabel, isGenerationInProgress } from "@/lib/generation-status";

type VideoStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

interface VideoCardProps {
  id: string;
  title: string;
  videoUrl: string | null;
  status: VideoStatus;
  stage?: string | null;
  errorMessage: string | null;
  date: string;
  /** Called with the card when the user taps "Try again" on a failed lesson. */
  onRetry?: () => void;
}

export function VideoCard({ id, title, videoUrl, status, stage, errorMessage, date, onRetry }: VideoCardProps) {
  const isReady = status === "COMPLETED" && !!videoUrl;
  const isFailed = status === "FAILED";
  const inProgress = isGenerationInProgress(status);
  const label = title || "Untitled lesson";

  const tag = isReady
    ? { text: "Ready", cls: "bg-green/15 text-green" }
    : isFailed
      ? { text: "Didn't finish", cls: "bg-pink/15 text-pink" }
      : inProgress
        ? { text: "Drawing…", cls: "bg-yellow/15 text-yellow" }
        : { text: "No video", cls: "bg-chalk/10 text-muted-foreground" };

  return (
    <article className="group grid grid-cols-[150px_1fr] items-center gap-4 rounded-[14px] border-[1.5px] border-line bg-board p-3 transition-colors hover:border-chalk/40">
      <Link
        href={`/learn?id=${id}`}
        className="relative block h-[96px] overflow-hidden rounded-lg bg-slate px-2.5 py-2"
        aria-label={`Open lesson: ${label}`}
        data-testid={`button-play-${id}`}
      >
        <FigureFor seed={id} className={`h-full w-full ${inProgress ? "opacity-50 motion-safe:animate-pulse" : ""}`} />
        {isReady && (
          <span className="absolute inset-0 flex items-center justify-center bg-slate/60 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow text-slate">
              <Play className="h-4 w-4" aria-hidden="true" />
            </span>
          </span>
        )}
      </Link>

      <div className="min-w-0">
        <Link
          href={`/learn?id=${id}`}
          className="line-clamp-2 text-[16px] font-bold leading-snug text-chalk hover:underline decoration-yellow underline-offset-4"
          data-testid={`text-title-${id}`}
        >
          {label}
        </Link>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className={`inline-flex h-[26px] items-center whitespace-nowrap rounded-full px-2.5 text-[13px] font-bold ${tag.cls}`}>
            {tag.text}
          </span>
          {inProgress && <span className="text-[13px] text-muted-foreground">{generationStageLabel(stage)}</span>}
          <span className="mono-label !text-[11px] ml-auto">{date}</span>
        </div>
        {isFailed && (
          <div className="mt-2 flex items-center gap-3">
            {errorMessage && (
              <p className="min-w-0 flex-1 truncate text-[13px] text-pink/80" title={errorMessage}>
                {errorMessage}
              </p>
            )}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap text-[14px] font-bold text-pink hover:text-chalk"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
