import { mkdirSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";

import {
  Agent,
  CursorAgentError,
  JsonlLocalAgentStore,
  type AgentOptions,
  type SDKAgent,
} from "@cursor/sdk";

const DEFAULT_MODEL = "composer-2.5";
const DEFAULT_FALLBACK_MODEL = "auto";

let sharedServerlessStore: JsonlLocalAgentStore | null = null;
let serverlessHomeReady = false;

function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.CURSOR_SDK_FORCE_TMP === "true"
  );
}

/**
 * Vercel/Lambda sandboxes advertise a home like /home/sbx_user1051 that does
 * not exist and cannot be created. The Cursor SDK still writes transcripts and
 * caches under os.homedir(), so redirect HOME (and XDG dirs) to /tmp first.
 */
function ensureServerlessHome(): void {
  if (!isServerlessRuntime() || serverlessHomeReady) {
    return;
  }

  const home = path.join(tmpdir(), "bytelearn-home");
  mkdirSync(home, { recursive: true });
  mkdirSync(path.join(home, ".cursor"), { recursive: true });

  process.env.HOME = home;
  process.env.USERPROFILE = home;
  process.env.XDG_CACHE_HOME = path.join(home, ".cache");
  process.env.XDG_STATE_HOME = path.join(home, ".local", "state");
  process.env.XDG_DATA_HOME = path.join(home, ".local", "share");
  mkdirSync(process.env.XDG_CACHE_HOME, { recursive: true });
  mkdirSync(process.env.XDG_STATE_HOME, { recursive: true });
  mkdirSync(process.env.XDG_DATA_HOME, { recursive: true });

  serverlessHomeReady = true;
  console.log(
    `[CURSOR] Serverless home redirected to ${home} (os.homedir=${homedir()})`
  );
}

/**
 * Vercel/Lambda only allow writes under /tmp. The SDK's default local store
 * lives under ~/.cursor/projects/<cwd>/sdk-agent-store and fails with ENOENT
 * when cwd is the read-only /var/task bundle.
 */
function resolveCursorWorkspace(): string {
  ensureServerlessHome();

  const configured = process.env.CURSOR_SDK_CWD?.trim();
  if (configured) {
    mkdirSync(configured, { recursive: true });
    return configured;
  }

  if (isServerlessRuntime()) {
    const workspace = path.join(tmpdir(), "bytelearn-cursor");
    mkdirSync(workspace, { recursive: true });
    return workspace;
  }

  return process.cwd();
}

function resolveLocalStore(workspace: string): JsonlLocalAgentStore | undefined {
  ensureServerlessHome();

  const configuredStoreDir = process.env.CURSOR_SDK_STORE_DIR?.trim();
  if (!isServerlessRuntime() && !configuredStoreDir) {
    return undefined;
  }

  const storeDir =
    configuredStoreDir || path.join(workspace, "sdk-agent-store");
  mkdirSync(storeDir, { recursive: true });

  if (!sharedServerlessStore) {
    sharedServerlessStore = new JsonlLocalAgentStore(storeDir);
  }
  return sharedServerlessStore;
}

function cursorOptions(name: string, modelId?: string): AgentOptions {
  const apiKey = process.env.CURSOR_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("CURSOR_API_KEY is not configured.");
  }

  const cwd = resolveCursorWorkspace();
  const store = resolveLocalStore(cwd);

  return {
    apiKey,
    model: {
      id: modelId || process.env.CURSOR_SDK_MODEL?.trim() || DEFAULT_MODEL,
    },
    name,
    local: {
      cwd,
      settingSources: [],
      enableAgentRetries: true,
      ...(store ? { store } : {}),
    },
  };
}

function collectErrorText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  let depth = 0;
  while (current && depth < 5) {
    if (current instanceof Error) {
      parts.push(current.message);
      parts.push(current.name);
      const code = (current as Error & { code?: string }).code;
      if (code) {
        parts.push(code);
      }
      current = (current as Error & { cause?: unknown }).cause;
    } else {
      parts.push(String(current));
      break;
    }
    depth += 1;
  }
  return parts.join(" ");
}

function shouldRetryCursorRun(error: unknown): boolean {
  if (error instanceof CursorAgentError) {
    return error.isRetryable || /ENOENT|EACCES|EROFS|UND_ERR_SOCKET|terminated|other side closed/i.test(
      collectErrorText(error)
    );
  }
  return /looping detected|repeating response|rate.?limit|temporar|timed? ?out|transport|ENOENT|EACCES|EROFS|UND_ERR_SOCKET|terminated|other side closed|socket|ECONNRESET|ETIMEDOUT|fetch failed/i.test(
    collectErrorText(error)
  );
}

function retryModels(): string[] {
  const primary = process.env.CURSOR_SDK_MODEL?.trim() || DEFAULT_MODEL;
  const fallback =
    process.env.CURSOR_SDK_FALLBACK_MODEL?.trim() || DEFAULT_FALLBACK_MODEL;
  const configuredAttempts = Number(process.env.CURSOR_SDK_MAX_ATTEMPTS || 3);
  const maxAttempts = Number.isFinite(configuredAttempts)
    ? Math.max(1, Math.min(3, configuredAttempts))
    : 3;
  return Array.from({ length: maxAttempts }, (_, index) =>
    index === 1 ? fallback : primary
  );
}

function runFailureMessage(result: {
  status: string;
  error?: { message?: string };
}): string {
  return result.error?.message || `Cursor run ended with status "${result.status}".`;
}

function normalizeCursorError(error: unknown): Error {
  if (error instanceof CursorAgentError) {
    const retryable = error.isRetryable ? " (retryable)" : "";
    return new Error(`Cursor SDK could not start the run${retryable}: ${error.message}`);
  }
  if (error instanceof Error) {
    const causeText = collectErrorText(error);
    if (causeText !== error.message) {
      return new Error(`${error.message} (${causeText})`);
    }
    return error;
  }
  return new Error(String(error));
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function stripMarkdownFence(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^```(?:json|python|py)?\s*([\s\S]*?)\s*```$/i);
  return (match?.[1] ?? trimmed).trim();
}

/** Default scene-coder concurrency: 1 on serverless to avoid socket drops. */
export function resolveCursorSceneConcurrency(): number {
  const configured = Number(process.env.CURSOR_SCENE_CONCURRENCY);
  if (Number.isFinite(configured) && configured > 0) {
    return Math.max(1, Math.floor(configured));
  }
  return isServerlessRuntime() ? 1 : 3;
}

export async function promptCursor(
  prompt: string,
  name: string
): Promise<string> {
  ensureServerlessHome();
  let lastError: unknown;
  const models = retryModels();
  for (const [index, model] of models.entries()) {
    try {
      const result = await Agent.prompt(
        index === 0
          ? prompt
          : `${prompt}\n\nRETRY NOTE: Return the requested artifact once without repeating sections.`,
        cursorOptions(`${name} attempt ${index + 1}`, model)
      );
      if (result.status !== "finished" || !result.result?.trim()) {
        throw new Error(runFailureMessage(result));
      }
      return result.result.trim();
    } catch (error) {
      lastError = error;
      if (!shouldRetryCursorRun(error) || index === models.length - 1) {
        throw normalizeCursorError(error);
      }
      console.warn(
        `[CURSOR] ${name} failed on ${model}; retrying in a fresh agent`,
        error
      );
      await delay(750 * (index + 1));
    }
  }
  throw normalizeCursorError(lastError);
}

export type CursorConversationResult = {
  agentId: string;
  text: string;
};

async function sendAndRead(agent: SDKAgent, prompt: string): Promise<string> {
  const run = await agent.send(prompt);
  const result = await run.wait();
  if (result.status !== "finished" || !result.result?.trim()) {
    throw new Error(runFailureMessage(result));
  }
  return result.result.trim();
}

export async function startCursorConversation(
  prompt: string,
  name: string
): Promise<CursorConversationResult> {
  ensureServerlessHome();
  let lastError: unknown;
  const models = retryModels();
  for (const [index, model] of models.entries()) {
    let agent: SDKAgent | null = null;
    try {
      agent = await Agent.create(
        cursorOptions(`${name} attempt ${index + 1}`, model)
      );
      const text = await sendAndRead(
        agent,
        index === 0
          ? prompt
          : `${prompt}\n\nRETRY NOTE: Produce one complete answer without repeating any block.`
      );
      return { agentId: agent.agentId, text };
    } catch (error) {
      lastError = error;
      if (!shouldRetryCursorRun(error) || index === models.length - 1) {
        throw normalizeCursorError(error);
      }
      console.warn(
        `[CURSOR] ${name} failed on ${model}; retrying in a fresh agent`,
        error
      );
      await delay(750 * (index + 1));
    } finally {
      if (agent) {
        await agent[Symbol.asyncDispose]();
      }
    }
  }
  throw normalizeCursorError(lastError);
}

export async function resumeCursorConversation(
  agentId: string,
  prompt: string
): Promise<string> {
  ensureServerlessHome();
  let agent: SDKAgent | null = null;
  try {
    agent = await Agent.resume(agentId, cursorOptions("ByteLearn scene repair"));
    return await sendAndRead(agent, prompt);
  } catch (error) {
    throw normalizeCursorError(error);
  } finally {
    if (agent) {
      await agent[Symbol.asyncDispose]();
    }
  }
}
