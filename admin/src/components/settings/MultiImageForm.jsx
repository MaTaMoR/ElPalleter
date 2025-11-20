import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Image as ImageIcon, Upload, X, ChevronUp, ChevronDown, Trash2, Undo2, ZoomIn } from 'lucide-react';
import { ImageService } from '@services/ImageService';
import styles from './MultiImageForm.module.css';

/**
 * Form component for viewing and editing a gallery of images
 * Similar to SingleImageForm but manages multiple images
 * Uses ItemView-like interaction for organizing images
 */
const MultiImageForm = ({
  galleryName,
  title = 'Galería',
  onChange,
  isEditing = false,
  refreshKey = null
}) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedImageId, setExpandedImageId] = useState(null);
  const [maxUploadSize, setMaxUploadSize] = useState(null);
  const [loadingSize, setLoadingSize] = useState(true);
  const imageRefs = useRef({});

  // Load images from gallery
  useEffect(() => {
    if (!isEditing) {
      loadGalleryImages();
    }
  }, [galleryName, refreshKey, isEditing]);

  // Load max upload size on mount
  useEffect(() => {
    const loadMaxSize = async () => {
      try {
        const sizeInfo = await ImageService.getMaxUploadSize();
        setMaxUploadSize(sizeInfo);
      } catch (error) {
        console.error('Error loading max upload size:', error);
      } finally {
        setLoadingSize(false);
      }
    };
    loadMaxSize();
  }, []);

  const loadGalleryImages = async () => {
    setLoading(true);
    try {
      const galleryImages = await ImageService.getGalleryImages(galleryName);
      // Transform to internal format with state
      const transformedImages = galleryImages.map((img, index) => ({
        id: img.id || `img-${index}`,
        name: img.name,
        order: img.order || index,
        _state: 'normal',
        _isNew: false,
        _file: null, // For new images
        _previewUrl: null // For new images preview
      }));
      setImages(transformedImages);
    } catch (error) {
      console.error('Error loading gallery images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  // Notify parent of changes
  const notifyChange = (updatedImages) => {
    if (onChange) {
      // Only send images that need to be uploaded or modified
      const changes = {
        newImages: updatedImages.filter(img => img._isNew && img._file),
        deletedImages: updatedImages.filter(img => img._state === 'deleted'),
        reorderedImages: updatedImages
          .filter(img => img._state !== 'deleted')
          .map((img, index) => ({
            name: img.name,
            order: index
          }))
      };
      onChange(changes);
    }
  };

  const handleAddImage = () => {
    // Trigger file input
    const fileInput = document.getElementById(`gallery-upload-${galleryName}`);
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages = files.map((file, index) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`El archivo ${file.name} no es una imagen válida`);
        return null;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      const tempId = `new-${Date.now()}-${index}`;

      return {
        id: tempId,
        name: file.name,
        order: images.length + index,
        _state: 'new',
        _isNew: true,
        _file: file,
        _previewUrl: previewUrl
      };
    }).filter(Boolean);

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    notifyChange(updatedImages);

    // Reset file input
    e.target.value = '';
  };

  const handleMoveImage = (imageId, direction) => {
    const index = images.findIndex(img => img.id === imageId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(index, 1);
    updatedImages.splice(newIndex, 0, movedImage);

    // Only update order, don't mark as edited (order changes are tracked separately)
    const finalImages = updatedImages.map((img, idx) => ({
      ...img,
      order: idx
    }));

    setImages(finalImages);
    notifyChange(finalImages);
  };

  const handleDeleteImage = (imageId) => {
    const updatedImages = images.map(img =>
      img.id === imageId
        ? { ...img, _state: 'deleted' }
        : img
    );
    setImages(updatedImages);
    notifyChange(updatedImages);
  };

  const handleUndoDelete = (imageId) => {
    const updatedImages = images.map(img =>
      img.id === imageId
        ? { ...img, _state: img._isNew ? 'new' : 'normal' }
        : img
    );
    setImages(updatedImages);
    notifyChange(updatedImages);
  };

  const handleToggleExpand = (imageId) => {
    setExpandedImageId(expandedImageId === imageId ? null : imageId);
  };

  const getImageUrl = (image) => {
    if (image._previewUrl) {
      return image._previewUrl;
    }
    const url = ImageService.getImageURL(image.name);
    return refreshKey ? `${url}?t=${refreshKey}` : url;
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img._previewUrl) {
          URL.revokeObjectURL(img._previewUrl);
        }
      });
    };
  }, [images]);

  // Reset when exiting edit mode
  useEffect(() => {
    if (!isEditing) {
      setExpandedImageId(null);
      loadGalleryImages();
    }
  }, [isEditing]);

  if (!isEditing) {
    // Read-only display - simple grid view
    return (
      <div className={styles.section}>
        <div className={styles.imageCard}>
          <div className={`${styles.cardHeader} ${styles.cardHeaderReadOnly}`}>
            <ImageIcon size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>{title}</h3>
          </div>
          <div className={styles.cardContent}>
            {loading ? (
              <div className={styles.loadingState}>Cargando imágenes...</div>
            ) : images.length === 0 ? (
              <div className={styles.emptyState}>No hay imágenes en esta galería</div>
            ) : (
              <div className={styles.imageGrid}>
                {images.map((image) => (
                  <div key={image.id} className={styles.gridImageCard}>
                    <img
                      src={getImageUrl(image)}
                      alt={image.name}
                      className={styles.gridImage}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit mode - detailed view with controls
  const visibleImages = images.filter(img => img._state !== 'deleted');
  const deletedImages = images.filter(img => img._state === 'deleted');

  return (
    <div className={styles.section}>
      <div className={styles.imageCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <ImageIcon size={20} className={styles.cardIcon} />
            <div className={styles.titleSection}>
              <h3 className={styles.cardTitle}>{title}</h3>
              {!loadingSize && maxUploadSize && (
                <span className={styles.sizeLimit}>
                  Máx: {maxUploadSize.maxFileSize}
                </span>
              )}
            </div>
          </div>
          <div className={styles.cardHeaderRight}>
            {/* Hidden file input */}
            <input
              type="file"
              id={`gallery-upload-${galleryName}`}
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className={styles.fileInput}
            />
            {/* Upload button in header */}
            <button
              type="button"
              onClick={handleAddImage}
              className={styles.uploadButtonHeader}
            >
              <Upload size={18} />
              <span className={styles.uploadButtonText}>Añadir imágenes</span>
            </button>
          </div>
        </div>
        <div className={styles.cardContent}>
          {loading ? (
            <div className={styles.loadingState}>Cargando imágenes...</div>
          ) : (
            <>
              {visibleImages.length === 0 && deletedImages.length === 0 ? (
                <div className={styles.emptyState}>
                  No hay imágenes en esta galería. Haz clic en "Añadir imágenes" para comenzar.
                </div>
              ) : (
                <>
                  {/* Active Images List */}
                  <div className={styles.imagesList}>
                    {visibleImages.map((image, index) => {
                      const isExpanded = expandedImageId === image.id;
                      const isNew = image._state === 'new';
                      const isEdited = image._state === 'edited';

                      return (
                        <div
                          key={image.id}
                          ref={(el) => { imageRefs.current[image.id] = el; }}
                          className={`${styles.imageCard} ${isNew ? styles.newCard : ''} ${isExpanded ? styles.expandedCard : ''}`}
                        >
                          <div className={styles.imageCardContent}>
                            {/* Image Preview (clickable) */}
                            <div
                              className={styles.imagePreviewContainer}
                              onClick={() => handleToggleExpand(image.id)}
                            >
                              <img
                                src={getImageUrl(image)}
                                alt={image.name}
                                className={isExpanded ? styles.imagePreviewLarge : styles.imagePreviewSmall}
                              />
                              {!isExpanded && (
                                <div className={styles.expandOverlay}>
                                  <ZoomIn size={24} />
                                </div>
                              )}
                            </div>

                            {/* Image Controls */}
                            <div className={styles.imageControls}>
                              <div className={styles.imageInfo}>
                                {isNew && <span className={styles.badge}>Nueva</span>}
                              </div>
                              <div className={styles.imageActions}>
                                {/* Move buttons */}
                                <div className={styles.moveButtonsContainer}>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(image.id, 'up')}
                                    disabled={index === 0}
                                    className={`${styles.actionButton} ${styles.moveButton}`}
                                    title="Mover arriba"
                                  >
                                    <ChevronUp size={18} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(image.id, 'down')}
                                    disabled={index === visibleImages.length - 1}
                                    className={`${styles.actionButton} ${styles.moveButton}`}
                                    title="Mover abajo"
                                  >
                                    <ChevronDown size={18} />
                                  </button>
                                </div>
                                {/* Delete button */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage(image.id)}
                                  className={`${styles.actionButton} ${styles.deleteButton}`}
                                  title="Eliminar"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Deleted Images Section */}
                  {deletedImages.length > 0 && (
                    <div className={styles.deletedSection}>
                      <h4 className={styles.deletedTitle}>Imágenes eliminadas</h4>
                      <div className={styles.deletedList}>
                        {deletedImages.map((image) => (
                          <div key={image.id} className={`${styles.imageCard} ${styles.deletedCard}`}>
                            <div className={styles.imageCardContent}>
                              <div className={styles.imagePreviewContainer}>
                                <img
                                  src={getImageUrl(image)}
                                  alt={image.name}
                                  className={styles.imagePreviewSmall}
                                />
                                <div className={styles.deletedOverlay}>Eliminada</div>
                              </div>
                              <div className={styles.imageControls}>
                                <div className={styles.imageInfo}>
                                  {/* Empty - no name shown */}
                                </div>
                                <div className={styles.imageActions}>
                                  <button
                                    type="button"
                                    onClick={() => handleUndoDelete(image.id)}
                                    className={`${styles.actionButton} ${styles.undoButton}`}
                                    title="Deshacer eliminación"
                                  >
                                    <Undo2 size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

MultiImageForm.propTypes = {
  galleryName: PropTypes.string.isRequired,
  title: PropTypes.string,
  onChange: PropTypes.func,
  isEditing: PropTypes.bool,
  refreshKey: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default MultiImageForm;
