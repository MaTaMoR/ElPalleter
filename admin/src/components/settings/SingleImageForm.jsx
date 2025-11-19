import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { ImageService } from '@services/ImageService';
import styles from './SingleImageForm.module.css';

/**
 * Form component for viewing and editing a single image
 */
const SingleImageForm = ({
  imageName,
  title = 'Imagen',
  onChange,
  isEditing = false
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Get the current image URL
  const currentImageUrl = ImageService.getImageURL(imageName);

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
      if (onChange) {
        onChange(null);
      }
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
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
    if (onChange) {
      onChange(file);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (onChange) {
      onChange(null);
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
          <ImageIcon size={20} className={styles.cardIcon} />
          <h3 className={styles.cardTitle}>{title}</h3>
        </div>
        <div className={styles.cardContent}>
          {/* Current Image Preview */}
          <div className={styles.currentImageSection}>
            <label className={styles.sectionLabel}>Imagen actual:</label>
            <div className={styles.imagePreview}>
              <img
                src={currentImageUrl}
                alt={`${title} actual`}
                className={styles.previewImage}
              />
            </div>
          </div>

          {/* File Upload Section */}
          <div className={styles.uploadSection}>
            <label className={styles.sectionLabel}>Nueva imagen:</label>
            <div className={styles.uploadArea}>
              <input
                type="file"
                id={`image-upload-${imageName}`}
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.fileInput}
              />
              <label
                htmlFor={`image-upload-${imageName}`}
                className={styles.uploadButton}
              >
                <Upload size={20} />
                <span>Seleccionar imagen</span>
              </label>
              {selectedFile && (
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
              )}
            </div>
          </div>

          {/* New Image Preview */}
          {previewUrl && (
            <div className={styles.newImageSection}>
              <label className={styles.sectionLabel}>Vista previa de la nueva imagen:</label>
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
  );
};

SingleImageForm.propTypes = {
  imageName: PropTypes.string.isRequired,
  title: PropTypes.string,
  onChange: PropTypes.func,
  isEditing: PropTypes.bool
};

export default SingleImageForm;
