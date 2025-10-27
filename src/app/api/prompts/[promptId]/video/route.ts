import { NextRequest, NextResponse } from "next/server";

import {
  getPromptByPublicId,
  renderVideoForPrompt,
} from "@/lib/generation/service";

const QUALITY_OPTIONS = new Set(["low", "medium", "high"]);

export async function POST(
  request: NextRequest,
  context: { params: { promptId: string } }
) {
  try {
    const promptId = context.params.promptId;

    const prompt = await getPromptByPublicId(promptId);

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt not found" },
        { status: 404 }
      );
    }

    let manimScript: string | undefined;
    let quality: "low" | "medium" | "high" | undefined;

    try {
      const body = await request.json();

      if (typeof body?.manimScript === "string" && body.manimScript.trim()) {
        manimScript = body.manimScript;
      }

      if (typeof body?.quality === "string") {
        const normalized = body.quality.toLowerCase();
        if (QUALITY_OPTIONS.has(normalized)) {
          quality = normalized as typeof quality;
        }
      }
    } catch (error) {
      console.warn("No overrides provided for video generation", error);
    }

    const videoResult = await renderVideoForPrompt(prompt, {
      manimScript,
      quality,
    });

    return NextResponse.json({
      success: true,
      promptId: prompt.promptId,
      videoId: videoResult.videoRecord.id,
      videoUrl: videoResult.videoUrl,
      message: videoResult.message,
    });
  } catch (error) {
    console.error("Error generating video:", error);
    return NextResponse.json(
      { error: "Failed to generate video" },
      { status: 500 }
    );
  }
}
