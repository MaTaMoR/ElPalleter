/**
 * Image validation utilities
 * Handles file size and extension validations for image uploads
 */

/**
 * Converts a size string (e.g., "50MB", "100KB") to bytes
 * @param {string} sizeStr - Size string with unit (KB, MB, GB)
 * @returns {number} Size in bytes
 */
export const parseSize = (sizeStr) => {
  if (!sizeStr || typeof sizeStr !== 'string') {
    return 0;
  }

  const match = sizeStr.trim().match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)$/i);
  if (!match) {
    return 0;
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers = {
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024
  };

  return value * (multipliers[unit] || 0);
};

/**
 * Formats bytes to a human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Gets the file extension from a filename
 * @param {string} filename - The filename
 * @returns {string} File extension in lowercase (without the dot)
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }

  return filename.substring(lastDotIndex + 1).toLowerCase();
};

/**
 * Validates an image file based on upload settings
 * @param {File} file - The file to validate
 * @param {Object} settings - Upload settings with maxFileSize and validExtensions
 * @returns {Object} Validation result with isValid and errorMessage properties
 */
export const validateImageFile = (file, settings) => {
  if (!file) {
    return { isValid: false, errorMessage: 'No se seleccionó ningún archivo' };
  }

  if (!settings) {
    // If no settings, just check if it's an image
    if (!file.type.startsWith('image/')) {
      return { isValid: false, errorMessage: 'El archivo debe ser una imagen' };
    }
    return { isValid: true };
  }

  // Validate file extension
  if (settings.validExtensions && Array.isArray(settings.validExtensions)) {
    const fileExtension = getFileExtension(file.name);

    if (!fileExtension) {
      return { isValid: false, errorMessage: 'El archivo no tiene una extensión válida' };
    }

    const isValidExtension = settings.validExtensions.some(
      ext => ext.toLowerCase() === fileExtension
    );

    if (!isValidExtension) {
      const validExts = settings.validExtensions.join(', ');
      return {
        isValid: false,
        errorMessage: `Extensión no válida. Extensiones permitidas: ${validExts}`
      };
    }
  }

  // Validate file size
  if (settings.maxFileSize) {
    const maxSizeBytes = parseSize(settings.maxFileSize);

    if (maxSizeBytes > 0 && file.size > maxSizeBytes) {
      return {
        isValid: false,
        errorMessage: `El archivo es demasiado grande. Tamaño máximo: ${settings.maxFileSize} (archivo: ${formatBytes(file.size)})`
      };
    }
  }

  return { isValid: true };
};

/**
 * Validates multiple image files
 * @param {File[]} files - Array of files to validate
 * @param {Object} settings - Upload settings with maxFileSize, maxRequestSize, and validExtensions
 * @returns {Object} Validation result with isValid, errorMessage, and validFiles properties
 */
export const validateImageFiles = (files, settings) => {
  if (!files || files.length === 0) {
    return { isValid: false, errorMessage: 'No se seleccionaron archivos' };
  }

  const validFiles = [];
  const errors = [];

  // Validate each file individually
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const validation = validateImageFile(file, settings);

    if (validation.isValid) {
      validFiles.push(file);
    } else {
      errors.push(`${file.name}: ${validation.errorMessage}`);
    }
  }

  // Validate total request size if specified
  if (settings && settings.maxRequestSize && validFiles.length > 0) {
    const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
    const maxRequestBytes = parseSize(settings.maxRequestSize);

    if (maxRequestBytes > 0 && totalSize > maxRequestBytes) {
      return {
        isValid: false,
        errorMessage: `El tamaño total de los archivos (${formatBytes(totalSize)}) supera el límite de ${settings.maxRequestSize}`,
        validFiles: []
      };
    }
  }

  if (validFiles.length === 0 && errors.length > 0) {
    return {
      isValid: false,
      errorMessage: errors[0], // Return first error
      validFiles: []
    };
  }

  return {
    isValid: validFiles.length > 0,
    validFiles,
    errorMessage: errors.length > 0 ? `Algunos archivos no son válidos: ${errors.join('; ')}` : null
  };
};
