import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { runGenerationWorkflow } from "@/lib/generation/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt: string | undefined = body?.prompt;
    const language: string = body?.language ?? "english";

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const clerkUser = await currentUser();

    const workflow = await runGenerationWorkflow({
      promptText: prompt.trim(),
      language: language,
      clerkId: clerkUser?.id ?? null,
    });

    return NextResponse.json({
      success: true,
      promptId: workflow.prompt.promptId,
      promptRecordId: workflow.prompt.id,
      scriptId: workflow.scriptResult.scriptRecord.scriptId,
      audioId: workflow.audioResult.audioRecord.id,
      videoId: workflow.videoResult.videoRecord.id,
      muxVideoId: workflow.muxResult.videoRecord.id,
      audioUrl: workflow.audioResult.audioUrl,
      usedTestAudio: workflow.audioResult.usedTestAudio,
      videoUrl: workflow.videoResult.videoUrl,
      videoMessage: workflow.videoResult.message,
      finalVideoUrl: workflow.muxResult.finalVideoUrl,
      muxMessage: workflow.muxResult.message,
      result: {
        title: workflow.scriptResult.title,
        explanation: workflow.scriptResult.explanation,
        scenes: workflow.scriptResult.scenes,
        fullManimScript: workflow.scriptResult.fullManimScript,
        fullNarration: workflow.scriptResult.fullNarration,
      },
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
