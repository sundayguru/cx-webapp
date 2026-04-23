import {
  type WorkflowEvent,
  WorkflowEntrypoint,
  type WorkflowStep,
} from 'cloudflare:workers';
import { getCourseById } from '~/db/courses';
import {
  generateUnitAudioForUnit,
  generateUnitAudioScriptForUnit,
  resolveCourseAiOptions,
  resolveGoogleTtsVoiceOptions,
} from '~/utils/course-processing.server';

export type CourseUnitAudioWorkflowParams = {
  courseId: string;
  provider?: string;
  model?: string;
  languageCode?: string;
  ssmlGender?: string;
  voiceName?: string;
  speakingRate?: number;
  pitch?: number;
};

type WorkflowUnit = {
  id: string;
  title: string;
  audioUrl: string | null;
};

export class CourseUnitAudioWorkflow extends WorkflowEntrypoint<
  Env,
  CourseUnitAudioWorkflowParams
> {
  async run(
    event: Readonly<WorkflowEvent<CourseUnitAudioWorkflowParams>>,
    step: WorkflowStep,
  ) {
    const { courseId } = event.payload;

    if (!courseId) {
      throw new Error('Course ID is required to run the unit audio workflow');
    }

    const options = resolveCourseAiOptions(
      event.payload.provider,
      event.payload.model,
    );
    const voiceOptions = resolveGoogleTtsVoiceOptions({
      languageCode: event.payload.languageCode,
      ssmlGender: event.payload.ssmlGender,
      voiceName: event.payload.voiceName,
      speakingRate: event.payload.speakingRate,
      pitch: event.payload.pitch,
    });

    console.log('Running course unit audio workflow for course', courseId);

    const units = await step.do('load units for audio workflow', async () => {
      const course = await getCourseById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      return course.modules.flatMap<WorkflowUnit>((module) =>
        module.units.map((unit) => ({
          id: unit.id,
          title: unit.title,
          audioUrl: unit.audioUrl ?? null,
        })),
      );
    });

    console.log('Units for audio workflow loaded');
    for (const [unitIndex, unit] of units.entries()) {
      await step.do(`generate audio script for unit ${unitIndex + 1}`, () => {
        return generateUnitAudioScriptForUnit(unit.id, options);
      });

      console.log('Audio script generated for unit', unit.id);

      if (unit.audioUrl?.trim()) {
        continue;
      }

      await step.do(`generate audio for unit ${unitIndex + 1}`, () => {
        return generateUnitAudioForUnit(unit.id, voiceOptions);
      });

      console.log('Audio generated for unit', unit.id);
    }

    console.log('Course unit audio workflow completed');

    return {
      success: true,
      courseId,
      unitsProcessed: units.length,
      provider: options.provider,
      model: options.model,
      voiceOptions,
    };
  }
}
