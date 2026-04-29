import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, ChevronRight, Clock, X } from 'lucide-react';
import type { SelectQuiz } from '~/db/schemas/quizzes';
import {
  getQuizDisplayAnswer,
  isQuizAnswerCorrect,
} from '~/utils/quiz-session';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import * as analytics from '~/utils/analytics';

type QuizTakerViewProps = {
  quizzes: SelectQuiz[];
  mode: 'learning' | 'exam';
  timerEnabled: boolean;
  currentIndex: number;
  userAnswers: (string | null)[];
  onAnswer: (answer: string) => void;
  onNext: () => void;
  onFinish: () => void;
  onClose: () => void;
};

const QUESTION_TIMER_SECONDS = 30;

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

export const QuizTakerView = ({
  quizzes,
  mode,
  timerEnabled,
  currentIndex,
  userAnswers,
  onAnswer,
  onNext,
  onFinish,
  onClose,
}: QuizTakerViewProps) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(QUESTION_TIMER_SECONDS);
  const [showAnswerWarning, setShowAnswerWarning] = useState(false);

  const currentQuiz = quizzes[currentIndex];
  const currentAnswer = userAnswers[currentIndex] ?? '';
  const isLastQuestion = currentIndex === quizzes.length - 1;
  const isLearningMode = mode === 'learning';
  const hasAnswer = currentAnswer.trim().length > 0;
  const isOpenTextQuestion = currentQuiz?.questionType === 'openText';
  const isOpenTextCorrect =
    isOpenTextQuestion &&
    isRevealed &&
    isQuizAnswerCorrect(currentQuiz, currentAnswer);
  const options = useMemo(
    () => parseQuizOptions(currentQuiz?.options ?? null),
    [currentQuiz?.options],
  );

  useEffect(() => {
    if (!timerEnabled || timeRemaining <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTimeRemaining((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [timeRemaining, timerEnabled]);

  useEffect(() => {
    if (currentIndex === 0) {
      analytics.trackQuizStart(
        quizzes[0]?.question?.substring(0, 50) || 'Unknown Quiz',
      );
    }
  }, [currentIndex, quizzes]);

  useEffect(() => {
    if (!timerEnabled || timeRemaining > 0) {
      return;
    }

    if (isLastQuestion) {
      onFinish();
      return;
    }

    onNext();
  }, [isLastQuestion, onFinish, onNext, timeRemaining, timerEnabled]);

  if (!currentQuiz) {
    return null;
  }

  const handlePrimaryAction = () => {
    if (mode === 'exam' && !hasAnswer) {
      setShowAnswerWarning(true);
      return;
    }

    if (isLearningMode && !isRevealed) {
      setIsRevealed(true);
      return;
    }

    setShowAnswerWarning(false);

    if (isLastQuestion) {
      analytics.trackQuizFinish(
        quizzes[0]?.question?.substring(0, 50) || 'Unknown Quiz',
        0, // We don't have the final score here, maybe we should track it elsewhere if we have it
      );
      onFinish();
      return;
    }

    onNext();
  };

  const primaryLabel = isLearningMode
    ? isRevealed
      ? isLastQuestion
        ? 'See Results'
        : 'Next Question'
      : 'Check Answer'
    : isLastQuestion
      ? 'Finish Quiz'
      : 'Next Question';

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 backdrop-blur-sm md:p-4'>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        className='flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-h-[90vh] md:rounded-[32px]'
      >
        <div className='border-b border-black/5 bg-[#faf9f4] px-4 py-4 md:px-8 md:py-5'>
          <div className='flex items-start justify-between gap-3 md:gap-4'>
            <div>
              <p className='text-[11px] font-bold tracking-[0.24em] text-[#5A5A40] uppercase'>
                {mode === 'learning' ? 'Learning Mode' : 'Exam Mode'}
              </p>
              <h2 className='mt-2 font-serif text-2xl text-[#1a1a1a] md:text-3xl'>
                Quiz in Progress
              </h2>
              <div className='mt-3 flex flex-wrap items-center gap-3 text-sm text-black/50'>
                <span>
                  Question {currentIndex + 1} of {quizzes.length}
                </span>
                {timerEnabled ? (
                  <span className='inline-flex items-center gap-2 rounded-full bg-[#5A5A40]/10 px-3 py-1 text-[#5A5A40]'>
                    <Clock size={14} />
                    {timeRemaining}s left
                  </span>
                ) : null}
              </div>
            </div>

            <button
              onClick={onClose}
              className='flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/45 transition-colors hover:bg-black/5 hover:text-black'
            >
              <X size={18} />
            </button>
          </div>

          <div className='mt-5 h-2 overflow-hidden rounded-full bg-black/5'>
            <div
              className='h-full rounded-full bg-[#5A5A40] transition-all duration-300'
              style={{
                width: `${((currentIndex + 1) / quizzes.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className='flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-8'>
          <div className='rounded-[24px] border border-black/5 bg-white p-4 shadow-sm md:rounded-[28px] md:p-8'>
            <div className='mb-5 inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-bold tracking-wide text-black/50 uppercase'>
              {currentQuiz.questionType === 'choice'
                ? 'Multiple Choice'
                : 'Open Response'}
            </div>

            <div className='text-xl leading-tight font-semibold text-[#1a1a1a] md:text-2xl'>
              <Markdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {currentQuiz.question}
              </Markdown>
            </div>

            <div className='mt-8'>
              {currentQuiz.questionType === 'choice' ? (
                <div className='space-y-3'>
                  {options.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index);
                    const isSelected = currentAnswer === option;
                    const correctAnswer = getQuizDisplayAnswer(currentQuiz);
                    const isCorrectOption =
                      isRevealed && option === correctAnswer;
                    const isWrongSelection =
                      isRevealed && isSelected && option !== correctAnswer;

                    return (
                      <button
                        key={`${currentQuiz.id}-${optionLetter}`}
                        onClick={() => {
                          setShowAnswerWarning(false);
                          onAnswer(option);
                        }}
                        className={[
                          'flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all md:gap-4',
                          isCorrectOption
                            ? 'border-green-400 bg-green-50'
                            : isWrongSelection
                              ? 'border-red-300 bg-red-50'
                              : isSelected
                                ? 'border-[#5A5A40] bg-[#5A5A40]/5'
                                : 'border-black/10 hover:border-black/20 hover:bg-black/[0.02]',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                            isCorrectOption
                              ? 'bg-green-500 text-white'
                              : isWrongSelection
                                ? 'bg-red-500 text-white'
                                : isSelected
                                  ? 'bg-[#5A5A40] text-white'
                                  : 'bg-black/5 text-black/55',
                          ].join(' ')}
                        >
                          {optionLetter}
                        </span>
                        <div className='pt-1 text-base text-[#1a1a1a]'>
                          <Markdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {option}
                          </Markdown>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  value={currentAnswer}
                  onChange={(event) => {
                    setShowAnswerWarning(false);
                    onAnswer(event.target.value);
                  }}
                  placeholder='Write your answer here...'
                  className={[
                    'min-h-40 w-full rounded-[24px] border px-5 py-4 text-base transition outline-none',
                    isOpenTextQuestion && isRevealed
                      ? isOpenTextCorrect
                        ? 'border-green-300 bg-green-50 text-green-950 focus:border-green-500'
                        : 'border-red-300 bg-red-50 text-red-950 focus:border-red-500'
                      : 'border-black/10 bg-[#faf9f4] text-[#1a1a1a] focus:border-[#5A5A40]',
                  ].join(' ')}
                />
              )}
            </div>

            {mode === 'exam' && showAnswerWarning ? (
              <div className='mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800'>
                Answer this question before moving on.
              </div>
            ) : null}

            {isLearningMode && isRevealed && isOpenTextQuestion ? (
              <div
                className={[
                  'mt-4 rounded-2xl border px-4 py-3 text-sm font-medium',
                  isOpenTextCorrect
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-800',
                ].join(' ')}
              >
                {isOpenTextCorrect
                  ? 'Correct answer.'
                  : 'That answer is not correct yet.'}
              </div>
            ) : null}

            {isLearningMode && isRevealed ? (
              <div className='mt-6 rounded-[24px] border border-green-200 bg-green-50 p-5'>
                <div className='mb-2 flex items-center gap-2 text-green-700'>
                  <CheckCircle size={18} />
                  <p className='text-sm font-bold tracking-wide uppercase'>
                    Suggested Answer
                  </p>
                </div>
                <div className='text-sm leading-7 text-green-900'>
                  <Markdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {getQuizDisplayAnswer(currentQuiz)}
                  </Markdown>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className='border-t border-black/5 bg-white px-4 py-4 md:px-8 md:py-5'>
          <div className='flex justify-end gap-3'>
            <button
              onClick={handlePrimaryAction}
              className='inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5A5A40] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#4a4a35] sm:w-auto'
            >
              {primaryLabel}
              {!isLearningMode || isRevealed ? (
                <ChevronRight size={16} />
              ) : null}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
