// File validation middleware
// Validates file type and size for uploads

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json'
];

const MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes

/**
 * Middleware to validate file uploads
 * Checks file type and size constraints
 */
export function validateFileUpload(req, res, next) {
  // Check if files are present
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({
      error: 'No files uploaded',
      toast: {
        type: 'error',
        message: 'Please select a file to upload'
      }
    });
  }

  // Validate each uploaded file
  for (const fieldName in req.files) {
    const file = req.files[fieldName];
    
    // Handle array of files
    const files = Array.isArray(file) ? file : [file];
    
    for (const singleFile of files) {
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(singleFile.mimetype)) {
        return res.status(400).json({
          error: `Invalid file type: ${singleFile.mimetype}`,
          allowedTypes: ALLOWED_FILE_TYPES,
          toast: {
            type: 'error',
            message: `File type ${singleFile.mimetype} is not allowed. Please upload a valid file type.`
          }
        });
      }
      
      // Check file size
      if (singleFile.size > MAX_FILE_SIZE) {
        const fileSizeMB = (singleFile.size / (1024 * 1024)).toFixed(2);
        return res.status(400).json({
          error: `File too large: ${fileSizeMB}MB`,
          maxSize: '1MB',
          toast: {
            type: 'error',
            message: `File size (${fileSizeMB}MB) exceeds the 1MB limit. Please choose a smaller file.`
          }
        });
      }
      
      // Check for empty files
      if (singleFile.size === 0) {
        return res.status(400).json({
          error: 'Empty file uploaded',
          toast: {
            type: 'error',
            message: 'The uploaded file is empty. Please select a valid file.'
          }
        });
      }
    }
  }
  
  // All validations passed
  next();
}

/**
 * Middleware specifically for image uploads
 * More restrictive validation for image files only
 */
export function validateImageUpload(req, res, next) {
  const imageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({
      error: 'No image files uploaded',
      toast: {
        type: 'error',
        message: 'Please select an image to upload'
      }
    });
  }

  for (const fieldName in req.files) {
    const file = req.files[fieldName];
    const files = Array.isArray(file) ? file : [file];
    
    for (const singleFile of files) {
      if (!imageTypes.includes(singleFile.mimetype)) {
        return res.status(400).json({
          error: `Invalid image type: ${singleFile.mimetype}`,
          allowedTypes: imageTypes,
          toast: {
            type: 'error',
            message: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP).'
          }
        });
      }
      
      if (singleFile.size > MAX_FILE_SIZE) {
        const fileSizeMB = (singleFile.size / (1024 * 1024)).toFixed(2);
        return res.status(400).json({
          error: `Image too large: ${fileSizeMB}MB`,
          maxSize: '1MB',
          toast: {
            type: 'error',
            message: `Image size (${fileSizeMB}MB) exceeds the 1MB limit.`
          }
        });
      }
    }
  }
  
  next();
}

/**
 * Utility function to get file extension from mimetype
 */
export function getFileExtension(mimetype) {
  const extensions = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'application/json': '.json'
  };
  
  return extensions[mimetype] || '';
}

/**
 * Utility function to format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}