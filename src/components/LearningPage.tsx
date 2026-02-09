"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Download, Share2, ChevronDown, ChevronUp, Loader2, Clock, Film } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type VideoStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

interface Video {
  id: string;
  title: string;
  prompt: string;
  explanation: string;
  narration: string;
  videoUrl: string | null;
  status: VideoStatus;
  errorMessage: string | null;
  createdAt: string;
}

export function LearningPage() {
  const [showTranscript, setShowTranscript] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const searchParams = useSearchParams();
  const videoId = searchParams.get("id") ?? undefined;

  const { data: video, isLoading } = useQuery<Video>({
    queryKey: ["/api/videos", videoId],
    queryFn: async () => {
      if (!videoId) throw new Error("No video ID");
      const res = await fetch(`/api/videos/${videoId}`);
      if (!res.ok) throw new Error("Failed to fetch video");
      return res.json();
    },
    enabled: !!videoId,
    refetchInterval: (query) =>
      query.state.data?.status !== "COMPLETED" ? 5000 : false,
  });

  // Timer for elapsed time during processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (video && (video.status === "PROCESSING" || video.status === "QUEUED")) {
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

  // Calculate progress percentage based on elapsed time and estimated duration
  const getProgressPercentage = () => {
    if (video?.status === "QUEUED") {
      // Slowly increase from 10% to 25% while queued
      return Math.min(10 + (elapsedTime * 0.5), 25);
    } else if (video?.status === "PROCESSING") {
      // Start at 25% and gradually increase to 90% over 4 minutes (240 seconds)
      // Never reach 100% until actually completed
      const estimatedDuration = 240; // 4 minutes in seconds
      const progress = 25 + ((elapsedTime / estimatedDuration) * 65);
      return Math.min(progress, 90);
    }
    return 0;
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!video) {
    return (
      <div className="min-h-screen notebook-bg">
        <Navbar variant="app" />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Video not found</p>
          </Card>
        </div>
      </div>
    );
  }

  const isFailed = video.status === "FAILED";
  const failureReason = video.errorMessage || "The rendering service reported an error.";

  return (
    <div className="min-h-screen notebook-bg">
      <Navbar variant="app" />

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  video.status === "COMPLETED"
                    ? "bg-primary/10 text-primary"
                    : video.status === "FAILED"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-secondary/10 text-secondary"
                }`}
              >
                {video.status === "COMPLETED" && "Ready"}
                {video.status === "PROCESSING" && "Processing"}
                {video.status === "QUEUED" && "Queued"}
                {video.status === "FAILED" && "Failed"}
              </span>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden bg-muted border shadow-lg">
              {video.status === "COMPLETED" && video.videoUrl ? (
                <video
                  src={video.videoUrl}
                  controls
                  className="w-full h-full object-cover"
                  data-testid="video-player"
                  controlsList="nodownload"
                >
                  Your browser does not support the video tag.
                </video>
              ) : isFailed ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
                  <p className="font-semibold text-destructive">We could not finish the video.</p>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md">{failureReason}</p>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 px-6">
                  

                  {/* Status message */}
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {video.status === "QUEUED" ? "Your video is queued" : "Generating your video"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {video.status === "QUEUED" 
                        ? "Your video is in the queue and will start processing shortly..."
                        : "We're creating your educational video with animations and narration..."
                      }
                    </p>
                  </div>

                  {/* Timer and estimated time */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Elapsed: {formatTime(elapsedTime)}</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="text-muted-foreground">
                      <span>Est. time: 4-6 min</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full max-w-md space-y-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                        style={{ 
                          width: `${getProgressPercentage()}%`
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {video.status === "QUEUED" ? "Waiting in queue..." : "Processing video..."}
                      </span>
                      <span className="font-medium">
                        {Math.round(getProgressPercentage())}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => window.location.reload()} data-testid="button-regenerate">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (video.videoUrl) {
                    window.open(video.videoUrl, '_blank');
                  }
                }} 
                data-testid="button-download"
                disabled={!video.videoUrl || video.status !== "COMPLETED"}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (navigator.share && video.videoUrl) {
                    navigator.share({
                      title: video.title,
                      text: video.prompt,
                      url: window.location.href,
                    });
                  }
                }} 
                data-testid="button-share"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            <Card>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="w-full px-6 py-4 flex items-center justify-between hover-elevate"
                data-testid="button-toggle-transcript"
              >
                <span className="font-semibold">Transcript</span>
                {showTranscript ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              {showTranscript && (
                <div className="px-6 pb-6 space-y-3 text-sm text-muted-foreground" data-testid="text-transcript">
                  {video.narration.split("\n\n").map((paragraph: string, idx: number) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="sticky top-24">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold" data-testid="text-explanation-title">{video.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">Generated explanation</p>
              </div>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Original Prompt */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Your Prompt
                      </h3>
                      <div className="rounded-lg bg-muted/50 p-4 border-l-4 border-primary">
                        <p className="text-sm leading-relaxed text-foreground/90">
                          {video.prompt}
                        </p>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Explanation
                      </h3>
                      <div className="space-y-4">
                        {video.explanation.split('\n\n').map((paragraph: string, index: number) => {
                          // Check if paragraph starts with a scene marker
                          const sceneMatch = paragraph.match(/^\[Scene (\d+)\]/);

                          if (sceneMatch) {
                            const sceneNumber = sceneMatch[1];
                            const content = paragraph.replace(/^\[Scene \d+\]\n?/, '');

                            return (
                              <div key={index} className="space-y-2" data-testid={`section-scene-${sceneNumber}`}>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                    {sceneNumber}
                                  </div>
                                  <div className="h-px bg-border flex-1"></div>
                                </div>
                                <div className="ml-9">
                                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                                    {content}
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          // Check for section headers (lines that are short and end with colon)
                          if (paragraph.length < 50 && paragraph.includes(':')) {
                            return (
                              <div key={index} className="space-y-2">
                                <h4 className="text-sm font-semibold text-foreground">
                                  {paragraph}
                                </h4>
                              </div>
                            );
                          }

                          // Regular paragraph with better formatting
                          return (
                            <div key={index} className="space-y-2">
                              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                                {paragraph}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


