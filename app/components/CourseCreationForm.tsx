import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  FileText,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import type { UploadResponse, ErrorResponse } from '~/types/api';

type CourseFormData = {
  title: string;
  code: string;
  description: string;
  uploadId: string;
  contentKey: string;
  contentType: string;
  fileName: string;
  fileSize: number;
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

// Step 2: Upload Content
const UploadContentStep = ({ formData, updateFormData }: StepProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadError(null);

      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const response = await fetch('/api/course/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!response.ok) {
          const errorData = (await response.json()) as ErrorResponse;
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = (await response.json()) as UploadResponse;
        updateFormData({
          uploadId: result.uploadId,
          contentKey: result.key,
          contentType: result.type,
          fileName: result.name,
          fileSize: result.size,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to upload file';
        setUploadError(message);
      } finally {
        setIsUploading(false);
      }
    },
    [updateFormData],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        handleUpload(file);
      } else {
        setUploadError('Only PDF files are allowed');
      }
    },
    [handleUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === 'application/pdf') {
        handleUpload(file);
      } else {
        setUploadError('Only PDF files are allowed');
      }
    },
    [handleUpload],
  );

  const removeFile = () => {
    updateFormData({
      uploadId: '',
      contentKey: '',
      contentType: '',
      fileName: '',
      fileSize: 0,
    });
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='font-serif text-2xl text-[#1a1a1a]'>Upload Content</h2>
        <p className='mt-1 text-sm text-black/60'>
          Upload your course content as a PDF file.
        </p>
      </div>

      {formData.uploadId ? (
        <div className='rounded-xl border border-[#5A5A40]/20 bg-[#5A5A40]/5 p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <FileText className='text-[#5A5A40]' size={24} />
              <div>
                <p className='font-medium text-[#1a1a1a]'>
                  {formData.fileName}
                </p>
                <p className='text-xs text-black/60'>
                  {(formData.fileSize / 1024 / 1024).toFixed(2)} MB
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
          {isUploading ? (
            <div className='space-y-3'>
              <div className='mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#5A5A40] border-t-transparent'></div>
              <p className='text-sm text-black/60'>Uploading...</p>
            </div>
          ) : (
            <div className='space-y-3'>
              <Upload className='mx-auto h-12 w-12 text-black/30' />
              <div>
                <p className='font-medium text-[#1a1a1a]'>
                  Drop your PDF here or{' '}
                  <label className='cursor-pointer text-[#5A5A40] hover:underline'>
                    browse
                    <input
                      type='file'
                      accept='.pdf,application/pdf'
                      onChange={handleFileSelect}
                      className='hidden'
                    />
                  </label>
                </p>
                <p className='mt-1 text-sm text-black/50'>
                  Only PDF files are accepted
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {uploadError && <p className='text-sm text-red-500'>{uploadError}</p>}
    </div>
  );
};

// Step 3: Review
const ReviewStep = ({ formData }: StepProps) => {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='font-serif text-2xl text-[#1a1a1a]'>Review & Submit</h2>
        <p className='mt-1 text-sm text-black/60'>
          Review your course details before submitting.
        </p>
      </div>

      <div className='space-y-4 rounded-xl border border-black/10 p-6'>
        <div>
          <h3 className='text-sm font-medium text-black/50'>Course Title</h3>
          <p className='mt-1 font-medium text-[#1a1a1a]'>{formData.title}</p>
        </div>
        <div>
          <h3 className='text-sm font-medium text-black/50'>Course Code</h3>
          <p className='mt-1 font-medium text-[#1a1a1a]'>{formData.code}</p>
        </div>
        <div>
          <h3 className='text-sm font-medium text-black/50'>Description</h3>
          <p className='mt-1 text-black/70'>{formData.description}</p>
        </div>
        <div>
          <h3 className='text-sm font-medium text-black/50'>Content</h3>
          <p className='mt-1 font-medium text-[#1a1a1a]'>{formData.fileName}</p>
        </div>
      </div>

      <div className='rounded-xl border border-black/10 p-4'>
        <h3 className='mb-3 text-sm font-medium text-black/70'>PDF Preview</h3>
        <div className='aspect-[8.5/11] w-full overflow-hidden rounded-lg border border-black/5 bg-gray-50'>
          <iframe
            src={`/api/course/serve/${encodeURIComponent(formData.contentKey)}`}
            className='h-full w-full'
            title='PDF Preview'
          />
        </div>
      </div>
    </div>
  );
};

// Main Component
type CourseCreationFormProps = {
  onSubmit: (data: CourseFormData) => void;
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
    uploadId: '',
    contentKey: '',
    contentType: '',
    fileName: '',
    fileSize: 0,
  });

  const updateFormData = (data: Partial<CourseFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevious = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const canProceedToNext = () => {
    if (step === 1) {
      return formData.title && formData.code && formData.description;
    }
    if (step === 2) {
      return formData.uploadId;
    }
    return true;
  };

  const steps = [
    { number: 1, label: 'Details' },
    { number: 2, label: 'Upload' },
    { number: 3, label: 'Review' },
  ];

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
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
        className='min-h-[400px]'
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
            updateFormData={updateFormData}
          />
        )}
        {step === 3 && (
          <ReviewStep formData={formData} updateFormData={updateFormData} />
        )}
      </motion.div>

      {/* Navigation Buttons */}
      <div className='flex items-center justify-between gap-4'>
        {step > 1 ? (
          <button
            type='button'
            onClick={handlePrevious}
            className='flex items-center gap-2 rounded-xl border border-black/10 px-6 py-3 font-medium text-black/70 transition-colors hover:bg-black/5'
          >
            <ChevronLeft size={18} />
            Previous
          </button>
        ) : (
          <div></div>
        )}

        {step < 3 ? (
          <button
            type='button'
            onClick={handleNext}
            disabled={!canProceedToNext()}
            className='flex items-center gap-2 rounded-xl bg-[#5A5A40] px-6 py-3 font-medium text-white transition-colors hover:bg-[#4a4a35] disabled:cursor-not-allowed disabled:opacity-50'
          >
            Next
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            type='submit'
            disabled={isSubmitting}
            className='flex items-center gap-2 rounded-xl bg-[#5A5A40] px-6 py-3 font-medium text-white transition-colors hover:bg-[#4a4a35] disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isSubmitting ? (
              <>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Submit Course
              </>
            )}
          </button>
        )}
      </div>

      {submitError && <p className='text-sm text-red-500'>{submitError}</p>}
    </form>
  );
};
