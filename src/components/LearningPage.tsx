"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { JetBrains_Mono, Source_Serif_4 } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"] });

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

  const getProgressPercentage = () => {
    if (video?.status === "QUEUED") {
      return Math.min(10 + (elapsedTime * 0.5), 25);
    } else if (video?.status === "PROCESSING") {
      const estimatedDuration = 240;
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
      <div className={`min-h-screen bg-bytelearn-back text-[#f0f4f2] ${sourceSerif.className} flex flex-col`}>
        <Navbar variant="app" />
        <div className="flex items-center justify-center flex-1">
          <div className="p-8 text-center text-[#a8b5ae] border border-[rgba(255,255,255,0.2)] bg-[rgba(0,0,0,0.2)]">
            <p>Error: Video not found</p>
          </div>
        </div>
      </div>
    );
  }

  const isFailed = video.status === "FAILED";
  const isCompleted = video.status === "COMPLETED";

  const paragraphs = video.explanation ? video.explanation.split('\n\n') : [];
  const chapters = paragraphs.filter(p => p.match(/^\[Scene (\d+)\]/)).map(p => {
      const match = p.match(/^\[Scene (\d+)\]/);
      const content = p.replace(/^\[Scene \d+\]\n?/, '');
      return { scene: match ? match[1] : '', content };
  });
  
  const generalExplanation = paragraphs.find(p => !p.match(/^\[Scene /) && p.length > 20) || "Generating intuitive visualization of the mathematical concept. Exploring algorithmic structures...";

  return (
    <div className={`h-screen bg-bytelearn-back text-[#f0f4f2] ${sourceSerif.className} flex flex-col overflow-hidden`}>
      <Navbar variant="app" />
      
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] h-[calc(100vh-80px)] mt-[80px]">
        
        {/* Left Player Area */}
        <section className="p-8 lg:p-10 flex flex-col border-r border-[rgba(255,255,255,0.2)] overflow-y-auto relative custom-scrollbar">
            <div className="absolute inset-0 bg-bytelearn-spatial opacity-10 pointer-events-none"></div>
            
            <div className="w-full aspect-video bg-black relative border border-[rgba(255,255,255,0.2)] flex items-center justify-center mb-6 overflow-hidden shadow-2xl shrink-0">
                {!isCompleted && !isFailed && (
                   <div className="absolute inset-0 bg-bytelearn-spatial opacity-20" style={{ backgroundSize: '40px 40px' }}></div>
                )}
                
                {isCompleted && video.videoUrl ? (
                    <CustomVideoPlayer url={video.videoUrl} />
                ) : isFailed ? (
                    <div className="relative z-10 text-center text-[#ff3333] flex flex-col items-center">
                        <span className="text-4xl italic mb-4">FAILED TO COMPILE</span>
                        <div className={`text-[10px] uppercase font-mono tracking-widest text-[#a8b5ae] ${jetbrainsMono.className}`}>
                            {video.errorMessage || "System error during visualization compiling."}
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <div className="text-[48px] italic text-[#f0f4f2] opacity-30 pointer-events-none drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] absolute">
                            ∫<sub className="text-[20px] ml-1">Γ</sub> f(z) dz = 0
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black to-transparent flex flex-col gap-3">
                            <div className="h-[2px] bg-[rgba(255,255,255,0.2)] relative overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-[#f0f4f2] transition-all duration-500 shadow-[0_0_10px_#f0f4f2]" style={{ width: `${getProgressPercentage()}%` }}></div>
                            </div>
                            <div className={`flex items-center justify-between text-[10px] tracking-[0.1em] text-[#a8b5ae] uppercase ${jetbrainsMono.className}`}>
                                <div>{video.status === 'QUEUED' ? 'AWAITING RESOURCES [DISPATCH]' : 'COMPILING SCENES [RENDER]'}</div>
                                <div>{formatTime(elapsedTime)} / ~04:00</div>
                                <div>MathRenderer // GEN_04</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative z-10 flex-col flex gap-2">
                <h1 className="text-3xl font-light italic mb-1">{video.title}</h1>
                <div className={`flex gap-6 text-[11px] text-[#a8b5ae] border-b border-[rgba(255,255,255,0.2)] pb-5 mb-5 uppercase tracking-[0.1em] ${jetbrainsMono.className}`}>
                    <span>ID: DERIVATION_{video.id?.[0]?.toUpperCase() ?? 'X'}{video.id?.slice(-4)?.toUpperCase() ?? '0000'}</span>
                    <span>PUBLISHED: {format(new Date(video.createdAt || Date.now()), 'MM.dd.yy')}</span>
                    <span>VIEWS: 0</span>
                </div>
                
                <p className="text-[16px] leading-[1.6] opacity-90 max-w-4xl">
                    {generalExplanation}
                </p>
                
                <div className="mt-8 space-y-4 max-w-4xl border-t border-[rgba(255,255,255,0.1)] pt-6">
                    {chapters.length === 0 ? (
                        video.explanation?.split('\n\n').filter(p => p !== generalExplanation && !p.match(/^\[Scene /)).map((p, idx) => (
                            <p key={idx} className="text-[15px] text-[#a8b5ae] leading-relaxed">{p}</p>
                        ))
                    ) : (
                        chapters.map((chap, idx) => (
                             <div key={idx} className="mb-4 text-[#a8b5ae] text-[15px] leading-[1.6]">
                                 <strong className="text-[#f0f4f2] font-normal italic pr-2">Scene {chap.scene}:</strong>
                                 {chap.content}
                             </div>
                        ))
                    )}
                </div>
            </div>
        </section>

        {/* Right Sidebar Area */}
        <aside className="bg-[rgba(0,0,0,0.2)] flex flex-col overflow-y-auto border-l border-[rgba(255,255,255,0.1)] custom-scrollbar">
            
            {/* Structural Chapters Overview */}
            <div className="p-8 border-b border-[rgba(255,255,255,0.2)]">
                <div className={`text-[11px] text-[#a8b5ae] uppercase mb-5 flex items-center gap-2 tracking-[0.1em] ${jetbrainsMono.className}`}>
                    <div className="w-1 h-1 bg-[#f0f4f2]"></div>
                    Structural Chapters
                </div>
                
                {chapters.length > 0 ? (
                    <ul className="list-none flex flex-col text-[14px]">
                        {chapters.map((chap, idx) => (
                            <li key={idx} className={`flex justify-between py-3 border-b border-[rgba(255,255,255,0.1)] last:border-0 ${idx === 0 ? 'text-[#f0f4f2] italic' : 'text-[#a8b5ae]'}`}>
                                <span className="truncate pr-4">{String(idx + 1).padStart(2,'0')}. {chap.content.split(' ').slice(0, 4).join(' ')}...</span>
                                <span className={`text-[10px] mt-1 shrink-0 ${jetbrainsMono.className}`}>00:00</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className={`text-[10px] text-[#a8b5ae] italic ${jetbrainsMono.className}`}>
                        [AWAITING_STRUCTURAL_ANALYSIS]
                    </div>
                )}
            </div>

            {/* Active Axioms (Prompt) */}
            <div className="p-8 border-b border-[rgba(255,255,255,0.2)]">
                <div className={`text-[11px] text-[#a8b5ae] uppercase mb-5 flex items-center gap-2 tracking-[0.1em] ${jetbrainsMono.className}`}>
                    <div className="w-1 h-1 bg-[#f0f4f2]"></div>
                    Learning Prompt
                </div>
                
                <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.2)] p-5 mb-4 text-center text-[18px] italic leading-relaxed break-words">
                    {video.prompt}
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <span className={`text-[9px] px-2 py-1 border border-[rgba(255,255,255,0.2)] text-[#a8b5ae] uppercase tracking-wide ${jetbrainsMono.className}`}>User_Input</span>
                    <span className={`text-[9px] px-2 py-1 border border-[rgba(255,255,255,0.2)] text-[#a8b5ae] uppercase tracking-wide ${jetbrainsMono.className}`}>Prompt</span>
                </div>
            </div>

            {/* Narration Transcript */}
            <div className="p-8">
                <div className={`text-[11px] text-[#a8b5ae] uppercase mb-5 flex items-center gap-2 tracking-[0.1em] ${jetbrainsMono.className}`}>
                    <div className="w-1 h-1 bg-[#f0f4f2]"></div>
                    Narration Transcript
                </div>
                
                <div className="space-y-4 text-[13px] text-[#a8b5ae] opacity-80 leading-relaxed border-l border-[rgba(255,255,255,0.1)] pl-4">
                    {video.narration ? (
                        video.narration.split('\n\n').map((p, idx) => (
                            <p key={idx}>{p}</p>
                        ))
                    ) : (
                        <p className={`text-[10px] italic ${jetbrainsMono.className}`}>[GENERATING_VOCAL_TRACT...]</p>
                    )}
                </div>
            </div>
            
        </aside>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.4);
        }
      `}} />
    </div>
  );
}

function CustomVideoPlayer({ url }: { url: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (!videoElement) return;

        const handleTimeUpdate = () => {
            setCurrentTime(videoElement.currentTime);
            setProgress((videoElement.currentTime / videoElement.duration) * 100);
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
    }, [videoElement]);

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
        if (isNaN(timeInSeconds)) return "00:00";
        const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="relative w-full h-full group" onClick={togglePlay}>
            <video
                ref={setVideoElement}
                src={url}
                className="w-full h-full object-contain relative z-10"
                controlsList="nodownload"
            />
            
            {/* Overlay Gradient (appears on hover or when paused) */}
            <div className={`absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[rgba(0,0,0,0.8)] to-transparent z-20 flex flex-col gap-3 transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                
                {/* Progress Bar */}
                <div className="h-[2px] bg-[rgba(255,255,255,0.2)] relative cursor-pointer" onClick={(e) => {
                    e.stopPropagation();
                    if (!videoElement) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    videoElement.currentTime = pos * videoElement.duration;
                }}>
                    <div 
                        className="absolute top-0 left-0 h-full bg-[#f0f4f2] transition-all duration-100" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
                
                {/* Controls Row */}
                <div className={`flex items-center justify-between text-[10px] tracking-[0.1em] text-[#f0f4f2] font-mono uppercase ${jetbrainsMono.className}`}>
                    <div className="cursor-pointer hover:text-white" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                        PLAY // PAUSE [SPACE]
                    </div>
                    <div className="text-[#a8b5ae]">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                    <div className="text-[#a8b5ae]">
                        HD // 60 FPS
                    </div>
                </div>
            </div>

            {/* Big Center Play Icon when paused */}
            {!isPlaying && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(0,0,0,0.4)] backdrop-blur-sm flex items-center justify-center">
                        <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[12px] border-l-[#f0f4f2] border-b-8 border-b-transparent ml-1"></div>
                    </div>
                </div>
            )}
        </div>
    );
}


