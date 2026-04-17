import {
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  BookOpen,
  Zap,
} from 'lucide-react';

export type CourseProgressStats = {
  totalUnits: number;
  completedUnits: number;
  totalQuizzes: number;
  quizzesTaken: number;
  correctAnswers: number;
  totalQuestions: number;
  averageScore: number;
  totalTimeSpent: number;
};

type CourseProgressProps = {
  stats: CourseProgressStats;
};

export const CourseProgress = ({ stats }: CourseProgressProps) => {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className='rounded-[32px] border border-black/5 bg-white p-6 shadow-[0_25px_70px_-35px_rgba(0,0,0,0.18)]'>
      <h2 className='mb-6 flex items-center gap-3 font-serif text-2xl text-[#1a1a1a]'>
        <Trophy size={28} className='text-[#5A5A40]' />
        Your Progress
      </h2>

      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        <StatCard
          icon={<Target size={20} />}
          label='Average Score'
          value={`${stats.averageScore}%`}
          variant={stats.averageScore >= 70 ? 'success' : 'default'}
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label='Quizzes Taken'
          value={`${stats.quizzesTaken}/${stats.totalQuizzes}`}
        />
        <StatCard
          icon={<Clock size={20} />}
          label='Time Spent'
          value={formatTime(stats.totalTimeSpent)}
        />
        <StatCard
          icon={<Zap size={20} />}
          label='Correct Answers'
          value={`${stats.correctAnswers}/${stats.totalQuestions}`}
        />
      </div>

      {stats.quizzesTaken > 0 && (
        <div className='mt-6'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-black/40'>Quiz Completion</span>
            <span className='font-medium text-[#1a1a1a]'>
              {Math.round((stats.quizzesTaken / stats.totalQuizzes) * 100)}%
            </span>
          </div>
          <div className='mt-2 h-3 overflow-hidden rounded-full bg-black/5'>
            <div
              className='h-full rounded-full bg-[#5A5A40] transition-all'
              style={{
                width: `${Math.min((stats.quizzesTaken / stats.totalQuizzes) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant?: 'default' | 'success';
};

const StatCard = ({
  icon,
  label,
  value,
  variant = 'default',
}: StatCardProps) => (
  <div
    className={`rounded-[24px] border p-5 ${
      variant === 'success'
        ? 'border-green-200 bg-green-50'
        : 'border-black/5 bg-[#f7f6ef]'
    }`}
  >
    <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5A5A40] shadow-sm'>
      {icon}
    </div>
    <p className='text-xs font-bold tracking-[0.18em] text-black/35 uppercase'>
      {label}
    </p>
    <p className='mt-2 text-lg font-semibold text-[#1a1a1a]'>{value}</p>
  </div>
);
