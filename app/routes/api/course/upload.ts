import type { Route } from './+types/upload';
import { data } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { uploadToR2, generateContentKey } from '~/utils/r2.server';
import { v4 as uuidv4 } from 'uuid';

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return data({ error: 'No file provided' }, { status: 400 });
    }

    // Only allow PDF files
    if (file.type !== 'application/pdf') {
      return data({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Generate a unique key for the file
    const uploadId = uuidv4();
    const contentKey = generateContentKey(uploadId, file.name);

    // Upload to R2
    const fileBuffer = await file.arrayBuffer();
    const result = await uploadToR2(contentKey, fileBuffer, file.type);

    if (!result) {
      return data({ error: 'Failed to upload file' }, { status: 500 });
    }

    return data({
      uploadId,
      key: result.key,
      size: result.size,
      type: file.type,
      name: file.name,
    });
  } catch {
    console.error('Upload error');
    return data({ error: 'Upload failed' }, { status: 500 });
  }
};
