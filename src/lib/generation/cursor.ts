import {
  Agent,
  CursorAgentError,
  type AgentOptions,
  type SDKAgent,
} from "@cursor/sdk";

const DEFAULT_MODEL = "composer-2.5";
const DEFAULT_FALLBACK_MODEL = "auto";

function cursorOptions(name: string, modelId?: string): AgentOptions {
  const apiKey = process.env.CURSOR_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("CURSOR_API_KEY is not configured.");
  }

  return {
    apiKey,
    model: {
      id: modelId || process.env.CURSOR_SDK_MODEL?.trim() || DEFAULT_MODEL,
    },
    name,
    local: {
      cwd: process.cwd(),
      settingSources: [],
      enableAgentRetries: true,
    },
  };
}

function shouldRetryCursorRun(error: unknown): boolean {
  if (error instanceof CursorAgentError) {
    return error.isRetryable;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /looping detected|repeating response|rate.?limit|temporar|timed? ?out|transport/i.test(
    message
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
  return error instanceof Error ? error : new Error(String(error));
}

export function stripMarkdownFence(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^```(?:json|python|py)?\s*([\s\S]*?)\s*```$/i);
  return (match?.[1] ?? trimmed).trim();
}

export async function promptCursor(
  prompt: string,
  name: string
): Promise<string> {
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
