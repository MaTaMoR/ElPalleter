import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { ImageService } from '@services/ImageService';
import useImageUploadSettings from '../../hooks/useImageUploadSettings';
import { validateImageFile } from '../../utils/imageValidationUtils';
import ConfirmDialog from '../common/ConfirmDialog';
import styles from './SingleImageForm.module.css';

/**
 * Form component for viewing and editing a single image
 *
 * Exposes methods via ref:
 * - save(): Saves the selected image
 * - cancel(): Discards changes and clears selection
 * - hasChanges(): Returns true if an image has been selected
 */
const SingleImageForm = forwardRef(({
  id,
  imageName,
  title = 'Imagen',
  onHasChangesChange,
  isEditing = false
}, ref) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, message: '' });

  // Load upload settings using custom hook
  const { settings: uploadSettings, loading: loadingSettings } = useImageUploadSettings();

  // Get the current image URL
  const currentImageUrl = ImageService.getImageURL(imageName);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    save: async () => {
      if (selectedFile) {
        await ImageService.updateImage(imageName, selectedFile);
        // Clear selection after save
        handleClearSelection();
      }
    },

    cancel: () => {
      handleClearSelection();
    },

    hasChanges: () => {
      return selectedFile !== null;
    }
  }), [selectedFile, imageName]);

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset selected file when exiting edit mode
  useEffect(() => {
    if (!isEditing) {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [isEditing, previewUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      if (onHasChangesChange) {
        onHasChangesChange(id, false);
      }
      return;
    }

    // Validate file using upload settings
    const validation = validateImageFile(file, uploadSettings);
    if (!validation.isValid) {
      setErrorDialog({
        isOpen: true,
        message: validation.errorMessage
      });
      // Reset file input
      e.target.value = '';
      return;
    }

    // Create preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreviewUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(newPreviewUrl);

    // Notify parent component
    if (onHasChangesChange) {
      onHasChangesChange(id, true);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (onHasChangesChange) {
      onHasChangesChange(id, false);
    }
    // Reset file input
    const fileInput = document.getElementById(`image-upload-${imageName}`);
    if (fileInput) {
      fileInput.value = '';
    }
  };

  if (!isEditing) {
    // Read-only display
    return (
      <div className={styles.section}>
        <div className={styles.imageCard}>
          <div className={`${styles.cardHeader} ${styles.cardHeaderReadOnly}`}>
            <ImageIcon size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>{title}</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.imagePreview}>
              <img
                src={currentImageUrl}
                alt={title}
                className={styles.previewImage}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className={styles.section}>
      <div className={styles.imageCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <ImageIcon size={20} className={styles.cardIcon} />
            <div className={styles.titleSection}>
              <h3 className={styles.cardTitle}>{title}</h3>
              {!loadingSettings && uploadSettings && (
                <span className={styles.sizeLimit}>
                  Máx: {uploadSettings.maxFileSize}
                </span>
              )}
            </div>
          </div>
          <div className={styles.cardHeaderRight}>
            {/* Hidden file input */}
            <input
              type="file"
              id={`image-upload-${imageName}`}
              accept="image/*"
              onChange={handleFileSelect}
              className={styles.fileInput}
            />
            {/* Upload button in header */}
            <label
              htmlFor={`image-upload-${imageName}`}
              className={styles.uploadButtonHeader}
            >
              <Upload size={18} />
              <span className={styles.uploadButtonText}>Subir imagen</span>
            </label>
          </div>
        </div>
        <div className={styles.cardContent}>
          {/* File Info - show if file selected */}
          {selectedFile && (
            <div className={styles.fileInfoSection}>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className={styles.clearButton}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Images Container - side by side on desktop */}
          <div className={styles.imagesContainer}>
            {/* Current Image Preview */}
            <div className={styles.imageColumn}>
              <label className={styles.sectionLabel}>Imagen actual:</label>
              <div className={styles.imagePreview}>
                <img
                  src={currentImageUrl}
                  alt={`${title} actual`}
                  className={styles.previewImage}
                />
              </div>
            </div>

            {/* New Image Preview */}
            {previewUrl && (
              <div className={styles.imageColumn}>
                <label className={styles.sectionLabel}>Vista previa:</label>
                <div className={styles.imagePreview}>
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className={styles.previewImage}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Dialog */}
      <ConfirmDialog
        isOpen={errorDialog.isOpen}
        title="Error de validación"
        message={errorDialog.message}
        type="danger"
        confirmText="Aceptar"
        onConfirm={() => setErrorDialog({ isOpen: false, message: '' })}
      />
    </div>
  );
});

SingleImageForm.propTypes = {
  id: PropTypes.string.isRequired,
  imageName: PropTypes.string.isRequired,
  title: PropTypes.string,
  onHasChangesChange: PropTypes.func,
  isEditing: PropTypes.bool
};

export default SingleImageForm;
