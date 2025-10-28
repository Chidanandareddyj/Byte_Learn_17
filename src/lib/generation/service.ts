import { GoogleGenAI } from "@google/genai";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Audio as AudioModel,
  Mux as MuxModel,
  Prompt as PromptModel,
  Script as ScriptModel,
  User as UserModel,
  Video as VideoModel,
} from "generated/prisma/client";

import { prisma } from "@/lib/prisma";

import { scriptGenerationSchema, systemInstruction } from "./constants";
import { generateUniqueId, readableStreamToBuffer, retryWithBackoff } from "./utils";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const ENABLE_TTS = process.env.ENABLE_TTS === "true";
const DEFAULT_TEST_AUDIO_URL =
  process.env.TEST_AUDIO_URL ??
  "https://geruuvhlyduaoelpwqbj.supabase.co/storage/v1/object/public/audio/1761579733647-c21w24i.mp3";

let aiClient: GoogleGenAI | null = null;
let elevenLabsClient: ElevenLabsClient | null = null;
let supabaseClient: SupabaseClient | null = null;

function getGoogleClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }

  return aiClient;
}

function getElevenLabsClient(): ElevenLabsClient {
  if (!elevenLabsClient) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY environment variable is not configured.");
    }
    elevenLabsClient = new ElevenLabsClient({ apiKey });
  }

  return elevenLabsClient;
}

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      throw new Error("Supabase environment variables are not configured.");
    }

    supabaseClient = createClient(url, serviceKey);
  }

  return supabaseClient;
}

export type PromptCreationResult = {
  user: UserModel;
  prompt: PromptModel;
};

export type ScriptGenerationResult = {
  scriptRecord: ScriptModel;
  title: string;
  explanation: string;
  scenes: unknown[];
  fullManimScript: string;
  fullNarration: string;
};

export type AudioGenerationResult = {
  audioRecord: AudioModel;
  audioUrl: string;
  usedTestAudio: boolean;
};

export type VideoGenerationResult = {
  videoRecord: VideoModel;
  videoUrl: string;
  message: string;
};

export type MuxGenerationResult = {
  videoRecord: MuxModel;
  finalVideoUrl: string;
  message: string;
};

export async function createPromptForUser(
  promptText: string,
  clerkId?: string | null
): Promise<PromptCreationResult> {
  const clerkIdValue = clerkId ?? "unknown";

  const user = await prisma.user.upsert({
    where: { clerkId: clerkIdValue },
    update: {},
    create: { clerkId: clerkIdValue },
  });

  const prompt = await prisma.prompt.create({
    data: {
      promptId: generateUniqueId(),
      prompt: promptText,
      clerkId: clerkIdValue, // FIX: Associate prompt with the user's clerkId
    },
  });

  return { user, prompt };
}

export function getPromptByPublicId(promptId: string): Promise<PromptModel | null> {
  return prisma.prompt.findUnique({
    where: { promptId },
  });
}

export async function requirePromptByPublicId(promptId: string): Promise<PromptModel> {
  const prompt = await getPromptByPublicId(promptId);
  if (!prompt) {
    throw new Error(`Prompt not found for promptId: ${promptId}`);
  }

  return prompt;
}

export async function generateScriptForPrompt(prompt: PromptModel): Promise<ScriptGenerationResult> {
  const ai = getGoogleClient();

  const response = await retryWithBackoff(() =>
    ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Generate a video script for the topic: "${prompt.prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: scriptGenerationSchema,
      },
    })
  );

  const rawText = response.text?.trim();

  if (!rawText) {
    throw new Error("Empty response from AI");
  }

  let parsed: any;

  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    throw new Error(
      `Failed to parse AI response as JSON: ${(error as Error).message}`
    );
  }

  const scenes: unknown[] = Array.isArray(parsed.scenes) ? parsed.scenes : [];

  const fullManimScript = scenes
    .map((scene) => {
      const sceneNumber = (scene as { sceneNumber?: unknown }).sceneNumber ?? "?";
      const manimScript = (scene as { manimScript?: string }).manimScript ?? "";
      return `# Scene ${sceneNumber}\n${manimScript}`;
    })
    .join("\n\n");

  const fullNarration = scenes
    .map((scene) => {
      const sceneNumber = (scene as { sceneNumber?: unknown }).sceneNumber ?? "?";
      const narration = (scene as { narration?: string }).narration ?? "";
      return `[Scene ${sceneNumber}]\n${narration}`;
    })
    .join("\n\n");

  const scriptRecord = await prisma.script.create({
    data: {
      scriptId: generateUniqueId(),
      script: fullManimScript,
      explanation: parsed.explanation ?? "",
      narration: fullNarration,
      promptId: prompt.id,
    },
  });

  return {
    scriptRecord,
    title: parsed.title ?? "",
    explanation: parsed.explanation ?? "",
    scenes,
    fullManimScript,
    fullNarration,
  };
}

export interface GenerateAudioOptions {
  narration?: string;
  scriptRecord?: ScriptModel;
}

export async function generateAudioForPrompt(
  prompt: PromptModel,
  options: GenerateAudioOptions = {}
): Promise<AudioGenerationResult> {
  const scriptRecord =
    options.scriptRecord ??
    (await prisma.script.findFirst({
      where: { promptId: prompt.id },
      orderBy: { createdAt: "desc" },
    }));

  if (!scriptRecord) {
    throw new Error("Script not found for prompt");
  }

  const narration = options.narration ?? scriptRecord.narration;

  if (!narration) {
    throw new Error("Narration not available for audio generation");
  }

  let audioUrl: string;
  let usedTestAudio = false;

  if (ENABLE_TTS) {
    const elevenlabs = getElevenLabsClient();
    const supabase = getSupabaseClient();

    const audioStream = await elevenlabs.textToSpeech.convert(
      "JBFqnCBsd6RMkjVDRZzb",
      {
        text: narration,
        modelId: "eleven_multilingual_v2",
        outputFormat: "mp3_44100_128",
      }
    );

    const audioBuffer = await readableStreamToBuffer(audioStream);
    const audioFileName = `${scriptRecord.scriptId}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload(audioFileName, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("audio")
      .getPublicUrl(audioFileName);

    audioUrl = urlData.publicUrl;
  } else {
    audioUrl = DEFAULT_TEST_AUDIO_URL;
    usedTestAudio = true;
  }

  const audioRecord = await prisma.audio.create({
    data: {
      audioUrl,
      promptId: prompt.id,
    },
  });

  return { audioRecord, audioUrl, usedTestAudio };
}

export interface RenderVideoOptions {
  manimScript?: string;
  scriptRecord?: ScriptModel;
  quality?: "low" | "medium" | "high";
}

export async function renderVideoForPrompt(
  prompt: PromptModel,
  options: RenderVideoOptions = {}
): Promise<VideoGenerationResult> {
  const scriptRecord =
    options.scriptRecord ??
    (await prisma.script.findFirst({
      where: { promptId: prompt.id },
      orderBy: { createdAt: "desc" },
    }));

  if (!scriptRecord) {
    throw new Error("Script not found for prompt");
  }

  const manimScript = options.manimScript ?? scriptRecord.script;

  const response = await fetch(`${BACKEND_URL}/render-and-upload`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      script_code: manimScript,
      scene_name: "auto",
      quality: options.quality ?? "low",
    }),
  });

  const videoResponse = await response.json();

  if (!response.ok) {
    throw new Error(
      `Video generation failed: ${JSON.stringify(videoResponse)}`
    );
  }

  const videoRecord = await prisma.video.create({
    data: {
      videoUrl: videoResponse.video_url,
      promptId: prompt.id,
    },
  });

  return {
    videoRecord,
    videoUrl: videoResponse.video_url,
    message: videoResponse.message ?? "",
  };
}

export interface MuxOptions {
  audioUrl?: string;
  videoUrl?: string;
  outputName?: string;
  bucketName?: string;
}

export async function muxMediaForPrompt(
  prompt: PromptModel,
  options: MuxOptions = {}
): Promise<MuxGenerationResult> {
  const audioRecord =
    options.audioUrl
      ? null
      : await prisma.audio.findFirst({
          where: { promptId: prompt.id },
          orderBy: { createdAt: "desc" },
        });

  const videoRecordForMux =
    options.videoUrl
      ? null
      : await prisma.video.findFirst({
          where: { promptId: prompt.id },
          orderBy: { createdAt: "desc" },
        });

  const audioUrl = options.audioUrl ?? audioRecord?.audioUrl;
  const videoUrl = options.videoUrl ?? videoRecordForMux?.videoUrl;

  if (!audioUrl) {
    throw new Error("Audio not found for muxing");
  }

  if (!videoUrl) {
    throw new Error("Video not found for muxing");
  }

  const response = await fetch(`${BACKEND_URL}/mux-audio-video`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      video_url: videoUrl,
      audio_url: audioUrl,
      output_name: options.outputName ?? `final_${generateUniqueId()}`,
      bucket_name: options.bucketName ?? "muxvideos",
    }),
  });

  const muxResponse = await response.json();

  if (!response.ok) {
    throw new Error(`Muxing failed: ${JSON.stringify(muxResponse)}`);
  }

  const finalVideoUrl = muxResponse.combined_url ?? muxResponse.video_url;

  if (!finalVideoUrl) {
    throw new Error("Muxing response missing combined_url");
  }

  const videoRecord = await prisma.mux.create({
    data: {
      finalvideoUrl: finalVideoUrl,
      promptId: prompt.id,
    },
  });

  return {
    videoRecord,
    finalVideoUrl,
    message: muxResponse.message ?? "",
  };
}

export interface GenerationWorkflowResult {
  prompt: PromptModel;
  scriptResult: ScriptGenerationResult;
  audioResult: AudioGenerationResult;
  videoResult: VideoGenerationResult;
  muxResult: MuxGenerationResult;
}

export async function runGenerationWorkflow(args: {
  promptText: string;
  clerkId?: string | null;
}): Promise<GenerationWorkflowResult> {
  const { prompt } = await createPromptForUser(args.promptText, args.clerkId);

  const scriptResult = await generateScriptForPrompt(prompt);
  const audioResult = await generateAudioForPrompt(prompt, {
    narration: scriptResult.fullNarration,
    scriptRecord: scriptResult.scriptRecord,
  });
  const videoResult = await renderVideoForPrompt(prompt, {
    manimScript: scriptResult.fullManimScript,
    scriptRecord: scriptResult.scriptRecord,
  });
  const muxResult = await muxMediaForPrompt(prompt, {
    audioUrl: audioResult.audioUrl,
    videoUrl: videoResult.videoUrl,
    outputName: `final_${scriptResult.scriptRecord.scriptId}`,
  });

  return {
    prompt,
    scriptResult,
    audioResult,
    videoResult,
    muxResult,
  };
}
