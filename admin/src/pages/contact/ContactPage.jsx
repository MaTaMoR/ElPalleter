import React, { useState, useEffect, useCallback } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import Button from '../../components/common/Button';
import LanguageSelector from '../../components/menu/utils/LanguageSelector';
import ConfirmDialog from '../../components/menu/utils/ConfirmDialog';
import ToastContainer from '../../components/common/ToastContainer';
import ContactInfoForm from '../../components/contact/ContactInfoForm';
import ScheduleForm from '../../components/contact/ScheduleForm';
import SocialMediaForm from '../../components/contact/SocialMediaForm';
import { ContactService } from '@services/ContactService';
import { useContactValidation } from '../../hooks/useContactValidation';
import styles from './ContactPage.module.css';

// ============================================================================
// CONTACT CONTENT COMPONENT
// ============================================================================

const ContactContent = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Original data from backend
  const [originalData, setOriginalData] = useState(null);
  // Current editing data
  const [contactData, setContactData] = useState(null);

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

  // Validation
  const { validationErrors, hasErrors } = useContactValidation(contactData, isEditing);

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
    loadContactData();
  }, [selectedLanguage]);

  const loadContactData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ContactService.getContactData(selectedLanguage);
      setOriginalData(data);
      setContactData(data);
    } catch (err) {
      console.error('Error loading contact data:', err);
      setError(err.message || 'Error al cargar los datos de contacto');
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
    return JSON.stringify(contactData) !== JSON.stringify(originalData);
  };

  const handleSave = () => {
    // Verificar errores de validación primero
    if (hasErrors()) {
      setConfirmDialog({
        isOpen: true,
        title: 'Errores de validación',
        message: 'No se puede guardar porque hay errores de validación en los datos de contacto.',
        type: 'danger',
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    // Mostrar confirmación antes de guardar
    setConfirmDialog({
      isOpen: true,
      title: 'Guardar cambios',
      message: '¿Estás seguro de que quieres guardar todos los cambios en la información de contacto?',
      type: 'info',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setIsSaving(true);

        try {
          await ContactService.updateRestaurantInfo(contactData, selectedLanguage);

          // Reload data from backend
          await loadContactData();
          setIsEditing(false);
          setIsSaving(false);

          // Show success toast
          showToast('Los cambios se han guardado correctamente', 'success', 4000);
        } catch (err) {
          console.error('Error saving contact data:', err);
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
    // Si no hay cambios, salir directamente del modo edición
    if (!hasChanges()) {
      setIsEditing(false);
      return;
    }

    // Si hay cambios, mostrar confirmación
    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar cambios',
      message: '¿Estás seguro de que quieres cancelar? Se perderán todos los cambios realizados.',
      type: 'danger',
      onConfirm: () => {
        setIsEditing(false);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        // Reset to original data
        setContactData(JSON.parse(JSON.stringify(originalData)));
      }
    });
  };

  const handleContactInfoChange = (newContactInfo) => {
    setContactData({
      ...contactData,
      contactInfo: newContactInfo
    });
  };

  const handleSchedulesChange = (newSchedules) => {
    setContactData({
      ...contactData,
      schedules: newSchedules
    });
  };

  const handleSocialMediasChange = (newSocialMedias) => {
    setContactData({
      ...contactData,
      socialMedias: newSocialMedias
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando información de contacto...</p>
      </div>
    );
  }

  // Show error state
  if (error && !contactData) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Error al cargar los datos: {error}</p>
        <Button
          variant="primary"
          onClick={loadContactData}
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
        <div className={styles.contactContainer}>
          <div className={styles.viewContainer}>
            {/* Header with controls */}
            <div className={styles.header}>
              <div className={styles.headerTop}>
                {/* Title Section */}
                <div className={styles.titleWrapper}>
                  <h1 className={styles.pageTitle}>Información de contacto</h1>
                </div>

                {/* Controls Group */}
                <div className={styles.controlsGroup}>
                  {!isEditing ? (
                    <>
                      {/* Language Selector - Solo en modo visualización */}
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
            {contactData && (
              <div className={styles.formsContainer}>
                {/* Contact Info Section */}
                {contactData.contactInfo && (
                  <ContactInfoForm
                    contactInfo={contactData.contactInfo}
                    onChange={handleContactInfoChange}
                    errors={validationErrors.contactInfo || {}}
                    isEditing={isEditing}
                  />
                )}

                {/* Schedules Section */}
                {contactData.schedules && (
                  <ScheduleForm
                    schedules={contactData.schedules}
                    onChange={handleSchedulesChange}
                    errors={validationErrors.schedules || {}}
                    isEditing={isEditing}
                  />
                )}

                {/* Social Medias Section */}
                {contactData.socialMedias && (
                  <SocialMediaForm
                    socialMedias={contactData.socialMedias}
                    onChange={handleSocialMediasChange}
                    errors={validationErrors.socialMedias || {}}
                    isEditing={isEditing}
                  />
                )}
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
    </>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

const ContactPage = () => {
  return (
    <PageContainer>
      <div className={styles.contactPage}>
        <ContactContent />
      </div>
    </PageContainer>
  );
};

export default ContactPage;
