import { extractText } from 'unpdf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logError } from './logger';
import { Buffer } from 'node:buffer';

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
): Promise<{ modules: any[] }> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-1.5-flash-latest as a fallback or more stable name
  // If the error persists, it might be an issue with the API version version in the SDK
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonStr = response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e: any) {
    logError(e, `Error generating curriculum with model gemini-1.5-flash`);
    
    // Attempt fallback to a different model name if 404
    if (e.message?.includes('404') || e.message?.includes('not found')) {
       try {
         const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
         const result = await fallbackModel.generateContent(prompt);
         const response = await result.response;
         const jsonStr = response.text().replace(/```json|```/g, '').trim();
         return JSON.parse(jsonStr);
       } catch (fallbackErr: any) {
         logError(fallbackErr, 'Fallback model also failed');
         throw new Error(`AI Model not found or unsupported. Please check model availability for your API key. Original error: ${e.message}`);
       }
    }
    
    throw new Error(`Failed to generate curriculum structure: ${e.message}`);
  }
};
