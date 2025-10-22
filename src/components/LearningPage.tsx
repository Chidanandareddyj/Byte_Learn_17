"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Download, Share2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
const heroImage = "/generated_images/Manim_math_animation_demo_14bc8a1a.png";

interface Video {
  id: string;
  title: string;
  script: string;
  explanation: {
    steps: Array<{
      heading: string;
      content: string;
    }>;
  };
}

export function LearningPage() {
  const [showTranscript, setShowTranscript] = useState(false);
  const searchParams = useSearchParams();
  const videoId = searchParams.get("id") ?? undefined;

  // TODO: Uncomment when /api/videos/:id route is implemented
  // const { data: video, isLoading } = useQuery<Video>({
  //   queryKey: ["/api/videos", videoId],
  //   enabled: !!videoId,
  // });
  
  // Mock video data for now - remove when API is ready
  const video: Video | undefined = videoId ? {
    id: videoId,
    title: "Sample Video Title",
    script: "This is a sample transcript.\n\nIt has multiple paragraphs.",
    explanation: {
      steps: [
        {
          heading: "Step 1",
          content: "This is the first step of the explanation."
        },
        {
          heading: "Step 2",
          content: "This is the second step of the explanation."
        }
      ]
    }
  } : undefined;
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="min-h-screen notebook-bg">
        <Navbar variant="app" />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
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

  return (
    <div className="min-h-screen notebook-bg">
      <Navbar variant="app" />

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <div className="aspect-video rounded-xl overflow-hidden bg-muted border shadow-lg">
              <img
                src={heroImage}
                alt="Learning video"
                className="w-full h-full object-cover"
                data-testid="img-learning-video"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => console.log("Regenerate")} data-testid="button-regenerate">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button variant="outline" onClick={() => console.log("Download")} data-testid="button-download">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={() => console.log("Share")} data-testid="button-share">
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
                  {video.script.split("\n\n").map((paragraph, idx) => (
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
              </div>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="p-6 space-y-6">
                  {video.explanation.steps.map((step, index) => (
                    <div key={index} className="space-y-2" data-testid={`section-step-${index}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">{step.heading}</h3>
                          <p className="text-muted-foreground leading-relaxed">{step.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


