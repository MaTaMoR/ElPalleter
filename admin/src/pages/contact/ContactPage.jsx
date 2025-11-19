import React, { useState, useEffect } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import Button from '../../components/common/Button';
import LanguageSelector from '../../components/menu/utils/LanguageSelector';
import { ContactRepository } from '../../repositories/ContactRepository';
import { useContactValidation } from '../../hooks/useContactValidation';
import styles from './ContactPage.module.css';

/**
 * ContactPage - Admin page for editing restaurant contact information
 * Simpler than MenuPage - no navigation, breadcrumbs, or search needed
 */
const ContactPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Original data from backend
  const [originalData, setOriginalData] = useState(null);
  // Current editing data
  const [contactData, setContactData] = useState(null);

  // Validation
  const { validationErrors, hasErrors } = useContactValidation(contactData, isEditing);

  // Load data from backend
  useEffect(() => {
    loadContactData();
  }, [selectedLanguage]);

  const loadContactData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await ContactRepository.getTranslatedRestaurantInfo(selectedLanguage);
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

  const handleSave = async () => {
    if (hasErrors()) {
      alert('Por favor, corrija los errores de validación antes de guardar');
      return;
    }

    setIsSaving(true);
    try {
      await ContactRepository.updateRestaurantInfo(contactData, selectedLanguage);

      // Reload data from backend
      await loadContactData();
      setIsEditing(false);
      alert('Datos guardados correctamente');
    } catch (err) {
      console.error('Error saving contact data:', err);
      alert('Error al guardar: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    setContactData(originalData);
    setIsEditing(false);
  };

  // Show loading state
  if (loading) {
    return (
      <PageContainer>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando información de contacto...</p>
        </div>
      </PageContainer>
    );
  }

  // Show error state
  if (error && !contactData) {
    return (
      <PageContainer>
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
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className={styles.contactPage}>
        {/* Header with controls */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.titleSection}>
              <h1 className={styles.pageTitle}>Información de Contacto</h1>
            </div>

            {/* Controls Group */}
            <div className={styles.controlsGroup}>
              {!isEditing ? (
                <>
                  {/* Language Selector - Only in view mode */}
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
                  {/* Save Button - In edit mode */}
                  <div className={styles.buttonWrapper}>
                    <Button
                      variant="success"
                      icon={Save}
                      onClick={handleSave}
                      disabled={hasErrors() || isSaving}
                    >
                      {isSaving ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>

                  <div className={styles.controlDivider}></div>

                  {/* Cancel Button - In edit mode */}
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
        <div className={styles.content}>
          <div className={styles.contentCard}>
            {/* TODO: Add contact info form components here */}
            <div className={styles.section}>
              <h2>Información de Contacto</h2>
              {contactData && contactData.contactInfo && (
                <div className={styles.infoGrid}>
                  <div><strong>Calle:</strong> {contactData.contactInfo.street}</div>
                  <div><strong>Código Postal:</strong> {contactData.contactInfo.postalCode}</div>
                  <div><strong>Ciudad:</strong> {contactData.contactInfo.city}</div>
                  <div><strong>Provincia:</strong> {contactData.contactInfo.province}</div>
                  <div><strong>País:</strong> {contactData.contactInfo.country}</div>
                  <div><strong>Teléfono:</strong> {contactData.contactInfo.phoneMain}</div>
                  <div><strong>Email:</strong> {contactData.contactInfo.emailMain}</div>
                  <div><strong>Web:</strong> {contactData.contactInfo.website}</div>
                </div>
              )}
            </div>

            {/* Validation errors display (for testing) */}
            {isEditing && hasErrors() && (
              <div className={styles.validationSummary}>
                <h3>Errores de validación:</h3>
                <pre>{JSON.stringify(validationErrors, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ContactPage;
