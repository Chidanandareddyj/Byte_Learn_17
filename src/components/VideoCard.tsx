import { Play, Download, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { JetBrains_Mono, Source_Serif_4 } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"] });

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

  const getStatusText = () => {
    switch (status) {
      case "COMPLETED": return "MP4 // RENDER_COMPLETE";
      case "PROCESSING": return "PENDING_COMPILATION";
      case "QUEUED": return "QUEUED_IN_PIPELINE";
      case "FAILED": return "ERR_GENERATION_FAILED";
      default: return "";
    }
  };

  const getTimeLabel = () => {
    if (isReady) return "00:24"; // Placeholder duration since we don't have it in data model
    if (status === "PROCESSING") return "SYNC";
    if (status === "QUEUED") return "WAIT";
    return "ERR";
  };

  return (
    <div className="bg-[#003049] border border-[rgba(255,255,255,0.15)] p-3 flex flex-col gap-3 transition-all duration-200 hover:border-[#f0f4f2] hover:-translate-y-0.5 cursor-pointer group">
      
      {/* Thumbnail Area */}
      <div className="aspect-video bg-[#004266] border-b border-b-[rgba(255,255,255,0.15)] flex items-center justify-center relative overflow-hidden group">
        {isReady ? (
          <>
             <video
               src={videoUrl}
               className="w-full h-full object-cover"
               data-testid={`img-video-${id}`}
               muted
               playsInline
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
               <Link href={`/learn?id=${id}`}>
                 <div className="w-12 h-12 flex items-center justify-center border border-[#f0f4f2] rounded-none hover:bg-[#f0f4f2] hover:text-[#003049] text-[#f0f4f2] transition-colors" data-testid={`button-play-${id}`}>
                   <Play className="h-5 w-5" />
                 </div>
               </Link>
             </div>
          </>
        ) : isFailed ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-4 bg-[#003049]">
            <AlertTriangle className="h-6 w-6 text-red-500 opacity-80" />
            <p className={`text-[10px] text-red-400 font-medium uppercase tracking-wider ${jetbrainsMono.className}`}>Compilation Refused</p>
          </div>
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-[24px] text-[#f0f4f2] opacity-40 font-light italic ${sourceSerif.className}`}>
             f(x)
          </div>
        )}

        <div className={`absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 text-[9px] text-[#f0f4f2] tracking-wider uppercase ${jetbrainsMono.className}`}>
           {getTimeLabel()}
        </div>
      </div>

      {/* Meta Area */}
      <div className="flex flex-col gap-1 mt-1">
        <Link href={`/learn?id=${id}`}>
          <div className={`text-[11px] text-[#f0f4f2] uppercase tracking-[0.05em] whitespace-nowrap overflow-hidden text-ellipsis ${jetbrainsMono.className} hover:underline decoration-1 underline-offset-2`} data-testid={`text-title-${id}`}>
            {title || `Derivation_${id.substring(0,8)}`}
          </div>
        </Link>
        <div className={`text-[9px] text-[#a8b5ae] uppercase tracking-wider opacity-60 flex gap-2 ${jetbrainsMono.className}`}>
           <span className={`${isFailed ? 'text-red-400' : ''}`}>{getStatusText()}</span>
        </div>
        {isFailed && errorMessage && (
          <div className={`text-[9px] text-red-400 mt-1 uppercase truncate opacity-80 ${jetbrainsMono.className}`}>
             TRACE: {errorMessage}
          </div>
        )}
      </div>

    </div>
  );
}


