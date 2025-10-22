"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface Video {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
}

export function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setPrompt("");
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generateMutation.mutate(prompt);
  };

  return (
    <div className="min-h-screen notebook-bg">
      <Navbar variant="app" />

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Create New Learning
                </CardTitle>
                <CardDescription>
                  Describe what you want to learn and we'll create a visual explanation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Example: Explain how derivatives work using the slope of a tangent line..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-32 resize-none"
                  data-testid="input-prompt"
                  disabled={generateMutation.isPending}
                />
                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generateMutation.isPending}
                  data-testid="button-generate"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Learning Video"
                  )}
                </Button>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium">Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Be specific about the concept</li>
                    <li>Mention the level (beginner/advanced)</li>
                    <li>Include examples if helpful</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Your Learning History</h2>
              <p className="text-muted-foreground">Access your previously generated videos</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : videos.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    id={video.id}
                    title={video.title}
                    thumbnail={"/generated_images/Manim_math_animation_demo_14bc8a1a.png"}
                    date={formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  No videos yet. Create your first learning video to get started!
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


