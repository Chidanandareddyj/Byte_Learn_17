import { GoogleGenAI, Modality } from "@google/genai";
// import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Audio as AudioModel,
  Mux as MuxModel,
  Prompt as PromptModel,
  Script as ScriptModel,
  User as UserModel,
  Video as VideoModel,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { scriptGenerationSchema, systemInstruction } from "./constants";
import { generateUniqueId, retryWithBackoff, createWavFile } from "./utils";

// Type for AI response
type AIScriptResponse = {
  title?: string;
  explanation?: string;
  scenes?: unknown[];
};

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const ENABLE_TTS = process.env.ENABLE_TTS === "true";
const DEFAULT_TEST_AUDIO_URL =
  process.env.TEST_AUDIO_URL ??
  "https://geruuvhlyduaoelpwqbj.supabase.co/storage/v1/object/public/audio/1761579733647-c21w24i.mp3";

let aiClient: GoogleGenAI | null = null;
// let elevenLabsClient: ElevenLabsClient | null = null;
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

// function getElevenLabsClient(): ElevenLabsClient {
//   if (!elevenLabsClient) {
//     const apiKey = process.env.ELEVENLABS_API_KEY;
//     if (!apiKey) {
//       throw new Error("ELEVENLABS_API_KEY environment variable is not configured.");
//     }
//     elevenLabsClient = new ElevenLabsClient({ apiKey });
//   }

//   return elevenLabsClient;
// }

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

function resolveWebhookUrl(): string {
  const explicit = process.env.VIDEO_WEBHOOK_URL;
  if (explicit && explicit.trim()) {
    return explicit.trim();
  }

  const base = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!base || !base.trim()) {
    throw new Error(
      "VIDEO_WEBHOOK_URL or APP_URL (or NEXT_PUBLIC_APP_URL) must be configured for background video callbacks."
    );
  }

  const normalizedBase = base.trim().replace(/\/$/, "");
  return `${normalizedBase}/api/webhooks/video-generation`;
}

function resolveMuxBucket(): string {
  return process.env.MUX_BUCKET_NAME?.trim() || "muxvideos";
}

function resolveAudioSpeed(): number {
  const raw = process.env.MUX_AUDIO_SPEED?.trim();
  if (!raw) {
    return 1.0;
  }

  const speed = Number(raw);
  return Number.isFinite(speed) && speed > 0 ? speed : 1.0;
}

function safeParseJSON<T>(raw: string): T | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("Failed to parse JSON payload", error);
    return null;
  }
}

type GenerationStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

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

export type VideoJobQueueResult = {
  jobId: string;
  videoRecord: VideoModel;
  muxRecord: MuxModel;
  status: GenerationStatus;
};

export async function createPromptForUser(
  promptText: string,
  language: string = "english",
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
      language: language,
      clerkId: clerkIdValue, // FIX: Associate prompt with the user's clerkId
    },
  });

  console.log(`[PROMPT] Created prompt for user with language: ${language}`);
  return { user, prompt };
}

export async function generateSpeech(text: string): Promise<{ data: string; mimeType: string }> {
  const ai = getGoogleClient();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Using a neutral voice
        },
      },
    },
  });

  const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  const base64Audio = inlineData?.data;
  const mimeType = inlineData?.mimeType ?? "audio/wav";
  
  if (!base64Audio) {
    throw new Error("Failed to generate audio from the API.");
  }
  
  return { data: base64Audio, mimeType };
}

// Language mapping for better prompts
const LANGUAGE_NAMES: Record<string, string> = {
  english: "English",
  hindi: "Hindi",
  telugu: "Telugu",
  tamil: "Tamil",
  kannada: "Kannada",
  malayalam: "Malayalam",
  bengali: "Bengali",
  marathi: "Marathi",
  gujarati: "Gujarati",
};

export async function translateNarration(
  narration: string,
  targetLanguage: string
): Promise<string> {
  // If target language is English, no translation needed
  if (targetLanguage === "english") {
    return narration;
  }

  const ai = getGoogleClient();
  const languageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

  const translationPrompt = `Translate the following educational narration to ${languageName}.

IMPORTANT INSTRUCTIONS:
- Use a casual, conversational tone as if explaining to a friend
- DO NOT use formal or bookish language
- Use everyday words and expressions that people commonly use when talking
- Make it sound natural and engaging, like how a teacher would explain in a friendly way
- Keep the meaning accurate but the style informal and approachable

Original narration in English:
${narration}

Provide ONLY the translated narration in ${languageName}, without any additional text or explanations.`;

  const response = await retryWithBackoff(() =>
    ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: translationPrompt,
    })
  );

  const translatedText = response.text?.trim();

  if (!translatedText) {
    throw new Error("Failed to translate narration");
  }

  console.log(`[TRANSLATION] Completed translation to ${targetLanguage}`);
  return translatedText;
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

  let parsed: AIScriptResponse;

  try {
    parsed = JSON.parse(rawText) as AIScriptResponse;
  } catch (error) {
    throw new Error(
      `Failed to parse AI response as JSON: ${(error as Error).message}`
    );
  }

  const scenes: unknown[] = Array.isArray(parsed.scenes) ? parsed.scenes : [];

  const fullManimScript = scenes
    .map((scene) => {
      const manimScript = (scene as { manimScript?: string }).manimScript ?? "";
      return manimScript;
    })
    .join("\n\n");

  const fullNarration = scenes
    .map((scene) => {
      const narration = (scene as { narration?: string }).narration ?? "";
      return narration;
    })
    .join(" ");

  const scriptRecord = await prisma.script.create({
    data: {
      scriptId: generateUniqueId(),
      script: fullManimScript,
      explanation: parsed.explanation ?? "",
      narration: fullNarration,
      promptId: prompt.id,
    },
  });

  console.log(`[SCRIPT] Generated script with ${scenes.length} scenes`);
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
  language?: string;
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

  let narration = options.narration ?? scriptRecord.narration;

  if (!narration) {
    throw new Error("Narration not available for audio generation");
  }

  // Get the language from options or from the prompt record
  const language = options.language ?? prompt.language ?? "english";

  // Translate narration if not in English
  if (language !== "english") {
    console.log(`[TTS] Translating narration from English to ${language}`);
    narration = await translateNarration(narration, language);
    console.log(`[TTS] Translation completed`);
  }

  let audioUrl: string;
  let usedTestAudio = false;

  if (ENABLE_TTS) {
    // Comment out Eleven Labs implementation
    // const elevenlabs = getElevenLabsClient();
    const supabase = getSupabaseClient();

    // Use Gemini TTS instead
    const { data: base64Audio, mimeType } = await generateSpeech(narration);
    
    console.log(`[TTS] Received audio with mimeType: ${mimeType}`);
    
    // Convert base64 to buffer
    let audioBuffer: Buffer = Buffer.from(base64Audio, 'base64');
    
    // Check if the audio data has a WAV header (starts with "RIFF")
    const hasWavHeader = audioBuffer.length >= 4 && 
                        audioBuffer.toString('ascii', 0, 4) === 'RIFF';
    
    if (!hasWavHeader) {
      console.log('[TTS] No WAV header detected, adding WAV header to PCM data');
      // If no header, assume it's raw PCM and add WAV header
      // Gemini TTS typically outputs 24kHz, mono, 16-bit PCM
      audioBuffer = createWavFile(audioBuffer, 24000, 1, 16);
    } else {
      console.log('[TTS] WAV header detected in audio data');
    }
    
    // Gemini TTS returns audio/wav format, so use .wav extension
    // Determine file extension based on mime type
    let fileExtension = 'wav';  // Default to wav for Gemini TTS
    let contentType = mimeType;
    
    if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
      fileExtension = 'mp3';
    } else if (mimeType.includes('wav') || mimeType.includes('wave')) {
      fileExtension = 'wav';
      contentType = 'audio/wav';
    } else {
      // For unknown types, default to wav
      console.warn(`[TTS] Unknown mimeType: ${mimeType}, defaulting to wav`);
      contentType = 'audio/wav';
    }
    
    const audioFileName = `${scriptRecord.scriptId}.${fileExtension}`;
    console.log(`[TTS] Uploading audio as: ${audioFileName} with contentType: ${contentType}, size: ${audioBuffer.length} bytes`);

    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload(audioFileName, audioBuffer, {
        contentType: contentType,
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

  console.log(`[AUDIO] Generated audio ${usedTestAudio ? '(test audio)' : '(TTS generated)'}`);
  return { audioRecord, audioUrl, usedTestAudio };
}

export interface EnqueueVideoJobOptions {
  prompt: PromptModel;
  script: ScriptGenerationResult;
  audioUrl: string;
  language: string;
  quality?: "low" | "medium" | "high";
  audioSpeed?: number;
}

type AsyncRenderResponse = {
  job_id?: string;
  jobId?: string;
  status?: string;
  detail?: unknown;
  message?: string;
};

export async function enqueueVideoProcessingJob(
  options: EnqueueVideoJobOptions
): Promise<VideoJobQueueResult> {
  const { prompt, script, audioUrl } = options;

  const [videoRecord, muxRecord] = await prisma.$transaction([
    prisma.video.create({
      data: {
        promptId: prompt.id,
        status: "QUEUED",
      },
    }),
    prisma.mux.create({
      data: {
        promptId: prompt.id,
        status: "QUEUED",
      },
    }),
  ]);

  const callbackUrl = resolveWebhookUrl();
  const callbackSecret = process.env.VIDEO_WEBHOOK_SECRET?.trim();
  const bucketName = resolveMuxBucket();
  const audioSpeed = options.audioSpeed ?? resolveAudioSpeed();

  const payload = {
    script_code: script.fullManimScript,
    scene_name: "auto",
    quality: options.quality ?? "low",
    prompt_id: prompt.promptId,
    prompt_record_id: prompt.id,
    script_id: script.scriptRecord.scriptId,
    video_record_id: videoRecord.id,
    mux_record_id: muxRecord.id,
    audio_url: audioUrl,
    output_name: `final_${script.scriptRecord.scriptId}`,
    bucket_name: bucketName,
    audio_speed: audioSpeed,
    language: options.language,
    callback_url: callbackUrl,
    callback_secret: callbackSecret,
  };

  try {
    const response = await fetch(`${BACKEND_URL}/render-and-upload-async`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const rawBody = await response.text();
    const parsedBody = safeParseJSON<AsyncRenderResponse>(rawBody);

    if (!response.ok) {
      const detailMessage =
        (parsedBody?.detail && typeof parsedBody.detail === "string"
          ? parsedBody.detail
          : null) ?? rawBody ?? "Failed to enqueue render job";

      await prisma.$transaction([
        prisma.video.update({
          where: { id: videoRecord.id },
          data: {
            status: "FAILED",
            errorMessage: detailMessage,
          },
        }),
        prisma.mux.update({
          where: { id: muxRecord.id },
          data: {
            status: "FAILED",
            errorMessage: detailMessage,
          },
        }),
      ]);

      throw new Error(`Failed to enqueue background render: ${detailMessage}`);
    }

    const resolvedJobId =
      (parsedBody?.job_id && typeof parsedBody.job_id === "string"
        ? parsedBody.job_id
        : undefined) ??
      (parsedBody?.jobId && typeof parsedBody.jobId === "string"
        ? parsedBody.jobId
        : undefined) ??
      generateUniqueId();

    const [updatedVideo, updatedMux] = await prisma.$transaction([
      prisma.video.update({
        where: { id: videoRecord.id },
        data: {
          status: "PROCESSING",
          jobId: resolvedJobId,
          errorMessage: null,
        },
      }),
      prisma.mux.update({
        where: { id: muxRecord.id },
        data: {
          status: "PROCESSING",
          jobId: resolvedJobId,
          errorMessage: null,
        },
      }),
    ]);

    console.log(`[QUEUE] Render job ${resolvedJobId} queued for prompt ${prompt.promptId}`);

    return {
      jobId: resolvedJobId,
      videoRecord: updatedVideo,
      muxRecord: updatedMux,
      status: "PROCESSING" as GenerationStatus,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await prisma.$transaction([
      prisma.video.update({
        where: { id: videoRecord.id },
        data: {
          status: "FAILED",
          errorMessage: message,
        },
      }),
      prisma.mux.update({
        where: { id: muxRecord.id },
        data: {
          status: "FAILED",
          errorMessage: message,
        },
      }),
    ]).catch((updateError) => {
      console.error("Failed to record queue failure", updateError);
    });

    throw error instanceof Error
      ? error
      : new Error("Unknown error while enqueueing render job");
  }
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
      status: "COMPLETED",
      errorMessage: null,
    },
  });

  console.log(`[VIDEO] Rendered video with ${videoResponse.scenes_rendered} scenes`);
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
  audioSpeed?: number;
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
      audio_speed: options.audioSpeed ?? 1.0, // Keep audio at normal speed to match longer video
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
      status: "COMPLETED",
      errorMessage: null,
    },
  });

  console.log(`[MUX] Completed audio-video muxing`);
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
  job: VideoJobQueueResult;
}

export async function runGenerationWorkflow(args: {
  promptText: string;
  language?: string;
  clerkId?: string | null;
}): Promise<GenerationWorkflowResult> {
  const language = args.language ?? "english";
  const { prompt } = await createPromptForUser(args.promptText, language, args.clerkId);

  const scriptResult = await generateScriptForPrompt(prompt);
  const audioResult = await generateAudioForPrompt(prompt, {
    narration: scriptResult.fullNarration,
    scriptRecord: scriptResult.scriptRecord,
    language: language,
  });
  const job = await enqueueVideoProcessingJob({
    prompt,
    script: scriptResult,
    audioUrl: audioResult.audioUrl,
    language,
  });

  console.log(`[WORKFLOW] Generation workflow queued under job ${job.jobId}`);
  return {
    prompt,
    scriptResult,
    audioResult,
    job,
  };
}
