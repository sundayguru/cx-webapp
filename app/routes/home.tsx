import React from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  Zap, 
  Shield, 
  ChevronRight,
  ArrowRight,
  PlayCircle,
  Users,
  Globe
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
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-[#f5f5f0] min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5A5A40]/10 rounded-full text-[#5A5A40] text-sm font-bold mb-8"
            >
              <Sparkles size={16} />
              <span>AI-Powered Learning Revolution</span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-6xl md:text-8xl font-serif text-[#1a1a1a] mb-8 leading-tight tracking-tight"
            >
              Illuminate Your <br />
              <span className="italic text-[#5A5A40]">Path to Knowledge</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl text-black/60 max-w-2xl mx-auto mb-12 font-serif leading-relaxed"
            >
              Lumina transforms raw materials into immersive learning experiences. 
              Upload a PDF, and watch as our AI crafts a personalized curriculum, 
              quizzes, and narrations just for you.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link 
                to={user ? "/dashboard" : "/auth"}
                className="bg-[#5A5A40] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-[#4a4a35] transition-all shadow-2xl shadow-[#5A5A40]/30 flex items-center gap-3 group"
              >
                {user ? "Go to Dashboard" : "Start Learning for Free"}
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="flex items-center gap-3 text-[#1a1a1a] font-bold hover:text-[#5A5A40] transition-colors">
                <PlayCircle size={24} />
                Watch Demo
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-[#5A5A40]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 translate-x-1/4 w-[500px] h-[500px] bg-[#5A5A40]/5 rounded-full blur-3xl" />
      </section>

      {/* Feature Grid */}
      <section className="py-32 bg-white rounded-[64px] shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif text-[#1a1a1a] mb-6">Crafted for Modern Learners</h2>
            <p className="text-black/40 font-serif italic">Everything you need to master any subject.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Instant Curriculum",
                desc: "Upload any PDF and get a structured course with modules and units in seconds.",
                icon: BookOpen,
                color: "bg-blue-50 text-blue-600"
              },
              {
                title: "AI Narrations",
                desc: "Listen to your course materials with high-quality, natural AI voices.",
                icon: Zap,
                color: "bg-orange-50 text-orange-600"
              },
              {
                title: "Smart Quizzing",
                desc: "Reinforce your knowledge with AI-generated quizzes tailored to your content.",
                icon: Sparkles,
                color: "bg-purple-50 text-purple-600"
              },
              {
                title: "Community First",
                desc: "Share your courses and join discussions in our vibrant learning community.",
                icon: Users,
                color: "bg-green-50 text-green-600"
              },
              {
                title: "Global Access",
                desc: "Learn anywhere, anytime. Your progress is synced across all your devices.",
                icon: Globe,
                color: "bg-indigo-50 text-indigo-600"
              },
              {
                title: "Secure & Private",
                desc: "Your data and materials are protected with enterprise-grade security.",
                icon: Shield,
                color: "bg-red-50 text-red-600"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[32px] border border-black/5 hover:border-[#5A5A40]/20 hover:bg-[#f5f5f0]/30 transition-all group"
              >
                <div className={feature.color + " w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#1a1a1a] mb-4">{feature.title}</h3>
                <p className="text-black/50 leading-relaxed font-serif italic">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Split Layout Section */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-serif text-[#1a1a1a] mb-8 leading-tight">
              Transform Static PDFs into <br />
              <span className="text-[#5A5A40] italic">Interactive Journeys</span>
            </h2>
            <div className="space-y-8">
              {[
                "Extract key concepts automatically",
                "Generate summaries and takeaways",
                "Chat with your course material",
                "Track progress and earn certificates"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#5A5A40] flex items-center justify-center flex-shrink-0">
                    <ChevronRight size={14} className="text-white" />
                  </div>
                  <span className="text-lg text-black/70 font-serif italic">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white p-4 rounded-[40px] shadow-2xl border border-black/5">
              <img 
                src="https://picsum.photos/seed/learning/1200/800" 
                className="rounded-[32px] w-full"
                alt="App Preview"
              />
            </div>
            {/* Floating UI Elements */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-10 -right-10 bg-[#5A5A40] text-white p-6 rounded-3xl shadow-xl hidden md:block"
            >
              <Sparkles className="mb-2" />
              <p className="font-bold">AI Analysis Complete</p>
              <p className="text-xs text-white/60">12 Units Generated</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto bg-[#1a1a1a] rounded-[64px] p-12 md:p-24 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-5xl md:text-6xl font-serif text-white mb-8">Ready to start your journey?</h2>
            <p className="text-white/60 text-xl mb-12 max-w-2xl mx-auto font-serif italic">
              Join thousands of learners who are already illuminating their path to knowledge with Lumina.
            </p>
            <Link 
              to="/auth/register"
              className="inline-flex bg-white text-[#1a1a1a] px-12 py-6 rounded-2xl font-bold text-xl hover:bg-[#f5f5f0] transition-all shadow-xl flex items-center gap-3 group"
            >
              Get Started Now
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#5A5A40]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#5A5A40]/10 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-black/5">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center">
              <GraduationCap className="text-white" size={24} />
            </div>
            <span className="text-xl font-serif font-bold text-[#1a1a1a]">Lumina</span>
          </div>
          <div className="flex gap-12 text-sm font-bold text-black/40 uppercase tracking-widest">
            <a href="#" className="hover:text-[#5A5A40] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#5A5A40] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#5A5A40] transition-colors">Contact</a>
          </div>
          <p className="text-black/20 text-sm">© 2026 Lumina Learning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
