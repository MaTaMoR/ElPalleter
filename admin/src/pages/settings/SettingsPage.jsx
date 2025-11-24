import React, { useState, useEffect, useCallback } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import Button from '../../components/common/Button';
import LanguageSelector from '../../components/menu/utils/LanguageSelector';
import ConfirmDialog from '../../components/menu/utils/ConfirmDialog';
import ToastContainer from '../../components/common/ToastContainer';
import SavingOverlay from '../../components/common/SavingOverlay';
import TranslationsForm from '../../components/settings/TranslationsForm';
import SingleImageForm from '../../components/settings/SingleImageForm';
import MultiImageForm from '../../components/settings/MultiImageForm';
import { I18nService } from '@services/I18nService';
import { ImageService } from '@services/ImageService';
import styles from './SettingsPage.module.css';

// ============================================================================
// SETTINGS CONTENT COMPONENT
// ============================================================================

const SettingsContent = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Original data from backend
  const [originalTranslations, setOriginalTranslations] = useState(null);
  // Current editing data
  const [translations, setTranslations] = useState(null);

  // Images state - stores File objects for modified images
  const [modifiedImages, setModifiedImages] = useState({});

  // Gallery state - stores gallery changes (new, deleted, reordered images)
  const [galleryChanges, setGalleryChanges] = useState({});

  // Image refresh key - updates when images are saved to force reload
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());

  // Toast state
  const [toasts, setToasts] = useState([]);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: null
  });

  // Toast handlers
  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Load data from backend
  useEffect(() => {
    loadTranslations();
  }, [selectedLanguage]);

  const loadTranslations = async () => {
    setLoading(true);
    setError(null);
    try {
      const flatTranslations = I18nService.getAllTranslations(selectedLanguage);
      setOriginalTranslations(flatTranslations);
      setTranslations(flatTranslations);
    } catch (err) {
      console.error('Error loading translations:', err);
      setError(err.message || 'Error al cargar las traducciones');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    if (!isEditing) {
      setSelectedLanguage(newLanguage);
    }
  };

  const handleToggleEditMode = () => {
    setIsEditing(true);
  };

  const hasChanges = () => {
    const hasTranslationChanges = JSON.stringify(translations) !== JSON.stringify(originalTranslations);
    const hasImageChanges = Object.keys(modifiedImages).length > 0;
    const hasGalleryChanges = Object.keys(galleryChanges).length > 0;
    return hasTranslationChanges || hasImageChanges || hasGalleryChanges;
  };

  const getChangedTranslations = () => {
    if (!hasChanges()) return [];

    const changed = [];
    for (const [key, value] of Object.entries(translations)) {
      if (originalTranslations[key] !== value) {
        changed.push({ key, oldValue: originalTranslations[key], newValue: value });
      }
    }
    return changed;
  };

  const handleSave = () => {
    const changedTranslations = getChangedTranslations();
    const changedImages = Object.keys(modifiedImages);
    const changedGalleries = Object.keys(galleryChanges);

    if (changedTranslations.length === 0 && changedImages.length === 0 && changedGalleries.length === 0) {
      showToast('No hay cambios para guardar', 'info');
      return;
    }

    // Build confirmation message
    const messageParts = [];
    if (changedTranslations.length > 0) {
      messageParts.push(`${changedTranslations.length} traducción(es)`);
    }
    if (changedImages.length > 0) {
      messageParts.push(`${changedImages.length} imagen(es)`);
    }
    if (changedGalleries.length > 0) {
      // Count total gallery image changes
      let totalGalleryChanges = 0;
      changedGalleries.forEach(galleryName => {
        const changes = galleryChanges[galleryName];
        totalGalleryChanges += (changes.newImages?.length || 0);
        totalGalleryChanges += (changes.deletedImages?.length || 0);
      });
      if (totalGalleryChanges > 0) {
        messageParts.push(`${totalGalleryChanges} cambio(s) en galerías`);
      }
    }
    const message = `¿Estás seguro de que quieres guardar los cambios en ${messageParts.join(' y ')}?`;

    // Mostrar confirmaci�n antes de guardar
    setConfirmDialog({
      isOpen: true,
      title: 'Guardar cambios',
      message,
      type: 'info',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setIsSaving(true);

        try {
          const updatePromises = [];

          // Update all changed translations
          if (changedTranslations.length > 0) {
            const translationPromises = changedTranslations.map(({ key, newValue }) => (
              I18nService.updateTranslation(selectedLanguage, key, newValue))
            );
            updatePromises.push(...translationPromises);
          }

          // Update all changed images
          if (changedImages.length > 0) {
            const imagePromises = changedImages.map(imageName =>
              ImageService.updateImage(imageName, modifiedImages[imageName])
            );
            updatePromises.push(...imagePromises);
          }

          await Promise.all(updatePromises);

          // Process gallery changes sequentially (one by one)
          if (changedGalleries.length > 0) {
            for (const galleryName of changedGalleries) {
              const changes = galleryChanges[galleryName];

              // 1. Upload new images one by one and add to gallery
              if (changes.newImages && changes.newImages.length > 0) {
                for (let i = 0; i < changes.newImages.length; i++) {
                  const newImage = changes.newImages[i];
                  try {
                    // Upload the image first
                    const uploadedImage = await ImageService.uploadImage(newImage._file);
                    // Then add it to the gallery with the correct order
                    await ImageService.addImageToGallery(galleryName, uploadedImage.name, newImage.order);
                  } catch (error) {
                    console.error(`Error uploading image ${newImage.name}:`, error);
                    throw new Error(`Error al subir la imagen ${newImage.name}: ${error.message}`);
                  }
                }
              }

              // 2. Remove deleted images from gallery
              if (changes.deletedImages && changes.deletedImages.length > 0) {
                for (const deletedImage of changes.deletedImages) {
                  try {
                    await ImageService.removeImageFromGallery(galleryName, deletedImage.name);
                  } catch (error) {
                    console.error(`Error removing image ${deletedImage.name}:`, error);
                    throw new Error(`Error al eliminar la imagen ${deletedImage.name}: ${error.message}`);
                  }
                }
              }

              // 3. Update order of reordered images
              if (changes.reorderedImages && changes.reorderedImages.length > 0) {
                for (const reorderedImage of changes.reorderedImages) {
                  try {
                    await ImageService.updateImageOrder(galleryName, reorderedImage.name, reorderedImage.order);
                  } catch (error) {
                    console.error(`Error updating order for image ${reorderedImage.name}:`, error);
                    // Continue with other images even if one fails
                  }
                }
              }
            }
          }

          // Reload data from backend
          await loadTranslations();
          setModifiedImages({});
          setGalleryChanges({});

          // Update image refresh key to force image reload if images were changed
          if (changedImages.length > 0 || changedGalleries.length > 0) {
            setImageRefreshKey(Date.now());
          }

          setIsEditing(false);
          setIsSaving(false);

          // Show success toast
          const successParts = [];
          if (changedTranslations.length > 0) {
            successParts.push(`${changedTranslations.length} traducción(es)`);
          }
          if (changedImages.length > 0) {
            successParts.push(`${changedImages.length} imagen(es)`);
          }
          if (changedGalleries.length > 0) {
            successParts.push('cambios en galerías');
          }
          showToast(
            `${successParts.join(' y ')} actualizada(s) correctamente`,
            'success',
            4000
          );
        } catch (err) {
          console.error('Error saving changes:', err);
          setIsSaving(false);

          // Show error dialog
          setConfirmDialog({
            isOpen: true,
            title: 'Error al guardar',
            message: `No se pudieron guardar los cambios: ${err.message || 'Error desconocido'}`,
            type: 'danger',
            onConfirm: () => {
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
          });
        }
      }
    });
  };

  const handleCancel = () => {
    // Si no hay cambios, salir directamente del modo edici�n
    if (!hasChanges()) {
      setIsEditing(false);
      setModifiedImages({});
      setGalleryChanges({});
      return;
    }

    // Si hay cambios, mostrar confirmaci�n
    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar cambios',
      message: '¿Estás seguro de que quieres cancelar? Se perderán todos los cambios realizados.',
      type: 'danger',
      onConfirm: () => {
        setIsEditing(false);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        // Reset to original data
        setTranslations(JSON.parse(JSON.stringify(originalTranslations)));
        setModifiedImages({});
        setGalleryChanges({});
      }
    });
  };

  const handleTranslationsChange = (newTranslations) => {
    setTranslations(newTranslations);
  };

  const handleImageChange = (imageName, file) => {
    setModifiedImages(prev => {
      if (!file) {
        // Remove the image from modified images
        const newModified = { ...prev };
        delete newModified[imageName];
        return newModified;
      }
      // Add or update the image
      return {
        ...prev,
        [imageName]: file
      };
    });
  };

  const handleGalleryChange = (galleryName, changes) => {
    setGalleryChanges(prev => {
      if (!changes || (
        (!changes.newImages || changes.newImages.length === 0) &&
        (!changes.deletedImages || changes.deletedImages.length === 0) &&
        (!changes.reorderedImages || changes.reorderedImages.length === 0)
      )) {
        // Remove the gallery from changes if no changes
        const newChanges = { ...prev };
        delete newChanges[galleryName];
        return newChanges;
      }
      // Add or update the gallery changes
      return {
        ...prev,
        [galleryName]: changes
      };
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando traducciones...</p>
      </div>
    );
  }

  // Show error state
  if (error && !translations) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Error al cargar los datos: {error}</p>
        <Button
          variant="primary"
          onClick={loadTranslations}
          className={styles.retryButton}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.content}>
        <div className={styles.settingsContainer}>
          <div className={styles.viewContainer}>
            {/* Header with controls */}
            <div className={styles.header}>
              <div className={styles.headerTop}>
                {/* Title Section */}
                <div className={styles.titleWrapper}>
                  <h1 className={styles.pageTitle}>Configuración</h1>
                </div>

                {/* Controls Group */}
                <div className={styles.controlsGroup}>
                  {!isEditing ? (
                    <>
                      {/* Language Selector - Solo en modo visualizaci�n */}
                      <div className={styles.languageWrapper}>
                        <LanguageSelector
                          selectedLanguage={selectedLanguage}
                          onChange={handleLanguageChange}
                          disabled={false}
                        />
                      </div>

                      <div className={styles.controlDivider}></div>

                      {/* Edit Button */}
                      <div className={styles.buttonWrapper}>
                        <Button
                          variant="primary"
                          icon={Edit3}
                          onClick={handleToggleEditMode}
                        >
                          Editar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Save Button - En modo edici�n */}
                      <div className={styles.buttonWrapper}>
                        <Button
                          variant="success"
                          icon={Save}
                          onClick={handleSave}
                          disabled={!hasChanges() || isSaving}
                        >
                          {isSaving ? 'Guardando...' : 'Guardar'}
                        </Button>
                      </div>

                      <div className={styles.controlDivider}></div>

                      {/* Cancel Button - En modo edici�n */}
                      <div className={styles.buttonWrapper}>
                        <Button
                          variant="danger"
                          icon={X}
                          onClick={handleCancel}
                          disabled={isSaving}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content area */}
            {translations && (
              <div className={styles.formsContainer}>
                {/* Single Images Section */}
                <SingleImageForm
                  imageName="hero-main.jpg"
                  title="Fondo de inicio"
                  onChange={(file) => handleImageChange('hero-main', file)}
                  isEditing={isEditing}
                  refreshKey={imageRefreshKey}
                />
                {/* Gallery Section */}
                <MultiImageForm
                  galleryName="historia"
                  title="Galería de Historia"
                  onChange={(changes) => handleGalleryChange('historia', changes)}
                  isEditing={isEditing}
                  refreshKey={imageRefreshKey}
                />
                {/* Translations Section */}
                <TranslationsForm
                  translations={translations}
                  onChange={handleTranslationsChange}
                  errors={{}}
                  isEditing={isEditing}
                  language={selectedLanguage}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog.onConfirm && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          confirmText={confirmDialog.type === 'danger' ? 'Confirmar' : 'Aceptar'}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Saving Overlay */}
      <SavingOverlay isVisible={isSaving} />
    </>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

const SettingsPage = () => {
  return (
    <PageContainer>
      <div className={styles.settingsPage}>
        <SettingsContent />
      </div>
    </PageContainer>
  );
};

export default SettingsPage;
