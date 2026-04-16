export type CurriculumUnit = {
  title: string;
  content: string;
};

export type CurriculumModule = {
  title: string;
  description: string;
  units: CurriculumUnit[];
};

export type CurriculumResponse = {
  modules: CurriculumModule[];
};

export const buildCurriculumPrompt = (text: string) => `
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

export const parseCurriculumResponse = (
  responseText: string,
): CurriculumResponse => {
  const jsonStr = responseText.replace(/```json|```/g, '').trim();
  return JSON.parse(jsonStr) as CurriculumResponse;
};
