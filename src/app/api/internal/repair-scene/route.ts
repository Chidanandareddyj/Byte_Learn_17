import { NextRequest, NextResponse } from "next/server";

import {
  promptCursor,
  resumeCursorConversation,
  stripMarkdownFence,
} from "@/lib/generation/cursor";
import { buildSceneFixPrompt } from "@/lib/generation/prompts";

type RepairRequest = {
  coderAgentId?: string;
  sceneName?: string;
  scriptCode?: string;
  stderr?: string;
  audioDuration?: number;
};

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.VIDEO_WEBHOOK_SECRET?.trim();
  if (expectedSecret) {
    const suppliedSecret = request.headers.get("x-callback-secret")?.trim();
    if (suppliedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: RepairRequest;
  try {
    body = (await request.json()) as RepairRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (
    !body.coderAgentId ||
    !body.sceneName ||
    !body.scriptCode ||
    !body.stderr ||
    typeof body.audioDuration !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing scene repair fields" },
      { status: 400 }
    );
  }

  try {
    const fixPrompt = buildSceneFixPrompt({
      sceneName: body.sceneName,
      code: body.scriptCode,
      stderr: body.stderr,
      audioDuration: body.audioDuration,
    });
    let responseText: string;
    try {
      responseText = await resumeCursorConversation(body.coderAgentId, fixPrompt);
    } catch (resumeError) {
      // Serverless callbacks may land on another instance without the local
      // checkpoint. The full code and stderr make a safe one-shot repair possible.
      console.warn(`[REPAIR] Could not resume ${body.coderAgentId}; using one-shot`, resumeError);
      responseText = await promptCursor(fixPrompt, `ByteLearn repair ${body.sceneName}`);
    }
    const repairedCode = stripMarkdownFence(
      responseText
    );
    if (!repairedCode.includes(`class ${body.sceneName}`)) {
      throw new Error("Repair response did not contain the required scene class.");
    }
    return NextResponse.json({ scriptCode: repairedCode });
  } catch (error) {
    console.error(`[REPAIR] Failed to repair ${body.sceneName}`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}
