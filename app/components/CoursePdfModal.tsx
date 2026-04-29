import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

type CoursePdfModalProps = {
  isOpen: boolean;
  contentKey: string | null;
  code: string;
  title: string;
  onClose: () => void;
};

type PdfReaderProps = {
  pdfUrl: string;
  title: string;
};

type ReactPdfModule = typeof import('react-pdf');

const MIN_SCALE = 0.8;
const MAX_SCALE = 2;
const SCALE_STEP = 0.2;

const PdfReader = ({ pdfUrl, title }: PdfReaderProps) => {
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [pdfModule, setPdfModule] = useState<ReactPdfModule | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    let isMounted = true;

    const loadPdfModule = async () => {
      const reactPdfModule = await import('react-pdf');

      reactPdfModule.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();

      if (isMounted) {
        setPdfModule(reactPdfModule);
      }
    };

    void loadPdfModule();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!pageContainerRef.current) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = pageContainerRef.current?.clientWidth ?? 0;
      setPageWidth(nextWidth > 0 ? nextWidth : null);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(pageContainerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const canGoToPreviousPage = pageNumber > 1;
  const canGoToNextPage = numPages !== null && pageNumber < numPages;
  const Document = pdfModule?.Document;
  const Page = pdfModule?.Page;

  const handleDocumentLoadSuccess = ({
    numPages: loadedPages,
  }: {
    numPages: number;
  }) => {
    setNumPages(loadedPages);
    setPageNumber(1);
    setLoadError(null);
  };

  const handleDocumentLoadError = (error: Error) => {
    setLoadError(error.message || 'Unable to load PDF.');
  };

  return (
    <>
      <div className='flex-1 overflow-y-auto bg-[#efede5] p-3 md:p-5'>
        <div
          ref={pageContainerRef}
          className='mx-auto flex min-h-full w-full max-w-4xl items-start justify-center'
        >
          {!isClient || !Document || !Page ? (
            <div className='flex min-h-[60vh] w-full items-center justify-center rounded-[28px] border border-black/5 bg-white text-black/45 shadow-sm'>
              <div className='flex items-center gap-3'>
                <Loader2 size={20} className='animate-spin' />
                <span>Preparing reader...</span>
              </div>
            </div>
          ) : loadError ? (
            <div className='w-full max-w-xl rounded-[28px] border border-red-200 bg-white p-8 text-center shadow-sm'>
              <p className='text-lg font-semibold text-[#1a1a1a]'>
                Could not load this PDF
              </p>
              <p className='mt-2 text-sm text-black/55'>{loadError}</p>
              <a
                href={pdfUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='mt-5 inline-flex items-center gap-2 rounded-full bg-[#5A5A40] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#4a4a35]'
              >
                <ExternalLink size={16} />
                Open in new tab
              </a>
            </div>
          ) : (
            <Document
              file={pdfUrl}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
              loading={
                <div className='flex min-h-[60vh] w-full items-center justify-center rounded-[28px] border border-black/5 bg-white shadow-sm'>
                  <div className='flex items-center gap-3 text-black/55'>
                    <Loader2 size={20} className='animate-spin' />
                    <span className='text-sm font-medium'>Loading PDF...</span>
                  </div>
                </div>
              }
              className='w-full'
            >
              <div className='overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)]'>
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth ?? undefined}
                  scale={scale}
                  renderAnnotationLayer
                  renderTextLayer
                  loading={
                    <div className='flex min-h-[60vh] items-center justify-center bg-white text-black/45'>
                      Rendering page...
                    </div>
                  }
                  title={title}
                />
              </div>
            </Document>
          )}
        </div>
      </div>

      <div className='border-t border-black/5 bg-white px-4 py-3'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <button
              onClick={() =>
                setPageNumber((currentPage) => Math.max(1, currentPage - 1))
              }
              disabled={!canGoToPreviousPage}
              className='flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#1a1a1a] transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40'
            >
              <ChevronLeft size={18} />
            </button>
            <div className='rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#1a1a1a]'>
              Page {pageNumber}
              {numPages ? ` / ${numPages}` : ''}
            </div>
            <button
              onClick={() =>
                setPageNumber((currentPage) =>
                  numPages ? Math.min(numPages, currentPage + 1) : currentPage,
                )
              }
              disabled={!canGoToNextPage}
              className='flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#1a1a1a] transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40'
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={() =>
                setScale((currentScale) =>
                  Math.max(MIN_SCALE, currentScale - SCALE_STEP),
                )
              }
              disabled={scale <= MIN_SCALE}
              className='flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#1a1a1a] transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40'
            >
              <Minus size={18} />
            </button>
            <div className='min-w-18 rounded-full border border-black/10 bg-white px-4 py-2 text-center text-sm font-medium text-[#1a1a1a]'>
              {Math.round(scale * 100)}%
            </div>
            <button
              onClick={() =>
                setScale((currentScale) =>
                  Math.min(MAX_SCALE, currentScale + SCALE_STEP),
                )
              }
              disabled={scale >= MAX_SCALE}
              className='flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#1a1a1a] transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40'
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
        <p className='mt-3 text-center text-[11px] text-black/45 md:text-xs'>
          Swipe or scroll to read, then use the page controls to move through
          the document.
        </p>
      </div>
    </>
  );
};

export const CoursePdfModal = ({
  isOpen,
  contentKey,
  code,
  title,
  onClose,
}: CoursePdfModalProps) => {
  const pdfUrl = contentKey ? `/api/course/serve/${contentKey}` : null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;

    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

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
            className='relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-none bg-white shadow-2xl md:h-[min(92vh,980px)] md:rounded-[40px]'
          >
            <div className='flex items-center justify-between border-b border-black/5 bg-white p-4 md:p-6'>
              <div className='flex min-w-0 items-center gap-3 text-[#5A5A40] md:gap-4'>
                <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5A5A40]/10 md:h-10 md:w-10'>
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

            <PdfReader key={pdfUrl} pdfUrl={pdfUrl} title={title} />
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};
