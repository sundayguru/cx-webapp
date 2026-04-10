import { eq } from 'drizzle-orm';
import { getDb } from './connection';
import { profile, type InsertProfile } from './schemas';
import { logError } from '../utils/logger';

export const insertProfile = async (data: InsertProfile) => {
  try {
    const db = getDb();
    return await db.insert(profile).values(data);
  } catch (e) {
    logError(e, 'Error inserting profile');
  }
};

export const updateProfile = async (id: string, data: Partial<InsertProfile>) => {
  try {
    const db = getDb();
    return await db.update(profile).set(data).where(eq(profile.id, id));
  } catch (e) {
    logError(e, 'Error updating profile');
  }
};

export const getProfileById = async (id: string) => {
  try {
    const db = getDb();
    const [user] = await db.select().from(profile).where(eq(profile.id, id));
    return user;
  } catch (e) {
    logError(e, 'Error getting profile by id');
  }
};

export const getAllProfiles = async () => {
  try {
    const db = getDb();
    return await db.select().from(profile);
  } catch (e) {
    logError(e, 'Error getting all profiles');
  }
};