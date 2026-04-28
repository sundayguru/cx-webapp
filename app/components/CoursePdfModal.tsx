import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, FileText, X } from 'lucide-react';

type CoursePdfModalProps = {
  isOpen: boolean;
  contentKey: string | null;
  code: string;
  title: string;
  onClose: () => void;
};

export const CoursePdfModal = ({
  isOpen,
  contentKey,
  code,
  title,
  onClose,
}: CoursePdfModalProps) => {
  const pdfUrl = contentKey ? `/api/course/serve/${contentKey}` : null;

  return (
    <AnimatePresence>
      {isOpen && pdfUrl ? (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='absolute inset-0 bg-black/80 backdrop-blur-sm'
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className='relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white shadow-2xl md:rounded-[40px]'
          >
            <div className='flex items-center justify-between border-b border-black/5 bg-white p-4 md:p-6'>
              <div className='flex items-center gap-3 text-[#5A5A40] md:gap-4'>
                <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-[#5A5A40]/10 md:h-10 md:w-10'>
                  <FileText size={18} className='md:size-5' />
                </div>
                <div className='min-w-0'>
                  <h3 className='truncate leading-tight font-bold text-[#1a1a1a]'>
                    Course Content
                  </h3>
                  <p className='text-[10px] font-bold tracking-widest text-black/40 uppercase md:text-xs'>
                    {code}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <a
                  href={pdfUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex h-9 w-9 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 md:h-10 md:w-10'
                  title='Open in new tab'
                >
                  <ExternalLink size={18} className='md:size-5' />
                </a>
                <button
                  onClick={onClose}
                  className='flex h-9 w-9 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 md:h-10 md:w-10'
                >
                  <X size={18} className='md:size-5' />
                </button>
              </div>
            </div>
            <div className='flex-1 bg-gray-100 p-2 md:p-4'>
              <iframe
                src={pdfUrl}
                className='h-full w-full rounded-xl border border-black/5 bg-white md:rounded-2xl'
                title={title}
              />
            </div>
            <div className='border-t border-black/5 bg-white px-4 py-3 text-center md:hidden'>
              <p className='text-[11px] text-black/40'>
                Can&apos;t scroll the PDF? Try opening it in a{' '}
                <a
                  href={pdfUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='font-bold text-[#5A5A40] underline'
                >
                  new tab
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};
