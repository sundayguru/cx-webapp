type UploadResponse = {
  uploadId: string;
  key: string;
  size: number;
  type: string;
  name: string;
};

type ErrorResponse = {
  error: string;
};

export type { UploadResponse, ErrorResponse };
