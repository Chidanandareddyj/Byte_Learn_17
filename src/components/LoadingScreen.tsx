"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { BookOpen, PenTool, Play, CheckCircle, Sparkles } from "lucide-react";

interface LoadingScreenProps {
  prompt?: string;
}

export function LoadingScreen({ prompt }: LoadingScreenProps) {
  const steps = useMemo(
    () => [
      {
        id: "analyze",
        icon: BookOpen,
        label: "Analyzing concept",
        hint: "Breaking down your learning prompt into key ideas",
        duration: 25,
      },
      {
        id: "design",
        icon: PenTool,
        label: "Designing visuals",
        hint: "Creating mathematical animations and diagrams",
        duration: 35,
      },
      {
        id: "animate",
        icon: Play,
        label: "Building animation",
        hint: "Rendering smooth transitions and explanations",
        duration: 30,
      },
      {
        id: "finalize",
        icon: CheckCircle,
        label: "Finalizing lesson",
        hint: "Adding narration and polishing the presentation",
        duration: 10,
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
        return Math.min(prev + 0.4, 100);
      });
    }, 800);

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

  const CurrentIcon = steps[currentStep]?.icon ?? BookOpen;
  const displayedProgress = Math.round(progress);
  const safeHistory = history.filter((index) => steps[index]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center notebook-bg">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <Card className="overflow-hidden border-2 shadow-2xl">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CurrentIcon className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-serif">
                  Crafting your{" "}
                  <AnimatedGradientText
                    className="text-3xl font-serif"
                    colorFrom="#a3d9a1"
                    colorTo="#3b8c5a"
                    speed={2}
                  >
                    visual lesson
                  </AnimatedGradientText>
                </CardTitle>
                <CardDescription className="text-lg max-w-2xl mx-auto">
                  Transforming your prompt into an engaging mathematical animation with step-by-step explanations
                </CardDescription>
              </div>
              {prompt && (
                <div className="max-w-2xl mx-auto rounded-lg border bg-muted/50 p-4">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground block mb-2">
                    Learning prompt
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/90">{prompt}</p>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {steps[currentStep]?.label ?? "Preparing"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {steps[currentStep]?.hint}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {displayedProgress}%
                  </span>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                      transition={{ delay: index * 0.1 }}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-lg"
                          : isComplete
                          ? "border-secondary bg-secondary/5"
                          : "border-muted bg-card/50"
                      }`}
                    >
                      <div className="text-center space-y-3">
                        <div
                          className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : isComplete
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <StepIcon className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-tight">
                            {step.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {step.hint}
                          </p>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                          <motion.div
                            className={`h-full rounded-full transition-colors ${
                              isComplete
                                ? "bg-secondary"
                                : isActive
                                ? "bg-primary"
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
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3 rounded-lg border bg-muted/30 p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Progress log
                  </p>
                  <div className="space-y-3">
                    {safeHistory.map((index) => {
                      const step = steps[index];
                      const StepIcon = step.icon;
                      return (
                        <div
                          key={step.id}
                          className="flex items-start gap-3 rounded-md border bg-background/80 px-4 py-3 shadow-sm"
                        >
                          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <StepIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium text-sm">{step.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {index < currentStep
                                ? "✓ Completed"
                                : index === currentStep
                                ? "⟳ In progress"
                                : "○ Queued"}
                            </p>
                          </div>
                          {index < currentStep && (
                            <Sparkles className="h-4 w-4 text-secondary mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-4 rounded-lg border bg-muted/30 p-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      What&apos;s happening?
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      We&apos;re using Manim to create beautiful mathematical animations that make complex concepts easy to understand. Your lesson will be ready for interactive learning soon.
                    </p>
                  </div>
                  <p className="text-xs italic text-muted-foreground/80">
                    💡 Pro tip: Keep this tab open for the fastest processing. We&apos;ll notify you when your visual lesson is complete!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
