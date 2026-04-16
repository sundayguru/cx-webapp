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
    - content: string

  Important rules for each unit:
  - Do NOT summarize or compress the unit content into a short overview.
  - Extract the full context for that unit from the raw text that belongs to it.
  - Preserve important explanations, concepts, examples, steps, definitions, and supporting details.
  - Write the content as well-structured markdown using headings, subheadings, short paragraphs, lists, and emphasis where useful.
  - The markdown should feel like a complete lesson section, not a note or abstract.
  - Only reorganize for clarity; do not invent facts that are not supported by the raw text.
  - Do not include the unit title in the content

  Format:
  {
    "title": "Module Title",
    "description": "Short module description",
    "units": [
      {
        "title": "Unit Title",
        "summary": "Short summary",
        "content": "# Unit heading\\n## Subtitle\\nDetailed markdown lesson content extracted from the raw text"
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
