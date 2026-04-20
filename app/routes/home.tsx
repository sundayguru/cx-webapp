import React from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Zap,
  ChevronRight,
  ArrowRight,
  PlayCircle,
  Users,
  Brain,
  ChartLine,
  User,
} from 'lucide-react';
import { useUser } from '~/utils/useUser';
import { Link } from 'react-router';

export default function LandingPage() {
  const { user } = useUser();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className='min-h-screen overflow-x-hidden bg-[#f5f5f0]'>
      {/* Hero Section */}
      <section className='relative px-4 pt-20 pb-32'>
        <div className='mx-auto max-w-7xl'>
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            className='text-center'
          >
            <motion.div
              variants={itemVariants}
              className='mb-8 inline-flex items-center gap-2 rounded-full bg-[#5A5A40]/10 px-4 py-2 text-sm font-bold text-[#5A5A40]'
            >
              <Sparkles size={16} />
              <span>AI-Powered Learning Revolution</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className='mb-8 font-serif text-6xl leading-tight tracking-tight text-[#1a1a1a] md:text-8xl'
            >
              Illuminate Your <br />
              <span className='text-[#5A5A40] italic'>Path to Knowledge</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className='mx-auto mb-12 max-w-2xl font-serif text-xl leading-relaxed text-black/60'
            >
              CourseXQuiz transforms raw materials into immersive learning
              experiences. Upload a PDF, and watch as our AI crafts a
              personalized curriculum, quizzes, and narrations.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className='flex flex-col items-center justify-center gap-6 sm:flex-row'
            >
              <Link
                to={user?.id ? '/dashboard' : '/auth/register'}
                className='group flex items-center gap-3 rounded-2xl bg-[#5A5A40] px-10 py-5 text-lg font-bold text-white shadow-2xl shadow-[#5A5A40]/30 transition-all hover:bg-[#4a4a35]'
              >
                {user?.id ? 'Go to Dashboard' : 'Start Learning for Free'}
                <ArrowRight className='transition-transform group-hover:translate-x-1' />
              </Link>
              <Link to={"/auth/login"} className='flex items-center gap-3 font-bold text-[#1a1a1a] transition-colors hover:text-[#5A5A40]'>
                <User size={24} />
                Login
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Abstract Background Elements */}
        <div className='absolute top-1/2 left-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5A5A40]/5 blur-3xl' />
        <div className='absolute right-0 bottom-0 h-[500px] w-[500px] translate-x-1/4 rounded-full bg-[#5A5A40]/5 blur-3xl' />
      </section>

      {/* Feature Grid */}
      <section className='rounded-[64px] bg-white py-32 shadow-sm'>
        <div className='mx-auto max-w-7xl px-4'>
          <div className='mb-20 text-center'>
            <h2 className='mb-6 font-serif text-4xl text-[#1a1a1a] md:text-5xl'>
              Crafted for Modern Learners
            </h2>
            <p className='font-serif text-black/40 italic'>
              Everything you need to master any subject.
            </p>
          </div>

          <div className='grid grid-cols-1 gap-12 md:grid-cols-3'>
            {[
              {
                title: 'Instant Curriculum',
                desc: 'Upload any PDF and get a structured course with modules and units in seconds.',
                icon: BookOpen,
                color: 'bg-blue-50 text-blue-600',
              },
              {
                title: 'AI Narrations',
                desc: 'Listen to your course materials with high-quality, natural AI voices.',
                icon: Zap,
                color: 'bg-orange-50 text-orange-600',
              },
              {
                title: 'Smart Quizzing',
                desc: 'Reinforce your knowledge with AI-generated quizzes tailored to your content.',
                icon: Sparkles,
                color: 'bg-purple-50 text-purple-600',
              },
              {
                title: 'Community First',
                desc: 'Share your courses and join discussions in our vibrant learning community.',
                icon: Users,
                color: 'bg-green-50 text-green-600',
              },
              {
                title: 'Learning & Exam mode',
                desc: 'Practice at your own pace with instant feedback and test your knowledge under exam conditions with timed assessments and realistic simulation.',
                icon: Brain,
                color: 'bg-red-50 text-red-600',
              },
               {
                title: 'Progress Tracking',
                desc: 'Monitor your improvement with detailed analytics and AI-powered performance insights.',
                icon: ChartLine,
                color: 'bg-indigo-50 text-indigo-600',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className='group rounded-[32px] border border-black/5 p-8 transition-all hover:border-[#5A5A40]/20 hover:bg-[#f5f5f0]/30'
              >
                <div
                  className={`${
                    feature.color
                  } mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110`}
                >
                  <feature.icon size={28} />
                </div>
                <h3 className='mb-4 text-xl font-bold text-[#1a1a1a]'>
                  {feature.title}
                </h3>
                <p className='font-serif leading-relaxed text-black/50 italic'>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Split Layout Section */}
      <section className='px-4 py-32'>
        <div className='mx-auto grid max-w-7xl grid-cols-1 items-center gap-20 lg:grid-cols-2'>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className='mb-8 font-serif text-5xl leading-tight text-[#1a1a1a]'>
              Transform Static PDFs into <br />
              <span className='text-[#5A5A40] italic'>
                Interactive Journeys
              </span>
            </h2>
            <div className='space-y-8'>
              {[
                'Extract key concepts automatically',
                'Generate summaries and takeaways',
                'Chat with your course material',
                'Track progress and earn certificates',
              ].map((item, i) => (
                <div key={i} className='flex items-center gap-4'>
                  <div className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#5A5A40]'>
                    <ChevronRight size={14} className='text-white' />
                  </div>
                  <span className='font-serif text-lg text-black/70 italic'>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className='relative'
          >
            <div className='rounded-[40px] border border-black/5 bg-white p-4 shadow-2xl'>
              <img
                src='https://picsum.photos/seed/learning/1200/800'
                className='w-full rounded-[32px]'
                alt='App Preview'
              />
            </div>
            {/* Floating UI Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className='absolute -top-10 -right-10 hidden rounded-3xl bg-[#5A5A40] p-6 text-white shadow-xl md:block'
            >
              <Sparkles className='mb-2' />
              <p className='font-bold'>AI Analysis Complete</p>
              <p className='text-xs text-white/60'>12 Units Generated</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='px-4 py-32'>
        <div className='relative mx-auto max-w-5xl overflow-hidden rounded-[64px] bg-[#1a1a1a] p-12 text-center md:p-24'>
          <div className='relative z-10'>
            <h2 className='mb-8 font-serif text-5xl text-white md:text-6xl'>
              Ready to start your journey?
            </h2>
            <p className='mx-auto mb-12 max-w-2xl font-serif text-xl text-white/60 italic'>
              Join thousands of learners who are already illuminating their path
              to knowledge with CourseXQuiz.
            </p>
            <Link
              to='/auth/register'
              className='group flex inline-flex items-center gap-3 rounded-2xl bg-white px-12 py-6 text-xl font-bold text-[#1a1a1a] shadow-xl transition-all hover:bg-[#f5f5f0]'
            >
              Get Started Now
              <ChevronRight className='transition-transform group-hover:translate-x-1' />
            </Link>
          </div>
          {/* Decorative background */}
          <div className='absolute top-0 right-0 h-96 w-96 rounded-full bg-[#5A5A40]/20 blur-3xl' />
          <div className='absolute bottom-0 left-0 h-96 w-96 rounded-full bg-[#5A5A40]/10 blur-3xl' />
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-black/5 py-20'>
        <div className='mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 md:flex-row'>
          <div className='flex items-center gap-2'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-[#5A5A40]'>
              <GraduationCap className='text-white' size={24} />
            </div>
            <span className='font-serif text-xl font-bold text-[#1a1a1a]'>
              Lumina
            </span>
          </div>
          <div className='flex gap-12 text-sm font-bold tracking-widest text-black/40 uppercase'>
            <a href='#' className='transition-colors hover:text-[#5A5A40]'>
              Privacy
            </a>
            <a href='#' className='transition-colors hover:text-[#5A5A40]'>
              Terms
            </a>
            <a href='#' className='transition-colors hover:text-[#5A5A40]'>
              Contact
            </a>
          </div>
          <p className='text-sm text-black/20'>
            © 2026 Lumina Learning. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
