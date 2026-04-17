import { eq, desc } from 'drizzle-orm';
import { getDb } from './connection';
import { chatMessages, type SelectChatMessage } from './schemas';

export const getChatHistoryByUnitId = async (
  unitId: string,
): Promise<SelectChatMessage[]> => {
  const db = getDb();
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.unitId, unitId))
    .orderBy(desc(chatMessages.createdAt));
};

export const createChatMessage = async (
  data: typeof chatMessages.$inferInsert,
): Promise<SelectChatMessage> => {
  const db = getDb();
  const [message] = await db.insert(chatMessages).values(data).returning();
  return message;
};

export const clearChatHistory = async (unitId: string): Promise<void> => {
  const db = getDb();
  await db.delete(chatMessages).where(eq(chatMessages.unitId, unitId));
};
