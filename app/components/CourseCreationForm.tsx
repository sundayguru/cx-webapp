import { useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  FileText,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';

type CourseFormData = {
  title: string;
  code: string;
  description: string;
};

type StepProps = {
  formData: CourseFormData;
  updateFormData: (data: Partial<CourseFormData>) => void;
};

export type { CourseFormData };

// Step 1: Course Details
const CourseDetailsStep = ({ formData, updateFormData }: StepProps) => {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='font-serif text-2xl text-[#1a1a1a]'>Course Details</h2>
        <p className='mt-1 text-sm text-black/60'>
          Provide the basic information for your course.
        </p>
      </div>

      <div className='space-y-4'>
        <div>
          <label className='mb-1 block text-sm font-medium text-black/70'>
            Course Title
          </label>
          <input
            type='text'
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            className='w-full rounded-xl border border-black/10 px-4 py-3 transition-all outline-none focus:ring-2 focus:ring-[#5A5A40]'
            placeholder='Introduction to Computer Science'
            required
          />
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium text-black/70'>
            Course Code
          </label>
          <input
            type='text'
            value={formData.code}
            onChange={(e) =>
              updateFormData({ code: e.target.value.toUpperCase() })
            }
            className='w-full rounded-xl border border-black/10 px-4 py-3 transition-all outline-none focus:ring-2 focus:ring-[#5A5A40]'
            placeholder='CS101'
            maxLength={50}
            required
          />
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium text-black/70'>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            className='w-full rounded-xl border border-black/10 px-4 py-3 transition-all outline-none focus:ring-2 focus:ring-[#5A5A40]'
            placeholder='Brief description of what students will learn...'
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
}: {
  formData: CourseFormData;
  onSubmit: (formData: CourseFormData, file: File) => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadError(null);
    } else {
      setUploadError('Only PDF files are allowed');
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === 'application/pdf') {
        setSelectedFile(file);
        setUploadError(null);
      } else {
        setUploadError('Only PDF files are allowed');
      }
    },
    [],
  );

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onSubmit(formData, selectedFile);
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='font-serif text-2xl text-[#1a1a1a]'>
          Upload Course Content
        </h2>
        <p className='mt-1 text-sm text-black/60'>
          Upload your course content as a PDF file and submit.
        </p>
      </div>

      {selectedFile ? (
        <div className='rounded-xl border border-[#5A5A40]/20 bg-[#5A5A40]/5 p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <FileText className='text-[#5A5A40]' size={24} />
              <div>
                <p className='font-medium text-[#1a1a1a]'>
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
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              isDragging
                ? 'border-[#5A5A40] bg-[#5A5A40]/5'
                : 'border-black/20 hover:border-black/30'
            }`}
          >
            <div className='space-y-3'>
              <Upload className='mx-auto h-12 w-12 text-black/30' />
              <div>
                <p className='font-medium text-[#1a1a1a]'>
                  Drop your PDF here or{' '}
                  <span className='text-[#5A5A40] underline-offset-2 hover:underline'>
                    browse
                  </span>
                </p>
                <p className='mt-1 text-sm text-black/50'>
                  Only PDF files are accepted
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type='file'
              accept='.pdf,application/pdf'
              onChange={handleFileSelect}
              className='hidden'
            />
          </div>
        </label>
      )}

      {uploadError && <p className='text-sm text-red-500'>{uploadError}</p>}
      {submitError && <p className='text-sm text-red-500'>{submitError}</p>}

      <div className='flex items-center justify-between'>
        <button
          type='button'
          onClick={onBack}
          disabled={isSubmitting}
          className='flex items-center gap-2 rounded-xl border border-black/10 px-6 py-3 font-medium text-black/70 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50'
        >
          <ChevronLeft size={18} />
          Back
        </button>

        <button
          type='button'
          onClick={handleSubmit}
          disabled={!selectedFile || isSubmitting}
          className='flex items-center gap-2 rounded-xl bg-[#5A5A40] px-6 py-3 font-medium text-white transition-colors hover:bg-[#4a4a35] disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isSubmitting ? (
            <>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
              Creating Course...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Create Course
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Main Component
type CourseCreationFormProps = {
  onSubmit: (data: CourseFormData, file: File) => void;
  isSubmitting: boolean;
  submitError: string | null;
};

export const CourseCreationForm = ({
  onSubmit,
  isSubmitting,
  submitError,
}: CourseCreationFormProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    code: '',
    description: '',
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
    return formData.title && formData.code && formData.description;
  };

  const steps = [
    { number: 1, label: 'Details' },
    { number: 2, label: 'Upload' },
  ];

  return (
    <form className='space-y-6'>
      {/* Progress Indicator */}
      <div className='flex items-center justify-center gap-4'>
        {steps.map((s, index) => (
          <div key={s.number} className='flex items-center'>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                step === s.number
                  ? 'bg-[#5A5A40] text-white'
                  : step > s.number
                    ? 'bg-[#5A5A40] text-white'
                    : 'bg-black/10 text-black/40'
              }`}
            >
              {step > s.number ? <CheckCircle size={20} /> : s.number}
            </div>
            <span
              className={`ml-2 text-sm font-medium ${
                step === s.number ? 'text-[#1a1a1a]' : 'text-black/40'
              }`}
            >
              {s.label}
            </span>
            {index < steps.length - 1 && (
              <div className='mx-4 h-px w-8 bg-black/10'></div>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className='min-h-[300px]'
      >
        {step === 1 && (
          <CourseDetailsStep
            formData={formData}
            updateFormData={updateFormData}
          />
        )}
        {step === 2 && (
          <UploadContentStep
            formData={formData}
            onSubmit={onSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        )}
      </motion.div>

      {/* Navigation Buttons */}
      {step === 1 && (
        <div className='flex justify-end'>
          <button
            type='button'
            onClick={handleNext}
            disabled={!canProceedToNext()}
            className='flex items-center gap-2 rounded-xl bg-[#5A5A40] px-6 py-3 font-medium text-white transition-colors hover:bg-[#4a4a35] disabled:cursor-not-allowed disabled:opacity-50'
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </form>
  );
};
