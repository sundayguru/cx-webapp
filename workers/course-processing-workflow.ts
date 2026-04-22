import {
  type WorkflowEvent,
  WorkflowEntrypoint,
  type WorkflowStep,
} from 'cloudflare:workers';
import { getCourseById } from '~/db/courses';
import {
  DEFAULT_WORKFLOW_QUIZ_BATCH_SIZE,
  DEFAULT_WORKFLOW_QUIZ_DELAY_SECONDS,
  DEFAULT_WORKFLOW_QUIZ_TARGET,
  generateQuizBatchForUnit,
  generateUnitContentForUnit,
  resolveCourseAiOptions,
  splitCourseRawTextIntoModulesForCourse,
  splitModuleRawTextIntoUnitsForModule,
} from '~/utils/course-processing.server';

export type CourseProcessingWorkflowParams = {
  courseId: string;
  provider?: string;
  model?: string;
  quizTargetCount?: number;
  quizBatchSize?: number;
  quizDelaySeconds?: number;
};

type WorkflowUnit = {
  id: string;
  title: string;
  moduleTitle: string;
};

export class CourseProcessingWorkflow extends WorkflowEntrypoint<
  Env,
  CourseProcessingWorkflowParams
> {
  async run(
    event: Readonly<WorkflowEvent<CourseProcessingWorkflowParams>>,
    step: WorkflowStep,
  ) {
    const { courseId } = event.payload;

    if (!courseId) {
      throw new Error('Course ID is required to run the course workflow');
    }

    const options = resolveCourseAiOptions(
      event.payload.provider,
      event.payload.model,
    );
    const quizTargetCount =
      event.payload.quizTargetCount ?? DEFAULT_WORKFLOW_QUIZ_TARGET;
    const quizBatchSize =
      event.payload.quizBatchSize ?? DEFAULT_WORKFLOW_QUIZ_BATCH_SIZE;
    const quizDelaySeconds =
      event.payload.quizDelaySeconds ?? DEFAULT_WORKFLOW_QUIZ_DELAY_SECONDS;

    const splitResult = await step.do(
      'split course raw text into modules',
      async () => {
        return splitCourseRawTextIntoModulesForCourse(courseId);
      },
    );

    console.log('Course splitted into modules');

    for (const [moduleIndex, module] of splitResult.modules.entries()) {
      await step.do(
        `split module ${moduleIndex + 1} raw text into units`,
        async () => {
          return splitModuleRawTextIntoUnitsForModule(module.id);
        },
      );
      console.log(`Module ${moduleIndex + 1} splitted into units`);
    }

    const courseWithUnits = await step.do(
      'load course units for workflow',
      async () => {
        const course = await getCourseById(courseId);
        if (!course) {
          throw new Error(
            'Course not found after splitting modules into units',
          );
        }

        return course.modules.flatMap<WorkflowUnit>((module) =>
          module.units.map((unit) => ({
            id: unit.id,
            title: unit.title,
            moduleTitle: module.title,
          })),
        );
      },
    );

    for (const [unitIndex, unit] of courseWithUnits.entries()) {
      await step.do(`generate content for unit ${unitIndex + 1}`, async () => {
        return generateUnitContentForUnit(unit.id, options);
      });
      console.log(`Unit ${unitIndex + 1} content generated`);

      let totalCount = 0;
      let batchNumber = 0;

      while (totalCount < quizTargetCount) {
        batchNumber += 1;

        const quizBatch = await step.do(
          `generate quizzes for unit ${unitIndex + 1} batch ${batchNumber}`,
          async () => {
            return generateQuizBatchForUnit(unit.id, {
              ...options,
              maxNewQuizzes: quizBatchSize,
              maxTotalQuizzes: quizTargetCount,
            });
          },
        );

        totalCount = quizBatch.totalCount;
        console.log(`Unit ${unitIndex + 1} quizzes generated`);

        if (quizBatch.reachedTarget || totalCount >= quizTargetCount) {
          break;
        }

        console.log(
          `Waiting for ${quizDelaySeconds} seconds before next quiz batch`,
        );
        await step.sleep(
          `wait before unit ${unitIndex + 1} quiz batch ${batchNumber + 1}`,
          `${quizDelaySeconds} seconds`,
        );
      }
    }

    console.log('Course processing workflow completed');
    return {
      success: true,
      courseId,
      modulesCount: splitResult.modulesCount,
      unitsProcessed: courseWithUnits.length,
      provider: options.provider,
      model: options.model,
      quizTargetCount,
    };
  }
}
