import { eq, desc, and, isNull } from 'drizzle-orm';
import { getDb } from './connection';
import {
  communityPosts,
  communityReactions,
  users,
  profile,
  type InsertCommunityPost,
} from './schemas';
import { logError } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export const createCommunityPost = async (
  post: Omit<InsertCommunityPost, 'id'>,
) => {
  try {
    const db = getDb();
    const id = uuidv4();
    return await db
      .insert(communityPosts)
      .values({ ...post, id })
      .returning();
  } catch (e) {
    logError(e, 'Error creating community post');
    return null;
  }
};

export const getCommunityPostsByCourseId = async (courseId: string) => {
  try {
    const db = getDb();
    // First get top-level posts
    const posts = await db
      .select({
        post: communityPosts,
        user: users,
        profile: profile,
      })
      .from(communityPosts)
      .innerJoin(users, eq(users.id, communityPosts.userId))
      .leftJoin(profile, eq(profile.userId, users.id))
      .where(
        and(
          eq(communityPosts.courseId, courseId),
          isNull(communityPosts.parentId),
        ),
      )
      .orderBy(desc(communityPosts.createdAt));

    // Get all replies for the course
    const replies = await db
      .select({
        post: communityPosts,
        user: users,
        profile: profile,
      })
      .from(communityPosts)
      .innerJoin(users, eq(users.id, communityPosts.userId))
      .leftJoin(profile, eq(profile.userId, users.id))
      .where(
        and(
          eq(communityPosts.courseId, courseId),
          // We can't use isNotNull easily without importing it, so we filter out in JS or use sql trick.
          // Alternatively, just group by parent id. Actually let's fetch all posts then build the tree.
        ),
      )
      .orderBy(desc(communityPosts.createdAt));

    return { posts, replies };
  } catch (e) {
    logError(e, 'Error getting community posts');
    return null;
  }
};

export const getAllCommunityPostsForCourse = async (courseId: string) => {
  try {
    const db = getDb();
    // Fetch all posts first, then we can easily assemble them in memory
    const allPosts = await db
      .select({
        post: communityPosts,
        user: users,
        profile: profile,
      })
      .from(communityPosts)
      .innerJoin(users, eq(users.id, communityPosts.userId))
      .leftJoin(profile, eq(profile.userId, users.id))
      .where(eq(communityPosts.courseId, courseId))
      .orderBy(desc(communityPosts.createdAt));

    const reactions = await db
      .select({
        reaction: communityReactions,
        user: users,
      })
      .from(communityReactions)
      .innerJoin(
        communityPosts,
        eq(communityReactions.postId, communityPosts.id),
      )
      .innerJoin(users, eq(users.id, communityReactions.userId))
      .where(eq(communityPosts.courseId, courseId));

    return { allPosts, reactions };
  } catch (e) {
    logError(e, 'Error getting all community posts for course');
    return null;
  }
};

export const toggleCommunityReaction = async (
  postId: string,
  userId: string,
  emoji: string,
) => {
  try {
    const db = getDb();
    const existing = await db
      .select()
      .from(communityReactions)
      .where(
        and(
          eq(communityReactions.postId, postId),
          eq(communityReactions.userId, userId),
          eq(communityReactions.emoji, emoji),
        ),
      );

    if (existing.length > 0) {
      await db
        .delete(communityReactions)
        .where(eq(communityReactions.id, existing[0].id));
      return { action: 'removed' };
    } else {
      const id = uuidv4();
      await db.insert(communityReactions).values({ id, postId, userId, emoji });
      return { action: 'added' };
    }
  } catch (e) {
    logError(e, 'Error toggling reaction');
    return null;
  }
};

export const deleteCommunityPost = async (postId: string, userId: string) => {
  try {
    const db = getDb();
    const result = await db
      .update(communityPosts)
      .set({ isDeleted: true })
      .where(
        and(
          eq(communityPosts.id, postId),
          eq(communityPosts.userId, userId)
        )
      )
      .returning();
    return result;
  } catch (e) {
    logError(e, 'Error deleting community post');
    return null;
  }
};
