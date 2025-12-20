import React, { useState, useRef, useCallback } from 'react';
import { Edit3, Save, X, FileText } from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ToastContainer from '../../components/common/ToastContainer';
import SavingOverlay from '../../components/common/SavingOverlay';
import RichContentForm from '../../components/settings/RichContentForm';
import styles from './ContentPage.module.css';

// ============================================================================
// CONTENT PAGE CONTENT COMPONENT
// ============================================================================

const ContentPageContent = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs to child components
  const historiaRef = useRef(null);

  // Track which children have changes
  const [childrenHasChanges, setChildrenHasChanges] = useState({
    historia: false
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
    if (childrenHasChanges.historia) messageParts.push('contenido de historia');

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

          if (childrenHasChanges.historia && historiaRef.current) {
            savePromises.push(historiaRef.current.save());
          }

          await Promise.all(savePromises);

          // Reset children changes state
          setChildrenHasChanges({
            historia: false
          });

          setIsEditing(false);
          setIsSaving(false);

          // Show success toast
          showToast(
            'Cambios guardados correctamente',
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
        historia: false
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
        if (historiaRef.current) {
          historiaRef.current.cancel();
        }

        // Reset children changes state
        setChildrenHasChanges({
          historia: false
        });
      }
    });
  };

  return (
    <>
      <div className={styles.content}>
        <div className={styles.contentContainer}>
          <div className={styles.viewContainer}>
            {/* Header with controls */}
            <div className={styles.header}>
              <div className={styles.headerTop}>
                {/* Title Section */}
                <div className={styles.titleWrapper}>
                  <FileText size={24} />
                  <h1 className={styles.pageTitle}>Contenido Rico</h1>
                </div>

                {/* Controls Group */}
                <div className={styles.controlsGroup}>
                  {!isEditing ? (
                    <>
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
                      {/* Save Button - En modo edición */}
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

                      {/* Cancel Button - En modo edición */}
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
              {/* Historia Rich Content Section */}
              <RichContentForm
                id="historia"
                contentKey="historia_content"
                title="Contenido de Historia"
                ref={historiaRef}
                onHasChangesChange={handleChildHasChangesChange}
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

const ContentPage = () => {
  return (
    <PageContainer>
      <div className={styles.contentPage}>
        <ContentPageContent />
      </div>
    </PageContainer>
  );
};

export default ContentPage;
