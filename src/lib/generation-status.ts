export const GENERATION_STAGE_LABELS: Record<string, string> = {
  queued: "Waiting in queue",
  planning: "Planning the lesson",
  narrating: "Recording narration",
  coding: "Writing animations",
  checking: "Checking scenes",
  rendering: "Rendering video",
  done: "Finishing up",
};

export function generationStageLabel(stage: string | null | undefined): string {
  if (!stage) {
    return GENERATION_STAGE_LABELS.queued;
  }
  return GENERATION_STAGE_LABELS[stage] ?? GENERATION_STAGE_LABELS.queued;
}

export function isGenerationInProgress(status: string | null | undefined): boolean {
  return status === "QUEUED" || status === "PROCESSING";
}
