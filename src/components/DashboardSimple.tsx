"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Languages } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Video {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  videoUrl: string | null;
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

export function DashboardSimple() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("english");
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple fetch function
  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/videos");
      if (!response.ok) throw new Error("Failed to fetch videos");
      const data = await response.json();
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch videos when component mounts
  useEffect(() => {
    fetchVideos();
  }, []);

  // Simple generate function
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, language }),
      });
      
      if (!response.ok) throw new Error("Failed to generate");
      
      // After successful generation, refetch videos
      await fetchVideos();
      setPrompt(""); // Clear the input
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate video");
    } finally {
      setIsGenerating(false);
    }
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
                  Describe what you want to learn and we&apos;ll create a visual explanation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Narration Language
                  </label>
                  <Select value={language} onValueChange={setLanguage} disabled={isGenerating}>
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
                  className="min-h-32 resize-none"
                  data-testid="input-prompt"
                  disabled={isGenerating}
                />
                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  data-testid="button-generate"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Learning Video"
                  )}
                </Button>
                
                {error && (
                  <div className="text-red-500 text-sm">
                    {error}
                  </div>
                )}
                
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
                    videoUrl={video.videoUrl}
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
