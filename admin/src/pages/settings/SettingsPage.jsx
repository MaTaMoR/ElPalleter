import React, { useState, useRef, useCallback } from 'react';
import { Edit3, Save, X, Settings } from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import Button from '../../components/common/Button';
import LanguageSelector from '../../components/menu/utils/LanguageSelector';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ToastContainer from '../../components/common/ToastContainer';
import SavingOverlay from '../../components/common/SavingOverlay';
import TranslationsForm from '../../components/settings/TranslationsForm';
import SingleImageForm from '../../components/settings/SingleImageForm';
import MultiImageForm from '../../components/settings/MultiImageForm';
import RichContentForm from '../../components/settings/RichContentForm';
import styles from './SettingsPage.module.css';

// ============================================================================
// SETTINGS CONTENT COMPONENT
// ============================================================================

const SettingsContent = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs to child components
  const singleImageRef = useRef(null);
  const galleryRef = useRef(null);
  const richContentRef = useRef(null);
  const translationsRef = useRef(null);

  // Track which children have changes
  const [childrenHasChanges, setChildrenHasChanges] = useState({
    singleImage: false,
    gallery: false,
    richContent: false,
    translations: false
  });

  // Toast state
  const [toasts, setToasts] = useState([]);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: null,
    onCancel: null
  });

  // Toast handlers
  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const handleLanguageChange = (newLanguage) => {
    if (!isEditing) {
      setSelectedLanguage(newLanguage);
    }
  };

  const handleToggleEditMode = () => {
    setIsEditing(true);
  };

  const handleChildHasChangesChange = useCallback((childId, hasChanges) => {
    setChildrenHasChanges(prev => ({ ...prev, [childId]: hasChanges }));
  }, []);

  const hasChanges = () => {
    return Object.values(childrenHasChanges).some(hasChange => hasChange);
  };

  const handleSave = () => {
    if (!hasChanges()) {
      showToast('No hay cambios para guardar', 'info');
      return;
    }

    // Build confirmation message
    const messageParts = [];
    if (childrenHasChanges.singleImage) messageParts.push('imagen');
    if (childrenHasChanges.gallery) messageParts.push('galería');
    if (childrenHasChanges.richContent) messageParts.push('contenido rico');
    if (childrenHasChanges.translations) messageParts.push('traducciones');

    const message = `¿Estás seguro de que quieres guardar los cambios en ${messageParts.join(', ')}?`;

    // Show confirmation before saving
    setConfirmDialog({
      isOpen: true,
      title: 'Guardar cambios',
      message,
      type: 'info',
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setIsSaving(true);

        try {
          // Call save() on each child component that has changes
          const savePromises = [];

          if (childrenHasChanges.singleImage && singleImageRef.current) {
            savePromises.push(singleImageRef.current.save());
          }

          if (childrenHasChanges.gallery && galleryRef.current) {
            savePromises.push(galleryRef.current.save());
          }

          if (childrenHasChanges.richContent && richContentRef.current) {
            savePromises.push(richContentRef.current.save());
          }

          if (childrenHasChanges.translations && translationsRef.current) {
            savePromises.push(translationsRef.current.save());
          }

          await Promise.all(savePromises);

          // Reset children changes state
          setChildrenHasChanges({
            singleImage: false,
            gallery: false,
            richContent: false,
            translations: false
          });

          setIsEditing(false);
          setIsSaving(false);

          // Show success toast
          showToast(
            `Cambios guardados correctamente`,
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
            onCancel: null, // No show cancel button for error dialogs
            onConfirm: () => {
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
          });
        }
      }
    });
  };

  const handleCancel = () => {
    // If no changes, exit edit mode directly
    if (!hasChanges()) {
      setIsEditing(false);
      setChildrenHasChanges({
        singleImage: false,
        gallery: false,
        richContent: false,
        translations: false
      });
      return;
    }

    // If there are changes, show confirmation
    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar cambios',
      message: '¿Estás seguro de que quieres cancelar? Se perderán todos los cambios realizados.',
      type: 'danger',
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
      onConfirm: () => {
        setIsEditing(false);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));

        // Call cancel() on all child components
        if (singleImageRef.current) {
          singleImageRef.current.cancel();
        }
        if (galleryRef.current) {
          galleryRef.current.cancel();
        }
        if (richContentRef.current) {
          richContentRef.current.cancel();
        }
        if (translationsRef.current) {
          translationsRef.current.cancel();
        }

        // Reset children changes state
        setChildrenHasChanges({
          singleImage: false,
          gallery: false,
          richContent: false,
          translations: false
        });
      }
    });
  };

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
                  <Settings scale={24} />
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
            <div className={styles.formsContainer}>
              {/* Single Images Section */}
              <SingleImageForm
                id="singleImage"
                imageName="hero-main.jpg"
                title="Fondo de inicio"
                ref={singleImageRef}
                onHasChangesChange={handleChildHasChangesChange}
                isEditing={isEditing}
              />
              {/* Gallery Section */}
              <MultiImageForm
                id="gallery"
                galleryName="historia"
                title="Galería de Historia"
                ref={galleryRef}
                onHasChangesChange={handleChildHasChangesChange}
                isEditing={isEditing}
              />
              {/* Rich Content Section */}
              <RichContentForm
                id="richContent"
                contentKey="historia_content"
                title="Contenido de Historia"
                ref={richContentRef}
                onHasChangesChange={handleChildHasChangesChange}
                isEditing={isEditing}
              />
              {/* Translations Section */}
              <TranslationsForm
                id="translations"
                ref={translationsRef}
                language={selectedLanguage}
                onHasChangesChange={handleChildHasChangesChange}
                errors={{}}
                isEditing={isEditing}
              />
            </div>
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
          onCancel={confirmDialog.onCancel}
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
