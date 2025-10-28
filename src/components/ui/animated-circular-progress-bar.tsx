import { cn } from "@/lib/utils";

interface AnimatedCircularProgressBarProps {
  max?: number;
  min?: number;
  value: number;
  gaugePrimaryColor?: string;
  gaugeSecondaryColor?: string;
  className?: string;
}

export function AnimatedCircularProgressBar({
  max = 100,
  min = 0,
  value = 0,
  gaugePrimaryColor = "#0ea5e9",
  gaugeSecondaryColor = "#e2e8f0",
  className,
}: AnimatedCircularProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, min), max);
  const normalized = (clampedValue - min) / (max - min);
  const circumference = 2 * Math.PI * 45;
  const progressDashArray = `${normalized * circumference} ${circumference}`;

  return (
    <div className={cn("relative size-36", className)}>
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        role="presentation"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          strokeWidth="8"
          stroke={gaugeSecondaryColor}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          transform="rotate(-90 50 50)"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          strokeWidth="8"
          stroke={gaugePrimaryColor}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={progressDashArray}
          transform="rotate(-90 50 50)"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="relative flex h-full items-center justify-center">
        <span className="text-3xl font-semibold text-foreground">
          {Math.round(normalized * 100)}%
        </span>
      </div>
    </div>
  );
}
