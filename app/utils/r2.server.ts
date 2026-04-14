import { cloudflareContext } from '~/contexts.server/cloudflareContext.server';

/**
 * Uploads a file to the R2 course content bucket.
 * Returns the object key that can be stored in the database.
 */
export const uploadToR2 = async (
  key: string,
  data: ReadableStream | ArrayBuffer | Blob | string,
  contentType: string,
): Promise<{ key: string; size: number } | null> => {
  try {
    const context = cloudflareContext.defaultValue;
    const env = context?.env as Env | undefined;
    const bucket = env?.COURSE_CONTENT;

    if (!bucket) {
      console.error('R2 bucket COURSE_CONTENT is not configured');
      return null;
    }

    await bucket.put(key, data, {
      httpMetadata: { contentType },
    });

    const object = await bucket.head(key);
    return { key, size: object?.size ?? 0 };
  } catch (e) {
    console.error('Error uploading to R2:', e);
    return null;
  }
};

/**
 * Gets a file from the R2 course content bucket.
 */
export const getFromR2 = async (key: string) => {
  try {
    const context = cloudflareContext.defaultValue;
    const env = context?.env as Env | undefined;
    const bucket = env?.COURSE_CONTENT;

    if (!bucket) {
      console.error('R2 bucket COURSE_CONTENT is not configured');
      return null;
    }

    return await bucket.get(key);
  } catch (e) {
    console.error('Error getting from R2:', e);
    return null;
  }
};

/**
 * Generates a unique key for course content in R2.
 */
export const generateContentKey = (
  courseId: string,
  filename: string,
): string => {
  const timestamp = Date.now();
  return `courses/${courseId}/${timestamp}-${filename}`;
};
