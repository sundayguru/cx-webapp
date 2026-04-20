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

export const buildModuleUnitPrompt = (text: string) => `
  Analyze the following unit source text and turn it into a structured learning module unit.
  Respond ONLY with a JSON object.
  The JSON object must contain:
  - title: string
  - summary: string
  - content: string

  Important rules for the unit:
  - Do NOT summarize or compress the unit content into a short overview.
  - Extract the full context for that unit from the raw text that belongs to it.
  - Preserve important explanations, concepts, examples, steps, definitions, and supporting details.
  - Write the content as well-structured markdown using headings, subheadings, short paragraphs, lists, and emphasis where useful.
  - The markdown should feel like a complete lesson section, not a note or abstract.
  - Only reorganize for clarity; do not invent facts that are not supported by the raw text.

  Format:
  {
    "title": "Unit Title",
    "summary": "Unit summarization",
    "content": "# Unit heading\\n## Subtitle\\nDetailed markdown lesson content extracted from the raw text"
  }

  TEXT TO ANALYZE:
  ${text.slice(0, 30000)}
`;

export const parseModuleUnitResponse = (
  responseText: string,
): CurriculumUnit => {
  const jsonStr = responseText.replace(/```json|```/g, '').trim();
  return JSON.parse(jsonStr) as CurriculumUnit;
};

export type AudioScriptResponse = {
  audioScript: string;
};

export const buildUnitAudioScriptPrompt = (content: string) => `
  Convert the following unit lesson content into a natural narration script that can be read aloud and later converted into audio.
  Respond ONLY with a JSON object.
  The JSON object must contain:
  - audioScript: string

  Rules:
  - Rewrite the lesson into flowing spoken narration, not bullet points or headings.
  - Keep the meaning faithful to the source content.
  - Remove markdown formatting, headings, and visual-only references.
  - Use a warm, clear instructional tone suitable for text-to-speech.
  - Keep transitions natural so it sounds like one continuous lesson.
  - Do not include stage directions like "pause", "music", or "read heading".
  - Do not invent facts not supported by the source.

  Format:
  {
    "audioScript": "Narrative script here"
  }

  CONTENT TO CONVERT:
  ${content.slice(0, 40000)}
`;

export const parseUnitAudioScriptResponse = (
  responseText: string,
): AudioScriptResponse => {
  const jsonStr = responseText.replace(/```json|```/g, '').trim();
  return JSON.parse(jsonStr) as AudioScriptResponse;
};

export type QuizQuestion = {
  question: string;
  questionType: 'openText' | 'choice';
  answer: string;
  options?: string[];
};

export type RawTextTagMarker = {
  position: number;
  tag: '--endmodule--' | '--endunit--';
};

export type RawTextTaggingResponse = {
  markers: RawTextTagMarker[];
};

export const buildRawTextTaggingPrompt = (rawText: string) => `
Analyze the following course raw text and identify where section boundaries should be tagged.

Return ONLY a JSON object in this format:
{
  "markers": [
    { "position": 1234, "tag": "--endunit--" },
    { "position": 4567, "tag": "--endmodule--" }
  ]
}

Rules:
- "position" must be a zero-based character index in the ORIGINAL raw text where the tag should be inserted.
- Use "--endunit--" where a unit ends.
- Use "--endmodule--" where a module ends.
- Every "--endmodule--" should represent the end of the final unit in that module.
- A module can contain multiple "--endunit--" markers before a "--endmodule--" marker.
- Do not return any text outside the JSON object.
- Do not invent positions outside the bounds of the raw text.
- Keep the markers ordered from lowest position to highest position.

RAW TEXT:
${rawText}
`;

export const parseRawTextTaggingResponse = (
  responseText: string,
): RawTextTaggingResponse => {
  const jsonStr = responseText.replace(/```json|```/g, '').trim();
  return JSON.parse(jsonStr) as RawTextTaggingResponse;
};

export type QuizResponse = {
  quizzes: QuizQuestion[];
};

export const buildGenerateQuizPrompt = (
  rawText: string,
  existingQuestions: string[],
) => {
  const existingContext =
    existingQuestions.length > 0
      ? `\n\nEXISTING QUESTIONS (DO NOT REPEAT THESE):\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nMake sure new questions are different from the existing ones above.`
      : '';

  return `Analyze the following educational content and generate 10 quiz questions to test understanding.
${existingContext}
Each quiz question should be one of these types:
- "openText": Questions that require a written answer
- "choice": Questions with multiple choice options (3 options)

Respond ONLY with a JSON object:
{
  "quizzes": [
    {
      "question": "Question text",
      "questionType": "openText" or "choice",
      "options": ["Option A", "Option B", "Option C"] // only for choice type
      "answer": "The correct answer to the question"
    }
  ]
}

Rules:
- Questions should test understanding, not just recall
- For choice questions, provide exactly 3 options
- Make sure options are plausible and related to the content
- Questions should be clear and unambiguous
- answer must contain the valid response to the question or the option value to the correct option for the question
- open text question answer should not be more than 3 words
- Ensure to include more choice questions

TEXT TO ANALYZE:
${rawText.slice(0, 40000)}
`;
};

export const parseQuizResponse = (responseText: string): QuizResponse => {
  const jsonStr = responseText.replace(/```json|```/g, '').trim();
  return JSON.parse(jsonStr) as QuizResponse;
};
