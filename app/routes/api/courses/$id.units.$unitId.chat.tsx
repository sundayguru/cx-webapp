import { data } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { getDb } from '~/db/connection';
import { units } from '~/db/schemas';
import { eq } from 'drizzle-orm';
import { getChatHistoryByUnitId, createChatMessage } from '~/db/chat-history';
import {
  buildChatSystemPrompt,
  buildChatUserPrompt,
} from '~/utils/chat.server';
import { getUserFromRequest } from '~/utils/session.server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import type { CurriculumAiProvider } from '~/utils/curriculum-options';

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { unitId } = params;
  const user = await getUserFromRequest(request);

  if (!unitId) {
    return data({ error: 'Unit ID is required' }, { status: 400 });
  }

  if (!user) {
    return data({ error: 'Authentication required' }, { status: 401 });
  }

  const formData = await request.formData();
  const message = formData.get('message') as string;
  const provider = (formData.get('provider') as CurriculumAiProvider) || 'groq';
  const model = formData.get('model') as string;

  if (!message?.trim()) {
    return data({ error: 'Message is required' }, { status: 400 });
  }

  const db = getDb();
  const [unit] = await db
    .select()
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1);

  if (!unit) {
    return data({ error: 'Unit not found' }, { status: 404 });
  }

  if (!unit.rawText?.trim()) {
    return data(
      {
        error:
          'This unit does not have course content to reference. Please generate the unit content first.',
      },
      { status: 400 },
    );
  }

  const chatHistory = await getChatHistoryByUnitId(unitId, user.id);
  const systemPrompt = buildChatSystemPrompt(unit.title, unit.rawText);
  const userPrompt = buildChatUserPrompt(message, chatHistory);

  let responseText: string;

  try {
    if (provider === 'groq') {
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        return data({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
      }
      const groq = new Groq({ apiKey: groqApiKey });
      const completion = await groq.chat.completions.create({
        model: model || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      });

      responseText = completion.choices[0]?.message?.content || '';
    } else {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return data(
          { error: 'GEMINI_API_KEY not configured' },
          { status: 500 },
        );
      }
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const genModel = genAI.getGenerativeModel({
        model: model || 'gemini-2.0-flash',
      });

      const result = await genModel.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
      ]);

      responseText = result.response.text();
    }
  } catch (e: unknown) {
    const errorMessage =
      e instanceof Error ? e.message : 'AI generation failed';
    console.error('Chat AI error:', errorMessage);
    return data({ error: "We are experience high traffic at the moment please try again" }, { status: 400 });
  }

  // Remove thinking process tags if present
  responseText = responseText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  await createChatMessage({
    id: crypto.randomUUID(),
    unitId,
    userId: user.id,
    role: 'user',
    content: message,
    provider,
    model,
  });

  const [assistantMessage] = await Promise.all([
    createChatMessage({
      id: crypto.randomUUID(),
      unitId,
      userId: user.id,
      role: 'assistant',
      content: responseText,
      provider,
      model,
    }),
  ]);

  return data({ message: assistantMessage });
};

export const loader = async ({ params, request }: ActionFunctionArgs) => {
  const { unitId } = params;
  const user = await getUserFromRequest(request);

  if (!unitId) {
    return data({ error: 'Unit ID is required' }, { status: 400 });
  }

  if (!user) {
    return data({ error: 'Authentication required' }, { status: 401 });
  }

  const chatHistory = await getChatHistoryByUnitId(unitId, user.id);
  return data({ history: chatHistory });
};
