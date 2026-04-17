import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Video,
  X,
  ChevronRight,
  List,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type PlaylistItem = {
  id: string;
  title: string;
  moduleTitle: string;
  audioUrl?: string | null;
  videoUrl?: string | null;
};

type CoursePlaylistProps = {
  items: PlaylistItem[];
  isOpen: boolean;
  onClose: () => void;
};

export const CoursePlaylist = ({
  items,
  isOpen,
  onClose,
}: CoursePlaylistProps) => {
  const [mode, setMode] = useState<'audio' | 'video'>('audio');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);

  const playlistItems = items.filter((item) =>
    mode === 'audio' ? item.audioUrl : item.videoUrl,
  );

  const currentItem = playlistItems[currentIndex];
  const currentMediaUrl =
    mode === 'audio' ? currentItem?.audioUrl : currentItem?.videoUrl;

  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
    setProgress(0);
  }, [mode]);

  useEffect(() => {
    if (isPlaying && mediaRef.current) {
      mediaRef.current.play().catch(() => setIsPlaying(false));
    } else if (mediaRef.current) {
      mediaRef.current.pause();
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (mediaRef.current && mediaRef.current.duration) {
      setProgress(
        (mediaRef.current.currentTime / mediaRef.current.duration) * 100,
      );
    }
  };

  const handleEnded = () => {
    if (currentIndex < playlistItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
      setCurrentIndex(0);
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const skipNext = () => {
    if (currentIndex < playlistItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const skipBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mediaRef.current || !mediaRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    mediaRef.current.currentTime = percentage * mediaRef.current.duration;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8'
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className='relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl'
        >
          <div className='flex items-center justify-between border-b border-black/5 bg-[#faf9f4] px-6 py-4'>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2 rounded-xl bg-black/5 p-1'>
                <button
                  onClick={() => setMode('audio')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    mode === 'audio'
                      ? 'bg-white text-[#1a1a1a] shadow-sm'
                      : 'text-black/40'
                  }`}
                >
                  <Volume2 size={16} />
                  Audio
                </button>
                <button
                  onClick={() => setMode('video')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    mode === 'video'
                      ? 'bg-white text-[#1a1a1a] shadow-sm'
                      : 'text-black/40'
                  }`}
                >
                  <Video size={16} />
                  Video
                </button>
              </div>
              <span className='text-sm text-black/40'>
                {playlistItems.length} items
              </span>
            </div>
            <button
              onClick={onClose}
              className='flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/40 transition-all hover:bg-black/5 hover:text-black/60'
            >
              <X size={20} />
            </button>
          </div>

          <div className='flex flex-1 overflow-hidden'>
            <div className='flex flex-1 flex-col'>
              {currentMediaUrl ? (
                <div className='relative flex flex-1 items-center justify-center bg-black'>
                  {mode === 'audio' ? (
                    <div className='flex w-full flex-col items-center justify-center bg-gradient-to-b from-[#1a1a1a] to-black p-8'>
                      <div className='mb-8 flex h-40 w-40 items-center justify-center rounded-full bg-[#5A5A40] shadow-2xl shadow-[#5A5A40]/30'>
                        <Volume2 size={64} className='text-white' />
                      </div>
                      <audio
                        ref={mediaRef as React.RefObject<HTMLAudioElement>}
                        src={currentMediaUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleEnded}
                        onLoadedMetadata={() => {
                          if (isPlaying && mediaRef.current) {
                            mediaRef.current.play().catch(() => {});
                          }
                        }}
                        className='hidden'
                      />
                      <div className='w-full max-w-xl'>
                        <div className='mb-2 flex items-center justify-between'>
                          <span className='text-sm font-medium text-white'>
                            {currentItem?.title}
                          </span>
                          <span className='text-xs text-white/40'>
                            {currentIndex + 1} / {playlistItems.length}
                          </span>
                        </div>
                        <div
                          onClick={handleSeek}
                          className='h-2 cursor-pointer rounded-full bg-white/20'
                        >
                          <div
                            className='h-full rounded-full bg-[#5A5A40] transition-all'
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={mediaRef as React.RefObject<HTMLVideoElement>}
                        src={currentMediaUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleEnded}
                        onLoadedMetadata={() => {
                          if (isPlaying && mediaRef.current) {
                            mediaRef.current.play().catch(() => {});
                          }
                        }}
                        className='aspect-video w-full max-w-3xl'
                        controls
                      />
                    </>
                  )}
                </div>
              ) : (
                <div className='flex flex-1 items-center justify-center bg-black'>
                  <div className='text-center text-white/40'>
                    <p>No {mode} available for this course</p>
                  </div>
                </div>
              )}

              <div className='flex items-center justify-center gap-4 border-t border-black/5 bg-white px-6 py-4'>
                <button
                  onClick={skipBack}
                  disabled={currentIndex === 0}
                  className='flex h-12 w-12 items-center justify-center rounded-full border border-black/10 text-black/40 transition-all hover:bg-black/5 disabled:opacity-30'
                >
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={!currentMediaUrl}
                  className='flex h-16 w-16 items-center justify-center rounded-full bg-[#5A5A40] text-white transition-all hover:bg-[#4a4a35] disabled:opacity-30'
                >
                  {isPlaying ? (
                    <Pause size={28} />
                  ) : (
                    <Play size={28} fill='currentColor' />
                  )}
                </button>
                <button
                  onClick={skipNext}
                  disabled={currentIndex >= playlistItems.length - 1}
                  className='flex h-12 w-12 items-center justify-center rounded-full border border-black/10 text-black/40 transition-all hover:bg-black/5 disabled:opacity-30'
                >
                  <SkipForward size={20} />
                </button>
              </div>
            </div>

            <div className='w-72 border-l border-black/5 bg-[#faf9f4]'>
              <div className='border-b border-black/5 px-4 py-3'>
                <h3 className='text-sm font-bold text-[#1a1a1a]'>
                  <List size={14} className='mr-2 inline' />
                  Playlist
                </h3>
              </div>
              <div className='max-h-[calc(100vh-400px)] overflow-y-auto'>
                {playlistItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsPlaying(true);
                    }}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-all hover:bg-black/5 ${
                      index === currentIndex ? 'bg-[#5A5A40]/10' : ''
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs ${
                        index === currentIndex
                          ? 'bg-[#5A5A40] text-white'
                          : 'bg-black/10 text-black/40'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className='min-w-0 flex-1'>
                      <p
                        className={`truncate text-sm ${
                          index === currentIndex
                            ? 'font-medium text-[#5A5A40]'
                            : 'text-[#1a1a1a]'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className='truncate text-xs text-black/40'>
                        {item.moduleTitle}
                      </p>
                    </div>
                    {index === currentIndex && isPlaying && (
                      <span className='flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#5A5A40]' />
                    )}
                  </button>
                ))}
                {playlistItems.length === 0 && (
                  <div className='px-4 py-8 text-center text-sm text-black/40'>
                    No {mode} content available
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
