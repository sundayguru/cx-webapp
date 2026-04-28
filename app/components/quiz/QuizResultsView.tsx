import { motion } from 'motion/react';
import { CheckCircle, RotateCcw, XCircle } from 'lucide-react';
import type { SelectQuiz } from '~/db/schemas/quizzes';
import {
  getQuizDisplayAnswer,
  isQuizAnswerCorrect,
} from '~/utils/quiz-session';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type QuizResultsViewProps = {
  quizzes: SelectQuiz[];
  userAnswers: (string | null)[];
  mode: 'learning' | 'exam';
  onClose: () => void;
  onRetry: () => void;
};

const parseQuizOptions = (options: string | null) => {
  if (!options) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(options) as unknown;
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

export const QuizResultsView = ({
  quizzes,
  userAnswers,
  mode,
  onClose,
  onRetry,
}: QuizResultsViewProps) => {
  const resultRows = quizzes.map((quiz, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = isQuizAnswerCorrect(quiz, userAnswer);

    return {
      quiz,
      userAnswer,
      isCorrect,
    };
  });

  const correctAnswers = resultRows.filter((result) => result.isCorrect).length;
  const score =
    quizzes.length > 0 ? (correctAnswers / quizzes.length) * 100 : 0;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 backdrop-blur-sm md:p-4'>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        className='flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-h-[90vh] md:rounded-[32px]'
      >
        <div className='border-b border-black/5 bg-[#faf9f4] px-4 py-5 md:px-8 md:py-6'>
          <p className='text-[11px] font-bold tracking-[0.24em] text-[#5A5A40] uppercase'>
            {mode === 'learning' ? 'Learning Recap' : 'Exam Results'}
          </p>
          <h2 className='mt-2 font-serif text-3xl text-[#1a1a1a] md:text-4xl'>
            {Math.round(score)}%
          </h2>
          <p className='mt-2 text-sm text-black/55'>
            You answered {correctAnswers} out of {quizzes.length} questions
            correctly.
          </p>
        </div>

        <div className='flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-8 md:py-6'>
          {resultRows.map(({ quiz, userAnswer, isCorrect }, index) => {
            const options = parseQuizOptions(quiz.options);

            return (
              <article
                key={quiz.id}
                className='rounded-[24px] border border-black/5 bg-white p-4 shadow-sm md:rounded-[28px] md:p-6'
              >
                <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
                  <div>
                    <p className='text-xs font-bold tracking-wide text-black/35 uppercase'>
                      Question {index + 1}
                    </p>
                    <div className='mt-2 text-lg font-semibold text-[#1a1a1a]'>
                      <Markdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {quiz.question}
                      </Markdown>
                    </div>
                  </div>
                  <span
                    className={[
                      'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase',
                      isCorrect
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700',
                    ].join(' ')}
                  >
                    {isCorrect ? (
                      <CheckCircle size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}
                    {isCorrect ? 'Correct' : 'Needs Review'}
                  </span>
                </div>

                {quiz.questionType === 'choice' && options.length > 0 ? (
                  <div className='space-y-2'>
                    {options.map((option, optionIndex) => {
                      const isCorrectOption =
                        option === getQuizDisplayAnswer(quiz);
                      const isSelected = userAnswer === option;

                      return (
                        <div
                          key={`${quiz.id}-${optionIndex}`}
                          className={[
                            'rounded-2xl border px-4 py-3 text-sm',
                            isCorrectOption
                              ? 'border-green-300 bg-green-50 text-green-900'
                              : isSelected
                                ? 'border-red-200 bg-red-50 text-red-900'
                                : 'border-black/10 bg-[#faf9f4] text-black/65',
                          ].join(' ')}
                        >
                          <Markdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {option}
                          </Markdown>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <div className='mt-5 grid gap-3 md:grid-cols-2'>
                  <div className='rounded-2xl border border-black/10 bg-[#faf9f4] p-4'>
                    <p className='text-xs font-bold tracking-wide text-black/35 uppercase'>
                      Your Answer
                    </p>
                    <div className='mt-2 text-sm leading-6 text-[#1a1a1a]'>
                      <Markdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {userAnswer?.trim()
                          ? userAnswer
                          : 'No answer submitted'}
                      </Markdown>
                    </div>
                  </div>
                  <div className='rounded-2xl border border-green-200 bg-green-50 p-4'>
                    <p className='text-xs font-bold tracking-wide text-green-700 uppercase'>
                      Correct Answer
                    </p>
                    <div className='mt-2 text-sm leading-6 text-green-950'>
                      <Markdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {getQuizDisplayAnswer(quiz)}
                      </Markdown>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className='border-t border-black/5 bg-white px-4 py-4 md:px-8 md:py-5'>
          <div className='flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'>
            <button
              onClick={onClose}
              className='w-full rounded-2xl border border-black/10 px-5 py-3 text-sm font-medium text-black/60 transition-all hover:bg-black/5 sm:w-auto'
            >
              Close
            </button>
            <button
              onClick={onRetry}
              className='inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5A5A40] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#4a4a35] sm:w-auto'
            >
              <RotateCcw size={16} />
              Retry Quiz
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
