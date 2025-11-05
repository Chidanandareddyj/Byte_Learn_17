import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

type WebhookPayload = {
  jobId?: string;
  promptId?: string;
  videoRecordId?: string;
  muxRecordId?: string;
  status?: string;
  videoUrl?: string | null;
  finalVideoUrl?: string | null;
  error?: unknown;
  message?: unknown;
};

function normalizeStatus(value: unknown): JobStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "QUEUED":
    case "PROCESSING":
    case "COMPLETED":
    case "FAILED":
  return normalized as JobStatus;
    default:
      return null;
  }
}

function coerceMessage(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn("Failed to stringify message payload", error);
    return String(value);
  }
}

export async function POST(request: NextRequest) {
  const sharedSecret = process.env.VIDEO_WEBHOOK_SECRET?.trim();

  if (sharedSecret) {
    const provided = request.headers.get("x-callback-secret")?.trim();
    if (!provided || provided !== sharedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = (await request.json()) as WebhookPayload;
  } catch (error) {
    console.error("Invalid webhook payload", error);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const status = normalizeStatus(payload.status);
  if (!status) {
    return NextResponse.json({ error: "Invalid or missing status" }, { status: 400 });
  }

  const jobId = typeof payload.jobId === "string" ? payload.jobId : undefined;
  const errorMessage =
    status === "FAILED"
      ? coerceMessage(payload.error) ?? coerceMessage(payload.message) ?? "Video rendering failed"
      : null;

  const operations: Prisma.PrismaPromise<unknown>[] = [];

  if (payload.videoRecordId) {
    const videoData: Record<string, unknown> = {
      status,
      jobId,
    };

    if (status === "COMPLETED" && typeof payload.videoUrl === "string") {
      videoData.videoUrl = payload.videoUrl;
      videoData.errorMessage = null;
    }

    if (status === "FAILED") {
      videoData.errorMessage = errorMessage;
    }

    operations.push(
      prisma.video.update({
        where: { id: payload.videoRecordId },
        data: videoData as any,
      })
    );
  }

  if (payload.muxRecordId) {
    const muxData: Record<string, unknown> = {
      status,
      jobId,
    };

    if (status === "COMPLETED" && typeof payload.finalVideoUrl === "string") {
      muxData.finalvideoUrl = payload.finalVideoUrl;
      muxData.errorMessage = null;
    }

    if (status === "FAILED") {
      muxData.errorMessage = errorMessage;
    }

    operations.push(
      prisma.mux.update({
        where: { id: payload.muxRecordId },
        data: muxData as any,
      })
    );
  }

  if (payload.promptId) {
    operations.push(
      prisma.prompt.update({
        where: { promptId: payload.promptId },
        data: {
          updatedAt: new Date(),
        },
      })
    );
  }

  if (operations.length === 0) {
    return NextResponse.json(
      { error: "No matching record references in payload" },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(operations);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Referenced record not found" }, { status: 404 });
    }

    console.error("Failed to persist webhook update", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
