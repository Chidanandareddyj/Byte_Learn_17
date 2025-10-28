import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { Play, Download } from "lucide-react";
import Link from "next/link";

interface VideoCardProps {
  id: string;
  title: string;
  videoUrl: string | null;
  date: string;
}

export function VideoCard({ id, title, videoUrl, date }: VideoCardProps) {
  return (
    <Card className="relative overflow-hidden hover-elevate transition-all group">
      <BorderBeam size={100} duration={15} delay={Math.random() * 5} borderWidth={1.5} />
      <div className="relative aspect-video bg-muted">
        {videoUrl ? (
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            data-testid={`img-video-${id}`}
            muted
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">No video available</p>
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
              if (videoUrl) {
                window.open(videoUrl, '_blank');
              }
            }} 
            data-testid={`button-download-${id}`}
            disabled={!videoUrl}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}


