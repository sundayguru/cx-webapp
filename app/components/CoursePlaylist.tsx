import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Video,
  X,
  List,
  ChevronUp,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getYouTubeEmbedUrl, isYouTubeUrl } from '~/utils/video';

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
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(true);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);

  const playlistItems = items.filter((item) =>
    mode === 'audio' ? item.audioUrl : item.videoUrl,
  );
  const safeCurrentIndex =
    currentIndex >= playlistItems.length && playlistItems.length > 0
      ? 0
      : currentIndex;

  const currentItem = playlistItems[safeCurrentIndex];
  const currentMediaUrl =
    mode === 'audio' ? currentItem?.audioUrl : currentItem?.videoUrl;
  const isYouTubeVideo =
    mode === 'video' && currentMediaUrl ? isYouTubeUrl(currentMediaUrl) : false;
  const currentYouTubeEmbedUrl =
    mode === 'video' && currentMediaUrl
      ? getYouTubeEmbedUrl(currentMediaUrl)
      : null;

  useEffect(() => {
    if (isYouTubeVideo && mediaRef.current) {
      mediaRef.current.pause();
      return;
    }

    if (isPlaying && mediaRef.current) {
      mediaRef.current.play().catch(() => setIsPlaying(false));
    } else if (mediaRef.current) {
      mediaRef.current.pause();
    }
  }, [isPlaying, isYouTubeVideo, safeCurrentIndex]);

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
    if (!mediaRef.current || !mediaRef.current.duration) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    mediaRef.current.currentTime = percentage * mediaRef.current.duration;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-[100] flex flex-col bg-black'
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className='flex flex-1 flex-col overflow-hidden'
        >
          <div className='flex items-center justify-between border-b border-white/10 bg-[#1a1a1a] px-4 py-3'>
            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-1 rounded-lg bg-white/10 p-1'>
                <button
                  onClick={() => {
                    setMode('audio');
                    setCurrentIndex(0);
                    setIsPlaying(false);
                    setProgress(0);
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    mode === 'audio' ? 'bg-white text-black' : 'text-white/60'
                  }`}
                >
                  <Volume2 size={14} />
                  <span className='hidden sm:inline'>Audio</span>
                </button>
                <button
                  onClick={() => {
                    setMode('video');
                    setCurrentIndex(0);
                    setIsPlaying(false);
                    setProgress(0);
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    mode === 'video' ? 'bg-white text-black' : 'text-white/60'
                  }`}
                >
                  <Video size={14} />
                  <span className='hidden sm:inline'>Video</span>
                </button>
              </div>
              <span className='text-xs text-white/40'>
                {playlistItems.length} items
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
                className='flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white/60 transition-all hover:bg-white/10'
              >
                <List size={16} />
                <ChevronUp
                  size={16}
                  className={`transition-transform ${
                    isPlaylistOpen ? '' : '-rotate-180'
                  }`}
                />
              </button>
              <button
                onClick={onClose}
                className='flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/60 transition-all hover:bg-white/10 hover:text-white'
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className='flex flex-1 flex-col overflow-hidden'>
            <div className='flex flex-1 flex-col'>
              {currentMediaUrl ? (
                <div className='relative flex flex-1 items-center justify-center bg-gradient-to-b from-[#2a2a2a] to-[#0a0a0a]'>
                  {mode === 'audio' ? (
                    <div className='flex w-full flex-col items-center justify-center p-6 sm:p-8'>
                      <div className='mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#5A5A40] shadow-2xl shadow-[#5A5A40]/30 sm:mb-8 sm:h-40 sm:w-40'>
                        <Volume2 size={40} className='text-white sm:size-16' />
                      </div>
                      <audio
                        ref={mediaRef as React.RefObject<HTMLAudioElement>}
                        src={currentMediaUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleEnded}
                        onLoadedMetadata={() => {
                          if (isPlaying && mediaRef.current) {
                            mediaRef.current.play().catch(() => undefined);
                          }
                        }}
                        className='hidden'
                      />
                      <div className='w-full max-w-xl px-4'>
                        <div className='mb-2 flex items-center justify-between'>
                          <span className='truncate text-base font-medium text-white'>
                            {currentItem?.title}
                          </span>
                          <span className='ml-4 text-xs text-white/40'>
                            {safeCurrentIndex + 1} / {playlistItems.length}
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
                    <div className='flex w-full items-center justify-center p-4'>
                      {currentYouTubeEmbedUrl ? (
                        <iframe
                          src={currentYouTubeEmbedUrl}
                          title={currentItem?.title || 'YouTube video'}
                          className='aspect-video w-full max-w-2xl rounded-lg'
                          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                          referrerPolicy='strict-origin-when-cross-origin'
                          allowFullScreen
                        />
                      ) : (
                        <video
                          ref={mediaRef as React.RefObject<HTMLVideoElement>}
                          src={currentMediaUrl}
                          onTimeUpdate={handleTimeUpdate}
                          onEnded={handleEnded}
                          onLoadedMetadata={() => {
                            if (isPlaying && mediaRef.current) {
                              mediaRef.current.play().catch(() => undefined);
                            }
                          }}
                          className='aspect-video w-full max-w-2xl rounded-lg'
                          controls
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex flex-1 items-center justify-center bg-gradient-to-b from-[#2a2a2a] to-[#0a0a0a] px-4'>
                  <div className='text-center text-white/40'>
                    <p className='text-sm sm:text-base'>
                      No {mode} available for this course
                    </p>
                  </div>
                </div>
              )}

              <div className='flex items-center justify-center gap-4 border-t border-white/10 bg-[#1a1a1a] px-6 py-4'>
                <button
                  onClick={skipBack}
                  disabled={safeCurrentIndex === 0}
                  className='flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white/60 transition-all hover:bg-white/10 disabled:opacity-30'
                >
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={!currentMediaUrl || isYouTubeVideo}
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
                  disabled={safeCurrentIndex >= playlistItems.length - 1}
                  className='flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white/60 transition-all hover:bg-white/10 disabled:opacity-30'
                >
                  <SkipForward size={20} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {isPlaylistOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className='overflow-hidden border-t border-white/10 bg-[#141414]'
                >
                  <PlaylistPanel
                    items={playlistItems}
                    currentIndex={safeCurrentIndex}
                    isPlaying={isPlaying}
                    onSelect={(index) => {
                      setCurrentIndex(index);
                      setIsPlaying(
                        !isYouTubeUrl(playlistItems[index]?.videoUrl || ''),
                      );
                      setProgress(0);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

type PlaylistPanelProps = {
  items: PlaylistItem[];
  currentIndex: number;
  isPlaying: boolean;
  onSelect: (index: number) => void;
};

const PlaylistPanel = ({
  items,
  currentIndex,
  isPlaying,
  onSelect,
}: PlaylistPanelProps) => (
  <div className='max-h-[40vh] overflow-y-auto'>
    {items.map((item, index) => (
      <button
        key={item.id}
        onClick={() => onSelect(index)}
        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-all hover:bg-white/5 ${
          index === currentIndex ? 'bg-white/10' : ''
        }`}
      >
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-medium ${
            index === currentIndex
              ? 'bg-[#5A5A40] text-white'
              : 'bg-white/10 text-white/40'
          }`}
        >
          {index + 1}
        </span>
        <div className='min-w-0 flex-1'>
          <p
            className={`truncate text-sm ${
              index === currentIndex
                ? 'font-medium text-[#5A5A40]'
                : 'text-white'
            }`}
          >
            {item.title}
          </p>
          <p className='truncate text-xs text-white/40'>{item.moduleTitle}</p>
        </div>
        {index === currentIndex && isPlaying && (
          <span className='flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#5A5A40]' />
        )}
      </button>
    ))}
    {items.length === 0 && (
      <div className='px-4 py-8 text-center text-sm text-white/40'>
        No items available
      </div>
    )}
  </div>
);
