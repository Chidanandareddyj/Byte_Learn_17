// Gemini and GitHub Models integrations are retained below for rollback.
// import { GoogleGenAI, Modality } from "@google/genai";
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

import {
  promptCursor,
  resumeCursorConversation,
  startCursorConversation,
  stripMarkdownFence,
} from "./cursor";
import {
  buildPlannerPrompt,
  buildSceneCoderPrompt,
  buildTextViolationFixPrompt,
  findNarrationTextViolations,
  type GeneratedScene,
  type Storyboard,
  type StoryboardScene,
} from "./prompts";
import { createWavFile, generateUniqueId } from "./utils";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const ENABLE_TTS = process.env.ENABLE_TTS === "true";
const DEFAULT_DEEPGRAM_VOICE = "aura-2-thalia-en";
const DEFAULT_TEST_AUDIO_URL =
  process.env.TEST_AUDIO_URL ??
  "https://geruuvhlyduaoelpwqbj.supabase.co/storage/v1/object/public/audio/1761579733647-c21w24i.mp3";

// let aiClient: GoogleGenAI | null = null;
// let elevenLabsClient: ElevenLabsClient | null = null;
let supabaseClient: SupabaseClient | null = null;

/*
 * Previous GitHub Models integration (disabled in favor of Cursor SDK).
 *
type GitHubModelsResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function getGitHubToken(): string {
  const token =
    process.env.GITHUB_TOKEN?.trim() ||
    process.env.GITHUB_ACCESS_TOKEN?.trim();

  if (!token) {
    throw new Error(
      "GITHUB_TOKEN (or GITHUB_ACCESS_TOKEN) is not configured. The token needs Models: read permission."
    );
  }

  return token;
}

async function generateWithGitHubModels(options: {
  messages: Array<{ role: "system" | "user"; content: string }>;
  maxTokens: number;
  responseFormat?: Record<string, unknown>;
}): Promise<string> {
  const model =
    process.env.GITHUB_MODELS_MODEL?.trim() || DEFAULT_GITHUB_MODEL;
  const usesReasoningParameters =
    model.startsWith("openai/o") || model.startsWith("openai/gpt-5");

  const response = await fetch(GITHUB_MODELS_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${getGitHubToken()}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version":
        process.env.GITHUB_API_VERSION?.trim() || "2022-11-28",
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      ...(usesReasoningParameters
        ? { max_completion_tokens: options.maxTokens }
        : { max_tokens: options.maxTokens, temperature: 0.2 }),
      ...(options.responseFormat
        ? { response_format: options.responseFormat }
        : {}),
    }),
  });

  const rawBody = await response.text();
  const payload = safeParseJSON<GitHubModelsResponse>(rawBody);

  if (!response.ok) {
    const error = new Error(
      `GitHub Models request failed (${response.status}): ${
        payload?.error?.message || rawBody || response.statusText
      }`
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("GitHub Models returned an empty response.");
  }

  return content;
}
*/

/*
 * Previous Gemini client initialization is kept disabled while GitHub Models
 * is the active LLM provider.
 *
 * function getGoogleClient(): GoogleGenAI {
 *   if (!aiClient) {
 *     const apiKey = process.env.GEMINI_API_KEY;
 *     if (!apiKey) {
 *       throw new Error("GEMINI_API_KEY environment variable is not configured.");
 *     }
 *     aiClient = new GoogleGenAI({ apiKey });
 *   }
 *
 *   return aiClient;
 * }
 */

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

function resolveRepairUrl(): string {
  const base = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!base?.trim()) {
    throw new Error("APP_URL (or NEXT_PUBLIC_APP_URL) is required for scene repair callbacks.");
  }
  return `${base.trim().replace(/\/$/, "")}/api/internal/repair-scene`;
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
  scenes: GeneratedScene[];
  fullManimScript: string;
  fullNarration: string;
  audioResult: AudioGenerationResult;
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

function splitTextForDeepgram(text: string, maxCharacters = 1_900): string[] {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return [];
  }

  const sentences =
    normalized.match(/[^.!?]+(?:[.!?]+["')\]]*|$)/g) ?? [normalized];
  const chunks: string[] = [];
  let current = "";

  const appendPiece = (piece: string) => {
    const candidate = current ? `${current} ${piece}` : piece;
    if (candidate.length <= maxCharacters) {
      current = candidate;
      return;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    if (piece.length <= maxCharacters) {
      current = piece;
      return;
    }

    const words = piece.split(/\s+/);
    for (const word of words) {
      if (word.length > maxCharacters) {
        if (current) {
          chunks.push(current);
          current = "";
        }
        for (let index = 0; index < word.length; index += maxCharacters) {
          chunks.push(word.slice(index, index + maxCharacters));
        }
        continue;
      }

      const wordCandidate = current ? `${current} ${word}` : word;
      if (wordCandidate.length > maxCharacters) {
        chunks.push(current);
        current = word;
      } else {
        current = wordCandidate;
      }
    }
  };

  for (const sentence of sentences) {
    appendPiece(sentence.trim());
  }
  if (current) {
    chunks.push(current);
  }

  return chunks;
}

export async function generateSpeech(
  text: string
): Promise<{ data: Buffer; mimeType: string }> {
  const apiKey = process.env.DEEPGRAM_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY environment variable is not configured.");
  }

  const voice =
    process.env.DEEPGRAM_TTS_MODEL?.trim() || DEFAULT_DEEPGRAM_VOICE;
  const query = new URLSearchParams({
    model: voice,
    encoding: "linear16",
    container: "none",
    sample_rate: "24000",
  });
  const chunks = splitTextForDeepgram(text);
  if (chunks.length === 0) {
    throw new Error("Cannot generate speech from empty text.");
  }

  console.log(
    `[TTS] Splitting ${text.length} characters into ${chunks.length} Deepgram request(s)`
  );

  const pcmBuffers: Buffer[] = [];
  for (const [index, chunk] of chunks.entries()) {
    const response = await fetch(
      `https://api.deepgram.com/v1/speak?${query.toString()}`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: chunk }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Deepgram TTS request ${index + 1}/${chunks.length} failed (${
          response.status
        }): ${detail || response.statusText}`
      );
    }

    const pcmData = Buffer.from(await response.arrayBuffer());
    if (pcmData.length === 0) {
      throw new Error(
        `Deepgram TTS returned empty audio for chunk ${index + 1}/${
          chunks.length
        }.`
      );
    }
    pcmBuffers.push(pcmData);
  }

  return {
    data: createWavFile(Buffer.concat(pcmBuffers), 24_000, 1, 16),
    mimeType: "audio/wav",
  };
}

/*
 * Previous Gemini TTS implementation (disabled):
 *
 * export async function generateSpeech(
 *   text: string
 * ): Promise<{ data: string; mimeType: string }> {
 *   const ai = getGoogleClient();
 *
 *   const response = await ai.models.generateContent({
 *     model: "gemini-2.5-flash-preview-tts",
 *     contents: [{ parts: [{ text: text }] }],
 *     config: {
 *       responseModalities: [Modality.AUDIO],
 *       speechConfig: {
 *         voiceConfig: {
 *           prebuiltVoiceConfig: { voiceName: "Kore" },
 *         },
 *       },
 *     },
 *   });
 *
 *   const inlineData =
 *     response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
 *   const base64Audio = inlineData?.data;
 *   const mimeType = inlineData?.mimeType ?? "audio/wav";
 *
 *   if (!base64Audio) {
 *     throw new Error("Failed to generate audio from the API.");
 *   }
 *
 *   return { data: base64Audio, mimeType };
 * }
 */

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

  /*
   * Previous Gemini translation implementation (disabled):
   *
   * const ai = getGoogleClient();
   * const response = await retryWithBackoff(() =>
   *   ai.models.generateContent({
   *     model: "gemini-2.0-flash",
   *     contents: translationPrompt,
   *   })
   * );
   * const translatedText = response.text?.trim();
   */

  /*
   * Previous GitHub Models translation call (disabled):
   * const translatedText = await retryWithBackoff(() =>
   *   generateWithGitHubModels({
   *     messages: [{ role: "user", content: translationPrompt }],
   *     maxTokens: 16_000,
   *   })
   * );
   */
  const translatedText = await promptCursor(
    translationPrompt,
    `ByteLearn ${languageName} translation`
  );

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

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await mapper(values[index], index);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, concurrency), values.length) },
      () => worker()
    )
  );
  return results;
}

function parseStoryboard(rawText: string): Storyboard {
  let value: unknown;
  try {
    value = JSON.parse(stripMarkdownFence(rawText));
  } catch (error) {
    throw new Error(`Cursor planner returned invalid JSON: ${(error as Error).message}`);
  }

  const candidate = value as Partial<Storyboard>;
  const rawScenes = Array.isArray(candidate.scenes) ? candidate.scenes : [];
  if (rawScenes.length < 4) {
    throw new Error("Cursor planner returned fewer than four usable scenes.");
  }

  const scenes: StoryboardScene[] = rawScenes.slice(0, 10).map((scene, index) => {
    const item = scene as Partial<StoryboardScene>;
    if (!item.narration?.trim() || !item.visualSpec?.trim()) {
      throw new Error(`Storyboard scene ${index + 1} is missing narration or visual direction.`);
    }
    return {
      sceneNumber: index + 1,
      purpose: item.purpose?.trim() || `Learning beat ${index + 1}`,
      visualSpec: item.visualSpec.trim(),
      narration: item.narration.trim(),
    };
  });

  return {
    title: candidate.title?.trim() || "ByteLearn visual lesson",
    explanation: candidate.explanation?.trim() || "",
    styleContract: {
      background: candidate.styleContract?.background || "#0E1116",
      primary: candidate.styleContract?.primary || "#58C4DD",
      secondary: candidate.styleContract?.secondary || "#83C167",
      accent: candidate.styleContract?.accent || "#FFFF00",
      visualMotif:
        candidate.styleContract?.visualMotif ||
        "A single visual model that gains structure scene by scene.",
    },
    scenes,
  };
}

async function uploadAudio(
  fileName: string,
  buffer: Buffer,
  contentType = "audio/wav"
): Promise<string> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from("audio").upload(fileName, buffer, {
    contentType,
    upsert: true,
  });
  if (error) {
    throw new Error(`Failed to upload ${fileName}: ${error.message}`);
  }
  return supabase.storage.from("audio").getPublicUrl(fileName).data.publicUrl;
}

type TimedSceneAudio = {
  scene: StoryboardScene;
  audioUrl: string;
  audioDuration: number;
  pcm: Buffer | null;
};

async function generateTimedSceneAudio(
  storyboard: Storyboard,
  scriptId: string,
  language: string
): Promise<{ scenes: TimedSceneAudio[]; aggregateUrl: string; usedTestAudio: boolean }> {
  if (language !== "english") {
    throw new Error(
      `Deepgram Aura TTS does not currently support the selected "${language}" narration language.`
    );
  }

  if (!ENABLE_TTS) {
    return {
      scenes: storyboard.scenes.map((scene) => ({
        scene,
        audioUrl: DEFAULT_TEST_AUDIO_URL,
        audioDuration: Math.max(8, scene.narration.split(/\s+/).length / 2.5),
        pcm: null,
      })),
      aggregateUrl: DEFAULT_TEST_AUDIO_URL,
      usedTestAudio: true,
    };
  }

  const scenes = await mapWithConcurrency(
    storyboard.scenes,
    Number(process.env.TTS_CONCURRENCY || 2),
    async (scene) => {
      const { data } = await generateSpeech(scene.narration);
      const pcm = data.subarray(44);
      const audioDuration = pcm.length / (24_000 * 2);
      const audioUrl = await uploadAudio(
        `${scriptId}/scene-${scene.sceneNumber}.wav`,
        data
      );
      return { scene, audioUrl, audioDuration, pcm };
    }
  );

  const aggregateWav = createWavFile(
    Buffer.concat(scenes.map((item) => item.pcm as Buffer)),
    24_000,
    1,
    16
  );
  const aggregateUrl = await uploadAudio(`${scriptId}/complete.wav`, aggregateWav);
  return { scenes, aggregateUrl, usedTestAudio: false };
}

export async function generateScriptForPrompt(
  prompt: PromptModel
): Promise<ScriptGenerationResult> {
  /*
   * Previous single-call GitHub Models implementation is retained in git history
   * and in constants.ts as a rollback reference. The active pipeline deliberately
   * separates direction, measured speech, and per-scene code generation.
   */
  const storyboard = parseStoryboard(
    await promptCursor(
      buildPlannerPrompt(prompt.prompt),
      `ByteLearn director: ${prompt.prompt.slice(0, 48)}`
    )
  );
  const scriptId = generateUniqueId();
  const language = prompt.language || "english";
  const timedAudio = await generateTimedSceneAudio(storyboard, scriptId, language);

  const scenes = await mapWithConcurrency(
    timedAudio.scenes,
    Number(process.env.CURSOR_SCENE_CONCURRENCY || 3),
    async ({ scene, audioUrl, audioDuration }, index): Promise<GeneratedScene> => {
      const sceneName = `Scene${index + 1}`;
      const generated = await startCursorConversation(
        buildSceneCoderPrompt({
          storyboard,
          scene,
          sceneName,
          audioDuration,
        }),
        `ByteLearn coder ${sceneName}`
      );
      let manimScript = stripMarkdownFence(generated.text);
      if (!manimScript.includes(`class ${sceneName}`)) {
        throw new Error(`Cursor coder did not return the required ${sceneName} class.`);
      }

      // Enforce the audio-only narration rule: if the scene renders prose on
      // screen, send it back to the same coder agent to replace text with visuals.
      for (let rewrite = 0; rewrite < 2; rewrite++) {
        const violations = findNarrationTextViolations(manimScript);
        if (violations.length === 0) {
          break;
        }
        console.warn(
          `[SCRIPT] ${sceneName} rendered prose on screen (${violations.length} violation(s)); requesting rewrite ${rewrite + 1}/2`
        );
        const rewritten = stripMarkdownFence(
          await resumeCursorConversation(
            generated.agentId,
            buildTextViolationFixPrompt({ sceneName, violations })
          )
        );
        if (rewritten.includes(`class ${sceneName}`)) {
          manimScript = rewritten;
        }
      }
      const remainingViolations = findNarrationTextViolations(manimScript);
      if (remainingViolations.length > 0) {
        console.warn(
          `[SCRIPT] ${sceneName} still contains on-screen prose after rewrites; proceeding with warning`,
          remainingViolations
        );
      }

      return {
        ...scene,
        sceneName,
        manimScript,
        audioUrl,
        audioDuration,
        coderAgentId: generated.agentId,
      };
    }
  );

  const fullManimScript = scenes.map((scene) => scene.manimScript).join("\n\n");
  const fullNarration = scenes.map((scene) => scene.narration).join(" ");
  const [scriptRecord, audioRecord] = await prisma.$transaction([
    prisma.script.create({
      data: {
        scriptId,
        script: fullManimScript,
        explanation: storyboard.explanation,
        narration: fullNarration,
        promptId: prompt.id,
      },
    }),
    prisma.audio.create({
      data: {
        audioUrl: timedAudio.aggregateUrl,
        promptId: prompt.id,
      },
    }),
  ]);

  const audioResult: AudioGenerationResult = {
    audioRecord,
    audioUrl: timedAudio.aggregateUrl,
    usedTestAudio: timedAudio.usedTestAudio,
  };

  console.log(`[SCRIPT] Planned and generated ${scenes.length} rich scenes`);
  return {
    scriptRecord,
    title: storyboard.title,
    explanation: storyboard.explanation,
    scenes,
    fullManimScript,
    fullNarration,
    audioResult,
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

  const narration = options.narration ?? scriptRecord.narration;

  if (!narration) {
    throw new Error("Narration not available for audio generation");
  }

  // Get the language from options or from the prompt record
  const language = options.language ?? prompt.language ?? "english";

  let audioUrl: string;
  let usedTestAudio = false;

  if (ENABLE_TTS) {
    if (language !== "english") {
      throw new Error(
        `Deepgram Aura TTS does not currently support the selected "${language}" narration language.`
      );
    }

    // Comment out Eleven Labs implementation
    // const elevenlabs = getElevenLabsClient();
    const supabase = getSupabaseClient();

    /*
     * Previous Gemini TTS/audio preparation implementation (disabled):
     *
     * const { data: base64Audio, mimeType } =
     *   await generateSpeech(narration);
     * let audioBuffer: Buffer = Buffer.from(base64Audio, "base64");
     *
     * const hasWavHeader =
     *   audioBuffer.length >= 4 &&
     *   audioBuffer.toString("ascii", 0, 4) === "RIFF";
     *
     * if (!hasWavHeader) {
     *   // Gemini TTS typically outputs 24kHz, mono, 16-bit PCM.
     *   audioBuffer = createWavFile(audioBuffer, 24000, 1, 16);
     * }
     */

    // Gemini TTS is paused; Deepgram Aura-2 Thalia is the active female voice.
    const { data: audioBuffer, mimeType } = await generateSpeech(narration);

    console.log(`[TTS] Received audio with mimeType: ${mimeType}`);

    let fileExtension = "wav";
    let contentType = mimeType;

    if (mimeType.includes("mpeg") || mimeType.includes("mp3")) {
      fileExtension = "mp3";
    } else if (mimeType.includes("wav") || mimeType.includes("wave")) {
      contentType = "audio/wav";
    } else {
      console.warn(`[TTS] Unknown mimeType: ${mimeType}, defaulting to wav`);
      contentType = "audio/wav";
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
    scenes: script.scenes.map((scene) => ({
      scene_name: scene.sceneName,
      script_code: scene.manimScript,
      audio_url: scene.audioUrl,
      audio_duration: scene.audioDuration,
      coder_agent_id: scene.coderAgentId,
      narration: scene.narration,
      purpose: scene.purpose,
    })),
    quality: options.quality ?? "medium",
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
    repair_url: resolveRepairUrl(),
    max_repair_attempts: 3,
  };

  try {
    const response = await fetch(`${BACKEND_URL}/render-scenes-async`, {
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
  const audioResult = scriptResult.audioResult;
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
