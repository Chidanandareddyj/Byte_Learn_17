import { NextRequest, NextResponse } from "next/server";

import {
  getPromptByPublicId,
  muxMediaForPrompt,
} from "@/lib/generation/service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await context.params;

    const prompt = await getPromptByPublicId(promptId);

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt not found" },
        { status: 404 }
      );
    }

    let audioUrl: string | undefined;
    let videoUrl: string | undefined;
    let outputName: string | undefined;
    let bucketName: string | undefined;

    try {
      const body = await request.json();

      if (typeof body?.audioUrl === "string" && body.audioUrl.trim()) {
        audioUrl = body.audioUrl.trim();
      }

      if (typeof body?.videoUrl === "string" && body.videoUrl.trim()) {
        videoUrl = body.videoUrl.trim();
      }

      if (typeof body?.outputName === "string" && body.outputName.trim()) {
        outputName = body.outputName.trim();
      }

      if (typeof body?.bucketName === "string" && body.bucketName.trim()) {
        bucketName = body.bucketName.trim();
      }
    } catch (error) {
      console.warn("No overrides provided for muxing", error);
    }

    const muxResult = await muxMediaForPrompt(prompt, {
      audioUrl,
      videoUrl,
      outputName,
      bucketName,
    });

    return NextResponse.json({
      success: true,
      promptId: prompt.promptId,
      muxVideoId: muxResult.videoRecord.id,
      finalVideoUrl: muxResult.finalVideoUrl,
      message: muxResult.message,
    });
  } catch (error) {
    console.error("Error muxing media:", error);
    return NextResponse.json(
      { error: "Failed to mux audio and video" },
      { status: 500 }
    );
  }
}
