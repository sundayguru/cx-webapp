import { extractText } from 'unpdf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logError } from './logger';
import { Buffer } from 'node:buffer';
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
} from './curriculum-generation.server';

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
  preferredModel: string,
): Promise<CurriculumResponse> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildCurriculumPrompt(text);

  let lastError: unknown;

  try {
    const model = genAI.getGenerativeModel({ model: preferredModel });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseCurriculumResponse(response.text());
  } catch (e: unknown) {
    lastError = e;
    logError(e, `Error generating curriculum with model ${preferredModel}`);
  }
  const errorMessage =
    lastError instanceof Error
      ? lastError.message
      : 'Unknown AI generation error';

  throw new Error(
    `Failed to generate curriculum structure. Last error: ${errorMessage}`,
  );
};

export const generateModuleUnits = async (
  text: string,
  apiKey: string,
  preferredModel: string,
): Promise<GeneratedModuleResponse> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildModuleUnitsPrompt(text);

  let lastError: unknown;

  try {
    const model = genAI.getGenerativeModel({ model: preferredModel });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseModuleUnitsResponse(response.text());
  } catch (e: unknown) {
    lastError = e;
    logError(e, `Error generating module units with model ${preferredModel}`);
  }

  const errorMessage =
    lastError instanceof Error
      ? lastError.message
      : 'Unknown AI generation error';

  throw new Error(
    `Failed to generate module units. Last error: ${errorMessage}`,
  );
};

export const generateModuleUnit = async (
  text: string,
  apiKey: string,
  preferredModel: string,
): Promise<CurriculumUnit> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildModuleUnitPrompt(text);

  let lastError: unknown;

  try {
    const model = genAI.getGenerativeModel({ model: preferredModel });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseModuleUnitResponse(response.text());
  } catch (e: unknown) {
    lastError = e;
    logError(e, `Error generating unit with model ${preferredModel}`);
  }

  const errorMessage =
    lastError instanceof Error
      ? lastError.message
      : 'Unknown AI generation error';

  throw new Error(`Failed to generate unit. Last error: ${errorMessage}`);
};
