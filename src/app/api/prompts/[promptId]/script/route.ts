import { NextRequest, NextResponse } from "next/server";

import {
  generateScriptForPrompt,
  getPromptByPublicId,
} from "@/lib/generation/service";

export async function POST(
  _request: NextRequest,
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

    const scriptResult = await generateScriptForPrompt(prompt);

    return NextResponse.json({
      success: true,
      promptId: prompt.promptId,
      scriptId: scriptResult.scriptRecord.scriptId,
      result: {
        title: scriptResult.title,
        explanation: scriptResult.explanation,
        scenes: scriptResult.scenes,
        fullManimScript: scriptResult.fullManimScript,
        fullNarration: scriptResult.fullNarration,
      },
    });
  } catch (error) {
    console.error("Error generating script:", error);
    return NextResponse.json(
      { error: "Failed to generate script" },
      { status: 500 }
    );
  }
}
