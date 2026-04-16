import type { Route } from './+types/$id';
import { Link, type LoaderFunctionArgs } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { getCourseById } from '~/db/courses';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  CheckCircle,
  ChevronRight,
  MessageSquare,
  Users,
  BarChart,
  BookOpen,
  Globe,
  Edit3,
  HelpCircle,
  X,
  FileText,
  Clock
} from 'lucide-react';
import { useState } from 'react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return { data: null, user: null };
  }

  const courseId = (params as Record<string, string>).id;
  const data = await getCourseById(courseId);

  return { data, user };
};

export default function CourseDetailsPage({
  loaderData,
}: Route.ComponentProps) {
  const { data, user } = loaderData;
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  if (!data) {
    return (
      <div className='mx-auto max-w-4xl px-4 py-12'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-[40px] border border-black/5 bg-white p-12 text-center shadow-2xl'
        >
          <h1 className='mb-3 font-serif text-3xl text-[#1a1a1a]'>Course not found</h1>
          <p className='mb-8 text-black/60'>We couldn't find the course you're looking for.</p>
          <Link to='/courses' className='bg-[#5A5A40] text-white px-8 py-3 rounded-2xl font-bold'>
            Back to Courses
          </Link>
        </motion.div>
      </div>
    );
  }

  const { course, school, author, modules } = data;
  const isInstructor = user?.id === course.createdBy;
  const isDraft = course.status === 'pending';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
        <div className="lg:col-span-2">
          <nav className="flex items-center gap-2 text-sm text-black/40 mb-6">
            <Link to="/courses" className="hover:text-[#5A5A40] transition-colors">Courses</Link>
            <ChevronRight size={14} />
            <span className="text-black/60 truncate">{course.title}</span>
            {isDraft && (
              <span className="ml-4 px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded">Pending Review</span>
            )}
          </nav>

          <h1 className="text-5xl font-serif text-[#1a1a1a] mb-6 leading-tight">{course.title}</h1>
          <p className="text-xl text-black/60 font-serif italic mb-8 leading-relaxed">
            {course.description}
          </p>

          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-center gap-2 text-black/60">
              <Users size={20} />
              <span className="font-medium">24 Students</span>
            </div>
            <div className="flex items-center gap-2 text-black/60">
              <BarChart size={20} />
              <span className="font-medium">{course.level} Level</span>
            </div>
            <div className="flex items-center gap-2 text-black/60">
              <BookOpen size={20} />
              <span className="font-medium">{modules.length} Modules</span>
            </div>
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-2 text-[#5A5A40] font-bold hover:underline underline-offset-4"
            >
              <FileText size={20} />
              Read Course Content
            </button>
          </div>

          <div className="flex items-center gap-4 border-t border-black/5 pt-8 mt-8">
            {author && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#5A5A40]/10 flex items-center justify-center text-[#5A5A40]">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-black/40">Created by</p>
                  <p className="font-medium text-[#1a1a1a]">{author.name}</p>
                </div>
              </div>
            )}
            {school && (
              <div className="flex items-center gap-3 border-l border-black/5 pl-8">
                <div className="h-10 w-10 rounded-full bg-[#5A5A40]/10 flex items-center justify-center text-[#5A5A40]">
                  <Play size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-black/40">Institution</p>
                  <p className="font-medium text-[#1a1a1a]">{school.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-[32px] border border-black/5 shadow-xl sticky top-8 overflow-hidden">
            <div className="relative mb-6 rounded-2xl overflow-hidden group">
              <img
                src={course.thumbnailKey ? `/api/course/serve/${course.thumbnailKey}` : `https://picsum.photos/seed/${course.id}/600/400`}
                className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
                alt={course.title}
              />
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <Play size={24} fill="currentColor" />
                </div>
              </button>
            </div>

            {isInstructor ? (
              <div className="space-y-3">
                <button
                  className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4a4a35] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
                >
                  <Globe size={20} />
                  Course Settings
                </button>
                <button className="w-full border border-black/10 text-black/60 py-4 rounded-2xl font-bold text-lg hover:bg-black/5 transition-all flex items-center justify-center gap-2 active:scale-95">
                  <Edit3 size={20} />
                  Edit Course
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4a4a35] transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  Go to Course
                </button>
                <button
                  onClick={() => setIsPdfModalOpen(true)}
                  className="w-full border border-[#5A5A40] text-[#5A5A40] py-4 rounded-2xl font-bold text-lg hover:bg-[#5A5A40]/5 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <HelpCircle size={20} />
                  View Syllabus
                </button>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-black/50">
                <Clock size={16} />
                <span>Full lifetime access</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-black/50">
                <CheckCircle size={16} />
                <span>Certificate of completion</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-serif text-[#1a1a1a] mb-8">Course Curriculum</h2>
          <div className="space-y-4">
            {modules.map((module: any, mIdx: number) => (
              <div key={module.id} className="bg-white rounded-[24px] border border-black/5 overflow-hidden shadow-sm">
                <div className="p-6 bg-black/[0.01] border-b border-black/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-[#1a1a1a]">
                      Module {mIdx + 1}: {module.title}
                    </h3>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-black/30">{module.units.length} Units</span>
                </div>
                <div className="divide-y divide-black/5">
                  {module.units.map((unit: any, uIdx: number) => (
                    <div
                      key={unit.id}
                      className="p-4 flex items-center gap-4 hover:bg-black/[0.01] transition-colors group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-xs font-bold text-black/40 group-hover:bg-[#5A5A40] group-hover:text-white transition-all">
                        {uIdx + 1}
                      </div>
                      <span className="flex-1 font-medium text-[#1a1a1a] group-hover:text-[#5A5A40] transition-colors">{unit.title}</span>
                      <Play size={16} className="text-black/20 group-hover:text-[#5A5A40]" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <h2 className="text-3xl font-serif text-[#1a1a1a] mb-8">Community</h2>
          <div className="bg-white p-8 rounded-[24px] border border-black/5 shadow-md">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/100?u=${i + 10}`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" />
                ))}
              </div>
              <span className="text-sm text-black/60 font-medium">Join active discussions</span>
            </div>
            <button
              className="w-full flex items-center justify-center gap-2 py-4 border border-black/10 rounded-2xl font-bold hover:bg-black/5 transition-all active:scale-95"
            >
              <MessageSquare size={18} />
              Open Community Space
            </button>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      <AnimatePresence>
        {isPdfModalOpen && course.contentKey && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPdfModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl h-full bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-black/5 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4 text-[#5A5A40]">
                  <div className="h-10 w-10 rounded-xl bg-[#5A5A40]/10 flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1a1a1a] leading-tight">Course Content</h3>
                    <p className="text-xs text-black/40 uppercase tracking-widest font-bold">{course.code}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="h-10 w-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 bg-gray-100 p-4">
                <iframe
                  src={`/api/course/serve/${course.contentKey}`}
                  className="w-full h-full rounded-2xl border border-black/5 bg-white"
                  title={course.title}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
