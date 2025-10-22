import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Download } from "lucide-react";
import Link from "next/link";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  date: string;
}

export function VideoCard({ id, title, thumbnail, date }: VideoCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate transition-all group">
      <div className="relative aspect-video bg-muted">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
          data-testid={`img-video-${id}`}
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Link href={`/learn?id=${id}`}>
            <Button size="icon" className="h-14 w-14 rounded-full" data-testid={`button-play-${id}`}>
              <Play className="h-6 w-6" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-1" data-testid={`text-title-${id}`}>{title}</h3>
        <p className="text-sm text-muted-foreground mb-3" data-testid={`text-date-${id}`}>{date}</p>
        <div className="flex gap-2">
          <Link href={`/learn?id=${id}`}>
            <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-${id}`}>
              View
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={() => console.log("Download", id)} data-testid={`button-download-${id}`}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}


