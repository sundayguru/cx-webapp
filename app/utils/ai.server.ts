import { extractText } from 'unpdf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logError } from './logger';
import { Buffer } from 'node:buffer';

type CurriculumUnit = {
  title: string;
  content: string;
};

type CurriculumModule = {
  title: string;
  description: string;
  units: CurriculumUnit[];
};

type CurriculumResponse = {
  modules: CurriculumModule[];
};

const DEFAULT_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
] as const;

const parseCurriculumResponse = (responseText: string): CurriculumResponse => {
  const jsonStr = responseText.replace(/```json|```/g, '').trim();
  return JSON.parse(jsonStr) as CurriculumResponse;
};

export const extractTextFromPdf = async (buffer: Buffer): Promise<string> => {
  try {
    const { text } = await extractText(buffer, { mergePages: true });
    // text is a string when mergePages is true
    console.log('EXTRACTED TEXT LENGTH:', text?.length || 0);
    return (text as string) || '';
  } catch (e: any) {
    logError(e, 'Error parsing PDF with unpdf');
    throw new Error(`Failed to extract text from PDF: ${e.message}`);
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

  const prompt = `
    Analyze the following educational content and structure it into a logical course curriculum.
    Respond ONLY with a JSON object containing an array of modules.
    Each module should have:
    - title: string
    - description: string
    - units: an array of objects with:
      - title: string
      - content: string (a short summary or key points for this unit)

    Format:
    {
      "modules": [
        {
          "title": "Module Title",
          "description": "Short description",
          "units": [
            { "title": "Unit Title", "content": "Summary" }
          ]
        }
      ]
    }

    TEXT TO ANALYZE:
    ${text.slice(0, 30000)}
  `;

  let lastError: unknown;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return parseCurriculumResponse(response.text());
    } catch (e: any) {
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
