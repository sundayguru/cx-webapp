import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileText,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Image as ImageIcon,
  Layers,
  Tag,
} from 'lucide-react';
import { SchoolSelect } from './SchoolSelect';
import { AuthorSelect } from './AuthorSelect';

type CourseFormData = {
  title: string;
  code: string;
  description: string;
  schoolId: string;
  schoolName: string;
  isNewSchool?: boolean;
  authorId: string;
  authorName: string;
  isNewAuthor?: boolean;
  level: string;
  category: string;
};

type StepProps = {
  formData: CourseFormData;
  updateFormData: (data: Partial<CourseFormData>) => void;
};

export type { CourseFormData };

type CourseFormMode = 'create' | 'edit';

// Step 1: Course Details
const CourseDetailsStep = ({ formData, updateFormData }: StepProps) => {
  const categories = [
    'General',
    'Computer Science',
    'Mathematics',
    'Physics',
    'Business',
    'Humanities',
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='font-serif text-2xl text-[#1a1a1a]'>Course Details</h2>
        <p className='mt-1 text-sm text-black/60'>
          Provide the basic information and classification for your course.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div className='space-y-4 md:col-span-2'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <label className='mb-1 block text-[10px] font-bold tracking-widest text-black/40 uppercase'>
                School / Institution
              </label>
              <SchoolSelect
                value={formData.schoolId}
                label={formData.schoolName}
                onChange={(value, label, isNew) =>
                  updateFormData({
                    schoolId: value,
                    schoolName: label,
                    isNewSchool: isNew,
                  })
                }
              />
            </div>
            <div>
              <label className='mb-1 block text-[10px] font-bold tracking-widest text-black/40 uppercase'>
                Original Author
              </label>
              <AuthorSelect
                value={formData.authorId}
                label={formData.authorName}
                onChange={(value, label, isNew) =>
                  updateFormData({
                    authorId: value,
                    authorName: label,
                    isNewAuthor: isNew,
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className='space-y-4 md:col-span-2'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <label className='mb-1 block text-[10px] font-bold tracking-widest text-black/40 uppercase'>
                Category
              </label>
              <div className='relative'>
                <Tag
                  size={16}
                  className='absolute top-1/2 left-4 -translate-y-1/2 text-black/30'
                />
                <select
                  value={formData.category}
                  onChange={(e) => updateFormData({ category: e.target.value })}
                  className='w-full appearance-none rounded-xl border border-black/10 bg-white py-3 pr-4 pl-11 transition-all outline-none focus:ring-2 focus:ring-[#5A5A40]'
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className='mb-1 block text-[10px] font-bold tracking-widest text-black/40 uppercase'>
                Difficulty Level
              </label>
              <div className='relative'>
                <Layers
                  size={16}
                  className='absolute top-1/2 left-4 -translate-y-1/2 text-black/30'
                />
                <select
                  value={formData.level}
                  onChange={(e) => updateFormData({ level: e.target.value })}
                  className='w-full appearance-none rounded-xl border border-black/10 bg-white py-3 pr-4 pl-11 transition-all outline-none focus:ring-2 focus:ring-[#5A5A40]'
                >
                  {levels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className='md:col-span-1'>
          <label className='mb-1 block text-[10px] font-bold tracking-widest text-black/40 uppercase'>
            Course Title
          </label>
          <input
            type='text'
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            className='w-full rounded-xl border border-black/10 px-4 py-3 transition-all outline-none focus:ring-2 focus:ring-[#5A5A40]'
            placeholder='Introduction to Design'
            required
          />
        </div>

        <div className='md:col-span-1'>
          <label className='mb-1 block text-[10px] font-bold tracking-widest text-black/40 uppercase'>
            Course Code
          </label>
          <input
            type='text'
            value={formData.code}
            onChange={(e) =>
              updateFormData({ code: e.target.value.toUpperCase() })
            }
            className='w-full rounded-xl border border-black/10 px-4 py-3 transition-all outline-none focus:ring-2 focus:ring-[#5A5A40]'
            placeholder='ART101'
            maxLength={50}
            required
          />
        </div>

        <div className='md:col-span-2'>
          <label className='mb-1 block text-[10px] font-bold tracking-widest text-black/40 uppercase'>
            Detailed Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            className='w-full rounded-xl border border-black/10 px-4 py-3 transition-all outline-none focus:ring-2 focus:ring-[#5A5A40]'
            placeholder='Explain what this course covers...'
            rows={4}
            required
          />
        </div>
      </div>
    </div>
  );
};

// Step 2: Upload Content & Submit
const UploadContentStep = ({
  formData,
  onSubmit,
  onBack,
  isSubmitting,
  submitError,
  mode,
  existingContentLabel,
  existingThumbnailUrl,
}: {
  formData: CourseFormData;
  onSubmit: (formData: CourseFormData, file?: File, thumbnail?: File) => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  mode: CourseFormMode;
  existingContentLabel?: string;
  existingThumbnailUrl?: string | null;
}) => {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    existingThumbnailUrl || null,
  );
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else if (file) {
      setError('Only PDF files are allowed for course content');
    }
  };

  const handleThumbnailChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      setError('Only image files are allowed for thumbnails');
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeThumbnail = () => {
    setSelectedThumbnail(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create' && !selectedFile) {
      setError('A PDF file is required for new courses');
      return;
    }

    onSubmit(
      formData,
      selectedFile || undefined,
      selectedThumbnail || undefined,
    );
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='font-serif text-2xl text-[#1a1a1a]'>
          Upload Course Assets
        </h2>
        <p className='mt-1 text-sm text-black/60'>
          Upload your core academic material and an optional cover image.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div className='space-y-2'>
          <label className='text-[10px] font-bold tracking-widest text-black/40 uppercase'>
            Study Material (PDF)
          </label>
          {mode === 'edit' && existingContentLabel && !selectedFile ? (
            <div className='rounded-xl border border-black/10 bg-black/[0.02] p-4 text-sm text-black/60'>
              <p className='font-medium text-[#1a1a1a]'>Current file</p>
              <p className='mt-1'>{existingContentLabel}</p>
              <p className='mt-2 text-xs text-black/45'>
                Upload a new PDF only if you want to replace the existing course
                content.
              </p>
            </div>
          ) : null}
          {selectedFile ? (
            <div className='rounded-xl border border-[#5A5A40]/20 bg-[#5A5A40]/5 p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3 overflow-hidden'>
                  <FileText className='shrink-0 text-[#5A5A40]' size={24} />
                  <div className='overflow-hidden'>
                    <p className='truncate font-medium text-[#1a1a1a]'>
                      {selectedFile.name}
                    </p>
                    <p className='text-xs text-black/60'>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={removeFile}
                  className='rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black/60'
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ) : (
            <label className='block cursor-pointer'>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  handleFileChange(e.dataTransfer.files[0]);
                }}
                className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  isDraggingFile
                    ? 'border-[#5A5A40] bg-[#5A5A40]/5'
                    : 'border-black/20 hover:border-black/30'
                }`}
              >
                <Upload className='mx-auto h-8 w-8 text-black/20' />
                <p className='mt-2 text-sm font-medium text-[#1a1a1a]'>
                  Drop PDF here or{' '}
                  <span className='text-[#5A5A40]'>browse</span>
                </p>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.pdf,application/pdf'
                  onChange={(e) =>
                    handleFileChange(e.target.files?.[0] || null)
                  }
                  className='hidden'
                />
              </div>
            </label>
          )}
        </div>

        <div className='space-y-2'>
          <label className='text-[10px] font-bold tracking-widest text-black/40 uppercase'>
            Cover Image {mode === 'edit' ? '(Replace Optional)' : '(Optional)'}
          </label>
          {thumbnailPreview ? (
            <div className='relative aspect-video w-full overflow-hidden rounded-xl border border-black/10 shadow-sm'>
              <img
                src={thumbnailPreview}
                alt='Thumbnail preview'
                className='h-full w-full object-cover'
              />
              <button
                type='button'
                onClick={removeThumbnail}
                className='absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-md transition-colors hover:bg-black/80'
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className='block cursor-pointer'>
              <div className='flex aspect-video w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-black/20 transition-colors hover:border-black/30'>
                <ImageIcon className='h-8 w-8 text-black/20' />
                <p className='mt-2 text-sm font-medium text-[#1a1a1a]'>
                  Add Thumbnail
                </p>
                <input
                  ref={thumbnailInputRef}
                  type='file'
                  accept='image/*'
                  onChange={(e) =>
                    handleThumbnailChange(e.target.files?.[0] || null)
                  }
                  className='hidden'
                />
              </div>
            </label>
          )}
        </div>
      </div>

      {(error || submitError) && (
        <p className='rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-500'>
          {error || submitError}
        </p>
      )}

      <div className='flex items-center justify-between pt-4'>
        <button
          type='button'
          onClick={onBack}
          disabled={isSubmitting}
          className='flex items-center gap-2 rounded-xl border border-black/10 px-6 py-3 font-medium text-black/70 transition-colors hover:bg-black/5'
        >
          <ChevronLeft size={18} />
          Back
        </button>

        <button
          type='button'
          onClick={handleSubmit}
          disabled={(mode === 'create' && !selectedFile) || isSubmitting}
          className='flex items-center gap-2 rounded-xl bg-[#5A5A40] px-8 py-3 font-bold text-white shadow-lg transition-all hover:bg-[#4a4a35] active:scale-95 disabled:opacity-50'
        >
          {isSubmitting ? (
            <>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
              Finalizing...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              {mode === 'edit' ? 'Save Changes' : 'Publish Course'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Main Component
type CourseCreationFormProps = {
  onSubmit: (data: CourseFormData, file?: File, thumbnail?: File) => void;
  isSubmitting: boolean;
  submitError: string | null;
  initialData?: CourseFormData;
  mode?: CourseFormMode;
  existingContentLabel?: string;
  existingThumbnailUrl?: string | null;
};

export const CourseCreationForm = ({
  onSubmit,
  isSubmitting,
  submitError,
  initialData,
  mode = 'create',
  existingContentLabel,
  existingThumbnailUrl,
}: CourseCreationFormProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CourseFormData>({
    title: initialData?.title || '',
    code: initialData?.code || '',
    description: initialData?.description || '',
    schoolId: initialData?.schoolId || '',
    schoolName: initialData?.schoolName || '',
    authorId: initialData?.authorId || '',
    authorName: initialData?.authorName || '',
    level: initialData?.level || 'Beginner',
    category: initialData?.category || 'General',
  });

  const updateFormData = (data: Partial<CourseFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, 2));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const canProceedToNext = () => {
    return (
      formData.title &&
      formData.code &&
      formData.description &&
      formData.schoolId &&
      formData.authorId
    );
  };

  const steps = [
    { number: 1, label: 'Details' },
    { number: 2, label: 'Upload' },
  ];

  return (
    <form className='space-y-8'>
      {/* Progress Indicator */}
      <div className='flex items-center justify-center gap-4'>
        {steps.map((s, index) => (
          <div key={s.number} className='flex items-center'>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all ${
                step === s.number
                  ? 'bg-[#5A5A40] text-white shadow-lg ring-4 ring-[#5A5A40]/10'
                  : step > s.number
                    ? 'bg-[#5A5A40] text-white'
                    : 'bg-black/[0.03] text-black/30'
              }`}
            >
              {step > s.number ? <CheckCircle size={22} /> : s.number}
            </div>
            <span
              className={`ml-3 text-sm font-bold tracking-widest uppercase ${
                step === s.number ? 'text-[#1a1a1a]' : 'text-black/20'
              }`}
            >
              {s.label}
            </span>
            {index < steps.length - 1 && (
              <div className='mx-6 h-px w-12 bg-black/5'></div>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -20, scale: 0.98 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className='min-h-[400px]'
      >
        <AnimatePresence mode='wait'>
          {step === 1 && (
            <motion.div key='step1' className='bg-white'>
              <CourseDetailsStep
                formData={formData}
                updateFormData={updateFormData}
              />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key='step2' className='bg-white'>
              <UploadContentStep
                formData={formData}
                onSubmit={onSubmit}
                onBack={handleBack}
                isSubmitting={isSubmitting}
                submitError={submitError}
                mode={mode}
                existingContentLabel={existingContentLabel}
                existingThumbnailUrl={existingThumbnailUrl}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Navigation Buttons */}
      {step === 1 && (
        <div className='flex justify-end pt-6'>
          <button
            type='button'
            onClick={handleNext}
            disabled={!canProceedToNext()}
            className='flex items-center gap-2 rounded-2xl bg-[#5A5A40] px-8 py-3.5 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#4a4a35] active:scale-95 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none'
          >
            Continue to Assets
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </form>
  );
};
