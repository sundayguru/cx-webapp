import { eq } from 'drizzle-orm';
import { data, type ActionFunctionArgs } from 'react-router';
import { getDb } from '~/db/connection';
import { getCourseById } from '~/db/courses';
import { units } from '~/db/schemas';
import { generateContentKey, uploadToR2 } from '~/utils/r2.server';
import { getUserFromRequest } from '~/utils/session.server';
import { isYouTubeUrl } from '~/utils/video';

const createUnitMediaKey = (
  unitId: string,
  mediaType: 'audio' | 'video',
  filename: string,
) => {
  return `units/${unitId}/${mediaType}/${generateContentKey(unitId, filename).split('/').pop()}`;
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUserFromRequest(request);

  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, unitId } = params;

  if (!id || !unitId) {
    return data(
      { error: 'Course ID and Unit ID are required' },
      { status: 400 },
    );
  }

  const courseData = await getCourseById(id);

  if (!courseData) {
    return data({ error: 'Course not found' }, { status: 404 });
  }

  if (courseData.course.createdBy !== user.id) {
    return data(
      { error: 'Only the creator can upload unit media' },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const audioFile = formData.get('audioFile');
  const videoFile = formData.get('videoFile');
  const videoLink = formData.get('videoLink');

  const hasAudioFile = audioFile instanceof File && audioFile.size > 0;
  const hasVideoFile = videoFile instanceof File && videoFile.size > 0;
  const hasVideoLink =
    typeof videoLink === 'string' && videoLink.trim().length > 0;

  if (!hasAudioFile && !hasVideoFile && !hasVideoLink) {
    return data(
      { error: 'Upload audio, video, or paste a YouTube link' },
      { status: 400 },
    );
  }

  if (hasAudioFile && !audioFile.type.startsWith('audio/')) {
    return data(
      { error: 'Audio file must be a valid audio type' },
      { status: 400 },
    );
  }

  if (hasVideoFile && !videoFile.type.startsWith('video/')) {
    return data(
      { error: 'Video file must be a valid video type' },
      { status: 400 },
    );
  }

  if (hasVideoFile && hasVideoLink) {
    return data(
      { error: 'Choose either a video file or a YouTube link, not both' },
      { status: 400 },
    );
  }

  if (hasVideoLink && !isYouTubeUrl(videoLink.trim())) {
    return data(
      { error: 'Video link must be a valid YouTube URL' },
      { status: 400 },
    );
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

  let nextAudioUrl = unit.audioUrl;
  let nextVideoUrl = unit.videoUrl;

  if (hasAudioFile) {
    const audioKey = createUnitMediaKey(unitId, 'audio', audioFile.name);
    const audioUpload = await uploadToR2(
      audioKey,
      await audioFile.arrayBuffer(),
      audioFile.type,
    );

    if (!audioUpload) {
      return data({ error: 'Failed to upload audio file' }, { status: 500 });
    }

    nextAudioUrl = `/api/course/serve/${audioUpload.key}`;
  }

  if (hasVideoFile) {
    const videoKey = createUnitMediaKey(unitId, 'video', videoFile.name);
    const videoUpload = await uploadToR2(
      videoKey,
      await videoFile.arrayBuffer(),
      videoFile.type,
    );

    if (!videoUpload) {
      return data({ error: 'Failed to upload video file' }, { status: 500 });
    }

    nextVideoUrl = `/api/course/serve/${videoUpload.key}`;
  }

  if (hasVideoLink) {
    nextVideoUrl = videoLink.trim();
  }

  await db
    .update(units)
    .set({
      audioUrl: nextAudioUrl,
      videoUrl: nextVideoUrl,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(units.id, unitId));

  return data({
    success: true,
    audioUploaded: hasAudioFile,
    videoUploaded: hasVideoFile,
    videoLinked: hasVideoLink,
  });
};
