export type GoogleTtsVoiceGender =
  | 'SSML_VOICE_GENDER_UNSPECIFIED'
  | 'MALE'
  | 'FEMALE'
  | 'NEUTRAL';

export const GOOGLE_TTS_LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'de-DE', label: 'German' },
  { value: 'fr-FR', label: 'French' },
  { value: 'es-ES', label: 'Spanish' },
] as const;

export const GOOGLE_TTS_GENDER_OPTIONS = [
  { value: 'FEMALE', label: 'Female' },
  { value: 'MALE', label: 'Male' },
  { value: 'NEUTRAL', label: 'Neutral' },
  {
    value: 'SSML_VOICE_GENDER_UNSPECIFIED',
    label: 'Unspecified',
  },
] as const;

export type GoogleTtsVoiceListItem = {
  name: string;
  languageCodes: string[];
  ssmlGender: GoogleTtsVoiceGender;
  naturalSampleRateHertz: number;
};

export type GoogleTtsVoice = GoogleTtsVoiceListItem;
