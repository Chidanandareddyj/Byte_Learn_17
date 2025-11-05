import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { Play, Download, AlertTriangle } from "lucide-react";
import Link from "next/link";

type VideoStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

interface VideoCardProps {
  id: string;
  title: string;
  videoUrl: string | null;
  status: VideoStatus;
  errorMessage: string | null;
  date: string;
}

export function VideoCard({ id, title, videoUrl, status, errorMessage, date }: VideoCardProps) {
  const isReady = status === "COMPLETED" && !!videoUrl;
  const isFailed = status === "FAILED";

  return (
    <Card className="relative overflow-hidden hover-elevate transition-all group">
      <BorderBeam size={100} duration={15} delay={Math.random() * 5} borderWidth={1.5} />
      <div className="relative aspect-video bg-muted">
        {isReady ? (
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            data-testid={`img-video-${id}`}
            muted
            playsInline
          />
        ) : isFailed ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-destructive font-medium">Processing failed</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">
              {status === "QUEUED" ? "Queued for processing" : "Processing video"}
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
          <Link href={`/learn?id=${id}`}>
            <Button 
              size="icon" 
              className="h-16 w-16 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform" 
              data-testid={`button-play-${id}`}
            >
              <Play className="h-7 w-7" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-1" data-testid={`text-title-${id}`}>{title}</h3>
        <p className="text-sm text-muted-foreground mb-3" data-testid={`text-date-${id}`}>{date}</p>
        <div className="mb-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              status === "COMPLETED"
                ? "bg-emerald-100 text-emerald-700"
                : status === "FAILED"
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {status === "COMPLETED" && "Ready"}
            {status === "PROCESSING" && "Processing"}
            {status === "QUEUED" && "Queued"}
            {status === "FAILED" && "Failed"}
          </span>
          {isFailed && errorMessage && (
            <p className="mt-2 text-xs text-muted-foreground" data-testid={`text-error-${id}`}>
              {errorMessage}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/learn?id=${id}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full" data-testid={`button-view-${id}`}>
              View
            </Button>
          </Link>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              if (isReady) {
                window.open(videoUrl, '_blank');
              }
            }} 
            data-testid={`button-download-${id}`}
            disabled={!isReady}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}


