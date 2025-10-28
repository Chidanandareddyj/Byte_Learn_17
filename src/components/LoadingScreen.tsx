"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Particles } from "@/components/ui/particles";
import { RetroGrid } from "@/components/ui/retro-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedList } from "@/components/ui/animated-list";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Brain, Loader2, Sparkles, Video, Wand2 } from "lucide-react";

interface LoadingScreenProps {
  prompt?: string;
}

export function LoadingScreen({ prompt }: LoadingScreenProps) {
  const steps = useMemo(
    () => [
      {
        id: "analysis",
        icon: Brain,
        label: "Understanding your brief",
        hint: "Parsing the prompt to pick out story beats",
        duration: 22,
      },
      {
        id: "ideation",
        icon: Wand2,
        label: "Sketching scene ideas",
        hint: "Selecting visuals, camera moves, and pacing",
        duration: 30,
      },
      {
        id: "render",
        icon: Video,
        label: "Rendering motion visuals",
        hint: "Animating frames and syncing narration cues",
        duration: 28,
      },
      {
        id: "polish",
        icon: Sparkles,
        label: "Polishing the final cut",
        hint: "Balancing audio, colors, and transitions",
        duration: 20,
      },
    ],
    [],
  );

  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [history, setHistory] = useState<number[]>([0]);

  const thresholds = useMemo(() => {
    let cumulative = 0;
    return steps.map((step) => {
      cumulative += step.duration;
      return cumulative;
    });
  }, [steps]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(prev + 0.5, 100);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const nextIndex = thresholds.findIndex((threshold) => progress < threshold);
    const resolvedIndex = nextIndex === -1 ? steps.length - 1 : nextIndex;

    if (resolvedIndex !== currentStep) {
      setCurrentStep(resolvedIndex);
    }
  }, [progress, thresholds, steps.length, currentStep]);

  useEffect(() => {
    setHistory((prev) => {
      if (prev.includes(currentStep)) {
        return prev;
      }
      return [...prev, currentStep];
    });
  }, [currentStep]);

  const CurrentIcon = steps[currentStep]?.icon ?? Brain;
  const displayedProgress = Math.round(progress);
  const safeHistory = history.filter((index) => steps[index]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur">
      <RetroGrid
        className="opacity-30"
        lightLineColor="#6b7280"
        darkLineColor="#1f2937"
        cellSize={70}
      />
      <Particles
        className="absolute inset-0"
        quantity={120}
        ease={80}
        color="#38bdf8"
        refresh={false}
      />

      <div className="relative z-10 w-full max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <Card className="overflow-hidden border border-border/60 bg-card/95 shadow-xl">
            <BorderBeam size={220} duration={15} delay={4} className="opacity-50" />
            <CardHeader className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border/80 bg-muted/40">
                    <CurrentIcon className="h-6 w-6 text-sky-500" />
                  </span>
                  Crafting your video
                </CardTitle>
                <CardDescription className="max-w-xl text-sm text-muted-foreground">
                  We are walking through a four-step build to produce the best possible render. Sit tight—this usually wraps in just a few minutes.
                </CardDescription>
                {prompt && (
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm">
                    <span className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">
                      Prompt snapshot
                    </span>
                    <p className="leading-relaxed text-foreground/90">{prompt}</p>
                  </div>
                )}
              </div>
              <AnimatedCircularProgressBar
                value={progress}
                gaugePrimaryColor="#0ea5e9"
                gaugeSecondaryColor="#1f2937"
                className="mx-auto md:mx-0"
              />
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {steps[currentStep]?.label ?? "Working"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {steps[currentStep]?.hint}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {displayedProgress}% complete
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-400"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  />
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === currentStep;
                  const isComplete = index < currentStep;

                  const previousThreshold = thresholds[index - 1] ?? 0;
                  const steppedProgress = Math.max(
                    Math.min(progress - previousThreshold, step.duration),
                    0,
                  );
                  const relativeProgress =
                    (steppedProgress / step.duration) * 100;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`rounded-xl border px-4 py-3 transition-all ${
                        isActive
                          ? "border-sky-500/70 bg-sky-500/10"
                          : isComplete
                          ? "border-emerald-500/70 bg-emerald-500/10"
                          : "border-border/60 bg-muted/30"
                      }`}
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm ${
                            isActive
                              ? "border-sky-500 bg-sky-500/15 text-sky-500"
                              : isComplete
                              ? "border-emerald-500 bg-emerald-500/15 text-emerald-500"
                              : "border-border/60 bg-muted text-muted-foreground"
                          }`}
                        >
                          {isActive ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : isComplete ? (
                            <Sparkles className="h-5 w-5" />
                          ) : (
                            <StepIcon className="h-5 w-5" />
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-medium leading-tight text-foreground">
                            {step.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{step.hint}</p>
                        </div>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className={`h-full rounded-full ${
                            isComplete
                              ? "bg-emerald-500"
                              : isActive
                              ? "bg-sky-500"
                              : "bg-muted-foreground/30"
                          }`}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${
                              isComplete
                                ? 100
                                : isActive
                                ? relativeProgress
                                : 0
                            }%`,
                          }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </section>

              <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Build log
                  </p>
                  <AnimatedList className="items-stretch gap-3">
                    {safeHistory.map((index) => {
                      const step = steps[index];
                      const StepIcon = step.icon;
                      return (
                        <div
                          key={step.id}
                          className="flex w-full items-start gap-3 rounded-md border border-border/50 bg-background/90 px-4 py-3 shadow-sm"
                        >
                          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <StepIcon className="h-4 w-4 text-sky-500" />
                          </span>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium text-foreground">{step.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {index < currentStep
                                ? "Completed"
                                : index === currentStep
                                ? "In progress"
                                : "Queued"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </AnimatedList>
                </div>
                <div className="flex h-full flex-col justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 p-5 text-sm text-muted-foreground">
                  <div>
                    <p className="text-xs uppercase tracking-wide">What happens next?</p>
                    <p className="mt-2 leading-relaxed">
                      Once the render finishes we will notify you inside the dashboard and send an email with the playback link. Feel free to explore other lessons while this wraps up.
                    </p>
                  </div>
                  <p className="text-xs italic text-muted-foreground/80">
                    Heads-up: keeping this tab open helps us keep your session warm so the export moves a little faster.
                  </p>
                </div>
              </section>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
