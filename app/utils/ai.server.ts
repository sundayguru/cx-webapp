import { extractText } from 'unpdf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logError } from './logger';
import { Buffer } from 'node:buffer';
import {
  buildCurriculumPrompt,
  parseCurriculumResponse,
  type CurriculumResponse,
} from './curriculum-generation.server';
import { GOOGLE_CURRICULUM_MODEL_OPTIONS } from './curriculum-options';

const DEFAULT_GEMINI_MODELS = GOOGLE_CURRICULUM_MODEL_OPTIONS.map(
  (modelOption) => modelOption.value,
);

export const extractTextFromPdf = async (buffer: Buffer): Promise<string> => {
  try {
    const { text } = await extractText(buffer, { mergePages: true });
    // text is a string when mergePages is true
    console.log('EXTRACTED TEXT LENGTH:', text?.length || 0);
    return (text as string) || '';
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : 'Unknown PDF parsing error';
    logError(e, 'Error parsing PDF with unpdf');
    throw new Error(`Failed to extract text from PDF: ${message}`);
  }
};

export const generateCurriculum = async (
  text: string,
  apiKey: string,
  preferredModel?: string,
): Promise<CurriculumResponse> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = [
    ...(preferredModel ? [preferredModel] : []),
    ...DEFAULT_GEMINI_MODELS,
  ].filter((modelName, index, models) => models.indexOf(modelName) === index);
  const prompt = buildCurriculumPrompt(text);

  let lastError: unknown;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return parseCurriculumResponse(response.text());
    } catch (e: unknown) {
      lastError = e;
      logError(e, `Error generating curriculum with model ${modelName}`);
    }
  }

  const errorMessage =
    lastError instanceof Error
      ? lastError.message
      : 'Unknown AI generation error';

  throw new Error(
    `Failed to generate curriculum structure. Tried models: ${modelNames.join(', ')}. Last error: ${errorMessage}`,
  );
};
