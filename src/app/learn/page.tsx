import { Suspense } from "react";
import { LearningPage } from "@/components/LearningPage";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function LearnPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LearningPage />
    </Suspense>
  );
}


