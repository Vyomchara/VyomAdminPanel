// Add this new file
export interface FileUploadOptions {
  clientId: string;
  fileType: 'mission' | 'image';
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

/**
 * Validates a file before upload
 */
export function validateFile(
  file: File, 
  options: FileUploadOptions
): { valid: boolean; error?: string } {
  // Check file size
  const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB` 
    };
  }
  
  // Check file type
  const allowedTypes = options.allowedTypes || (
    options.fileType === 'mission' 
      ? ['application/json', 'application/x-yaml']
      : ['image/jpeg', 'image/png', 'image/gif']
  );
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` 
    };
  }
  
  return { valid: true };
}

/**
 * Creates a FormData object from a file for server action uploads
 */
export function createFileFormData(file: File): FormData {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
}