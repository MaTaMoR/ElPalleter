import React, { useState, useEffect, useCallback } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import Button from '../../components/common/Button';
import LanguageSelector from '../../components/menu/utils/LanguageSelector';
import ConfirmDialog from '../../components/menu/utils/ConfirmDialog';
import ToastContainer from '../../components/common/ToastContainer';
import TranslationsForm from '../../components/settings/TranslationsForm';
import SingleImageForm from '../../components/settings/SingleImageForm';
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
    return hasTranslationChanges || hasImageChanges;
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

    if (changedTranslations.length === 0 && changedImages.length === 0) {
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

          // Reload data from backend
          await loadTranslations();
          setModifiedImages({});

          // Update image refresh key to force image reload if images were changed
          if (changedImages.length > 0) {
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
                {/* Translations Section */}
                <TranslationsForm
                  translations={translations}
                  onChange={handleTranslationsChange}
                  errors={{}}
                  isEditing={isEditing}
                  language={selectedLanguage}
                />

                {/* Images Section */}
                <SingleImageForm
                  imageName="hero-main"
                  title="Fondo de inicio"
                  onChange={(file) => handleImageChange('hero-main', file)}
                  isEditing={isEditing}
                  refreshKey={imageRefreshKey}
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
      {isSaving && (
        <div className={styles.savingOverlay}>
          <div className={styles.savingContent}>
            <div className={styles.savingSpinner}></div>
            <p className={styles.savingText}>Guardando...</p>
          </div>
        </div>
      )}
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
