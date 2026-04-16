export type CurriculumUnit = {
  title: string;
  summary: string;
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

export type GeneratedModuleResponse = {
  title: string;
  description: string;
  units: CurriculumUnit[];
};

export const buildCurriculumPrompt = (text: string) => `
  Analyze the following educational content and structure it into a logical course curriculum.
  Respond ONLY with a JSON object containing an array of modules.
  Each module should have:
  - title: string
  - description: string
  - units: an array of objects with:
    - title: string
    - content: string (the extract or the course content exactly as presented in text formated with a markdown)
    - summary: string (a short summary or key points for this unit)

  Format:
  {
    "modules": [
      {
        "title": "Module Title",
        "description": "Short description",
        "units": [
          { "title": "Unit Title", "summary": "Summary", "content": "Content extract" }
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

export const buildModuleUnitsPrompt = (text: string) => `
  Analyze the following module source text and turn it into a structured module with learning units.
  Respond ONLY with a JSON object.
  The JSON object must contain:
  - title: string
  - description: string
  - units: an array of objects with:
    - title: string
    - summary: string
    - content: string (the structured learning content in markdown)

  Format:
  {
    "title": "Module Title",
    "description": "Short module description",
    "units": [
      {
        "title": "Unit Title",
        "summary": "Short summary",
        "content": "Markdown learning content"
      }
    ]
  }

  TEXT TO ANALYZE:
  ${text.slice(0, 30000)}
`;

export const parseModuleUnitsResponse = (
  responseText: string,
): GeneratedModuleResponse => {
  const jsonStr = responseText.replace(/```json|```/g, '').trim();
  return JSON.parse(jsonStr) as GeneratedModuleResponse;
};
