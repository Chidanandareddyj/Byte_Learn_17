"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { VideoCard } from "@/components/VideoCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Languages } from "lucide-react";
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
  errorMessage: string | null;
}

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi (हिन्दी)" },
  { value: "telugu", label: "Telugu (తెలుగు)" },
  { value: "tamil", label: "Tamil (தமிழ்)" },
  { value: "kannada", label: "Kannada (ಕನ್ನಡ)" },
  { value: "malayalam", label: "Malayalam (മലയാളം)" },
  { value: "bengali", label: "Bengali (বাংলা)" },
  { value: "marathi", label: "Marathi (मराठी)" },
  { value: "gujarati", label: "Gujarati (ગુજરાતી)" },
];

export function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("english");
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
    queryFn: async () => {
      const res = await fetch("/api/videos");
      if (!res.ok) throw new Error("Failed to fetch videos");
      return res.json();
    },
    refetchInterval: (query) =>
      query.state.data?.some((video: Video) => video.status !== "COMPLETED")
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

  // Show loading screen when generating
  if (generateMutation.isPending) {
    return <LoadingScreen prompt={prompt} />;
  }

  return (
    <div className="min-h-screen notebook-bg">
      <Navbar variant="app" />

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <Card className="relative overflow-hidden">
                <BorderBeam size={150} duration={10} delay={0} />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                    Create New Learning
                  </CardTitle>
                  <CardDescription>
                    Describe what you want to learn and we&apos;ll create a visual explanation
                  </CardDescription>
                </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Narration Language
                  </label>
                  <Select value={language} onValueChange={setLanguage} disabled={generateMutation.isPending}>
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Example: Explain how derivatives work using the slope of a tangent line..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-32 resize-none focus:ring-2 focus:ring-primary/20 transition-all"
                  data-testid="input-prompt"
                  disabled={generateMutation.isPending}
                />
                <Button
                  className="w-full group"
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
                    <>
                      <Sparkles className="h-4 w-4 mr-2 transition-transform group-hover:rotate-12" />
                      Generate Learning Video
                    </>
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
                    videoUrl={video.videoUrl}
                    status={video.status}
                    errorMessage={video.errorMessage}
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


