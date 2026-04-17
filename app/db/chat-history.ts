import { eq, and, desc } from 'drizzle-orm';
import { getDb } from './connection';
import { chatMessages, type SelectChatMessage } from './schemas';

export const getChatHistoryByUnitId = async (
  unitId: string,
  userId: string,
): Promise<SelectChatMessage[]> => {
  const db = getDb();
  return db
    .select()
    .from(chatMessages)
    .where(
      and(eq(chatMessages.unitId, unitId), eq(chatMessages.userId, userId)),
    )
    .orderBy(desc(chatMessages.createdAt));
};

export const createChatMessage = async (
  data: typeof chatMessages.$inferInsert,
): Promise<SelectChatMessage> => {
  const db = getDb();
  const [message] = await db.insert(chatMessages).values(data).returning();
  return message;
};

export const clearChatHistory = async (
  unitId: string,
  userId: string,
): Promise<void> => {
  const db = getDb();
  await db
    .delete(chatMessages)
    .where(
      and(eq(chatMessages.unitId, unitId), eq(chatMessages.userId, userId)),
    );
};
