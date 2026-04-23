import { getDb } from './connection';
import { googleTtsVoices } from './schemas';
import type { GoogleTtsVoice, GoogleTtsVoiceGender } from '~/utils/google-tts';

const GOOGLE_TTS_VOICE_INSERT_BATCH_SIZE = 25;

const parseLanguageCodes = (value: string) => {
  try {
    const parsed = JSON.parse(value) as unknown;

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
};

export const getStoredGoogleTtsVoices = async (): Promise<GoogleTtsVoice[]> => {
  const db = getDb();
  const rows = await db.query.googleTtsVoices.findMany();

  return rows.map((row) => ({
    name: row.name,
    languageCodes: parseLanguageCodes(row.languageCodes),
    ssmlGender: row.ssmlGender as GoogleTtsVoiceGender,
    naturalSampleRateHertz: row.naturalSampleRateHertz,
  }));
};

export const storeGoogleTtsVoices = async (voices: GoogleTtsVoice[]) => {
  if (voices.length === 0) {
    return;
  }

  try {
    const db = getDb();

    for (
      let startIndex = 0;
      startIndex < voices.length;
      startIndex += GOOGLE_TTS_VOICE_INSERT_BATCH_SIZE
    ) {
      const batch = voices.slice(
        startIndex,
        startIndex + GOOGLE_TTS_VOICE_INSERT_BATCH_SIZE,
      );

      await db.insert(googleTtsVoices).values(
        batch.map((voice) => ({
          name: voice.name,
          languageCodes: JSON.stringify(voice.languageCodes),
          ssmlGender: voice.ssmlGender,
          naturalSampleRateHertz: voice.naturalSampleRateHertz,
        })),
      );
    }
  } catch (error) {
    console.error('Failed to store Google TTS voices', error);
  }
};
