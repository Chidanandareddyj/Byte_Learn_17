import { NextRequest, NextResponse } from "next/server";

import {
  generateAudioForPrompt,
  getPromptByPublicId,
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

    let narration: string | undefined;

    try {
      const body = await request.json();
      if (typeof body?.narration === "string" && body.narration.trim()) {
        narration = body.narration.trim();
      }
    } catch (error) {
      // Ignore JSON parse errors and fall back to narration stored in the script record
      console.warn("No narration override provided for audio generation", error);
    }

    const audioResult = await generateAudioForPrompt(prompt, {
      narration,
    });

    return NextResponse.json({
      success: true,
      promptId: prompt.promptId,
      audioId: audioResult.audioRecord.id,
      audioUrl: audioResult.audioUrl,
      usedTestAudio: audioResult.usedTestAudio,
    });
  } catch (error) {
    console.error("Error generating audio:", error);
    return NextResponse.json(
      { error: "Failed to generate audio" },
      { status: 500 }
    );
  }
}
