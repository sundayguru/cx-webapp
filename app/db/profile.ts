import { eq } from 'drizzle-orm';
import { getDb } from './connection';
import { profile, enrollments, quizSessions } from './schemas';
import type { InsertProfile } from './schemas';
import { logError } from '../utils/logger';

export const insertProfile = async (data: InsertProfile) => {
  try {
    const db = getDb();
    return await db.insert(profile).values(data);
  } catch (e) {
    logError(e, 'Error inserting profile');
  }
};

export const updateProfile = async (
  id: string,
  data: Partial<InsertProfile>,
) => {
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

export type PublicUserProfile = {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  stats: {
    coursesEnrolled: number;
    quizzesTaken: number;
    averageScore: number;
  };
};

export const getPublicProfile = async (
  userId: string,
): Promise<PublicUserProfile | null> => {
  try {
    const db = getDb();

    const userProfile = await db.query.profile.findFirst({
      where: eq(profile.userId, userId),
      with: {
        user: true
      }
    })

    if(!userProfile) {
      return  {
      id: '',
      name: '',
      email: '',
      bio: '',
      avatarUrl: '',
      stats: {
        coursesEnrolled: 0,
        quizzesTaken: 0,
        averageScore: 0,
      },
    };
    }

    const enrollmentCount = await db
      .select({ count: enrollments.id })
      .from(enrollments)
      .where(eq(enrollments.userId, userId));

    const userSessions = await db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.userId, userId));

    const quizzesTaken = userSessions.length;
    const totalQuestions = userSessions.reduce(
      (sum, s) => sum + s.totalQuestions,
      0,
    );
    const correctAnswers = userSessions.reduce(
      (sum, s) => sum + s.correctAnswers,
      0,
    );
    const averageScore =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    return {
      id: userProfile.id,
      name: `${userProfile.user.firstName} ${userProfile.user.lastName}`,
      email: userProfile.user.email,
      bio: userProfile.bio,
      avatarUrl: userProfile.avatarUrl,
      stats: {
        coursesEnrolled: Number(enrollmentCount[0]?.count) ?? 0,
        quizzesTaken,
        averageScore,
      },
    };
  } catch (e) {
    logError(e, 'Error getting public profile');
    return null;
  }
};
