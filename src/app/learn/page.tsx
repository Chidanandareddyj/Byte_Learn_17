import { Suspense } from "react";
import { LearningPage } from "@/components/LearningPage";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <LoadingScreen
          label="opening your lesson…"
          heading="Opening your lesson"
          statusLabel="Finding your lesson"
        />
      }
    >
      <LearningPage />
    </Suspense>
  );
}
