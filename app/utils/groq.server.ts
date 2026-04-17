import { Groq } from 'groq-sdk';
import {
  buildCurriculumPrompt,
  buildModuleUnitsPrompt,
  parseModuleUnitsResponse,
  parseCurriculumResponse,
  type CurriculumResponse,
  type GeneratedModuleResponse,
  buildModuleUnitPrompt,
  parseModuleUnitResponse,
  type CurriculumUnit,
  type QuizResponse,
  buildGenerateQuizPrompt,
  parseQuizResponse,
  buildUnitAudioScriptPrompt,
  parseUnitAudioScriptResponse,
  type AudioScriptResponse,
} from './curriculum-generation.server';
import { GROQ_MODELS } from './constants';

export type LlmGenerationRequest = {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
};

export type LlmGenerationResponse = {
  text: string;
  providerResponse?: unknown;
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getGroqApiKey = (providedApiKey?: string) => {
  const apiKey = providedApiKey ?? process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY');
  }
  return apiKey;
};

const getGroqClient = (apiKey?: string) =>
  new Groq({
    apiKey: getGroqApiKey(apiKey),
  });

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export const GroqService = {
  async generate({
    model,
    systemPrompt,
    userPrompt,
    temperature,
    maxTokens,
    apiKey,
  }: LlmGenerationRequest & {
    apiKey?: string;
  }): Promise<LlmGenerationResponse> {
    const resolvedApiKey = getGroqApiKey(apiKey);

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolvedApiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: temperature ?? 0.4,
        max_tokens: maxTokens,
        response_format: {
          type: 'json_object',
        },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq request failed (${response.status}): ${errorText}`);
    }

    const payload = (await response.json()) as GroqChatCompletionResponse;
    const text = payload.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new Error('Groq returned an empty response');
    }

    return {
      text,
      providerResponse: payload,
    };
  },
};

export const generateCurriculumWithGroq = async (
  text: string,
  apiKey: string,
  model: string,
): Promise<CurriculumResponse> => {
  const response = await GroqService.generate({
    apiKey,
    model,
    systemPrompt:
      'You are an instructional designer. Return valid JSON only, with no markdown fences or commentary.',
    userPrompt: buildCurriculumPrompt(text),
    temperature: 0.2,
  });

  return parseCurriculumResponse(response.text);
};

export const generateQuizWithGroq = async (
  text: string,
  existingQuestions: string[],
  apiKey: string,
  model: string,
): Promise<QuizResponse> => {
  const prompt = buildGenerateQuizPrompt(text, existingQuestions);
  const response = await GroqService.generate({
    apiKey,
    model,
    systemPrompt:
      'You are an instructional designer. Return valid JSON only, with no markdown fences or commentary.',
    userPrompt: prompt,
    temperature: 0.2,
  });

  return parseQuizResponse(response.text);
};

export const generateModuleUnitsWithGroq = async (
  text: string,
  apiKey: string,
  model: string,
): Promise<GeneratedModuleResponse> => {
  const response = await GroqService.generate({
    apiKey,
    model,
    systemPrompt:
      'You are an instructional designer. Return valid JSON only, with no markdown fences or commentary.',
    userPrompt: buildModuleUnitsPrompt(text),
    temperature: 0.2,
  });

  return parseModuleUnitsResponse(response.text);
};

export const generateModuleUnitWithGroq = async (
  text: string,
  apiKey: string,
  model: string,
): Promise<CurriculumUnit> => {
  const response = await GroqService.generate({
    apiKey,
    model,
    systemPrompt:
      'You are an instructional designer. Return valid JSON only, with no commentary.',
    userPrompt: buildModuleUnitPrompt(text),
    temperature: 0.2,
  });

  return parseModuleUnitResponse(response.text);
};

export const generateUnitAudioScriptWithGroq = async (
  content: string,
  apiKey: string,
  model: string,
): Promise<AudioScriptResponse> => {
  const response = await GroqService.generate({
    apiKey,
    model,
    systemPrompt:
      'You are an instructional designer. Return valid JSON only, with no commentary.',
    userPrompt: buildUnitAudioScriptPrompt(content),
    temperature: 0.2,
  });

  return parseUnitAudioScriptResponse(response.text);
};

// Transcribe audio using Groq Whisper from a remote URL
export async function transcribeAudioGroqFromUrl(
  audioUrl: string,
): Promise<any> {
  if (!audioUrl) throw new Error('audioUrl is required');
  const res = await fetch(audioUrl);
  if (!res.ok) throw new Error('Failed to fetch audio');
  const contentTypeHeader = res.headers.get('content-type') || '';
  const arrayBuffer = await res.arrayBuffer();
  // Determine a supported extension for Groq Whisper
  const allowedExts = [
    'flac',
    'mp3',
    'mp4',
    'mpeg',
    'mpga',
    'm4a',
    'ogg',
    'opus',
    'wav',
    'webm',
  ] as const;
  const urlPath = new URL(audioUrl).pathname.split('/').pop() || '';
  const urlExt = (urlPath.split('.').pop() || '').toLowerCase();

  const mimeToExt: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'webm',
    'audio/opus': 'opus',
    'audio/flac': 'flac',
  };

  const extFromMime = mimeToExt[contentTypeHeader.toLowerCase()] || '';
  let finalExt = '';
  if (allowedExts.includes(urlExt as any)) {
    finalExt = urlExt;
  } else if (allowedExts.includes(extFromMime as any)) {
    finalExt = extFromMime;
  } else {
    finalExt = 'mp3';
  }

  const extToMime: Record<string, string> = {
    flac: 'audio/flac',
    mp3: 'audio/mpeg',
    mp4: 'audio/mp4',
    mpeg: 'audio/mpeg',
    mpga: 'audio/mpeg',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    opus: 'audio/opus',
    wav: 'audio/wav',
    webm: 'audio/webm',
  };
  const finalMime = extToMime[finalExt] || 'audio/mpeg';

  // @ts-ignore - File is available in Node (undici)
  const file = new File([arrayBuffer], `audio.${finalExt}`, {
    type: finalMime,
  });
  const client = getGroqClient();
  const transcription = await client.audio.transcriptions.create({
    // @ts-ignore - SDK accepts File
    file,
    model: GROQ_MODELS.WHISPER_LARGE_V3,
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  } as any);
  return transcription;
}
