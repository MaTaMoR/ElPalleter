import React, { useState, useEffect } from 'react';
import PageContainer from '../../components/common/PageContainer';
import Button from '../../components/common/Button';
import ContactLayout from './ContactLayout';
import ContactInfoForm from '../../components/contact/ContactInfoForm';
import ScheduleForm from '../../components/contact/ScheduleForm';
import SocialMediaForm from '../../components/contact/SocialMediaForm';
import { ContactService } from '@services/ContactService';
import { useContactValidation } from '../../hooks/useContactValidation';
import styles from './ContactPage.module.css';

/**
 * ContactPage - Admin page for editing restaurant contact information
 * Similar structure to MenuPage but simpler - no navigation, breadcrumbs, or search
 */
const ContactContent = ({ loading, error, reload }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    try {
      const data = await ContactService.getContactData(selectedLanguage);
      setOriginalData(data);
      setContactData(data);
    } catch (err) {
      console.error('Error loading contact data:', err);
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

  const handleSave = async () => {
    if (hasErrors()) {
      alert('Por favor, corrija los errores de validación antes de guardar');
      return;
    }

    setIsSaving(true);
    try {
      await ContactService.updateRestaurantInfo(contactData, selectedLanguage);

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
    setContactData(JSON.parse(JSON.stringify(originalData)));
    setIsEditing(false);
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
  if (loading || !contactData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando información de contacto...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Error al cargar los datos: {error}</p>
        <Button
          variant="primary"
          onClick={reload}
          className={styles.retryButton}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <ContactLayout
      isEditing={isEditing}
      isSaving={isSaving}
      selectedLanguage={selectedLanguage}
      hasChanges={hasChanges()}
      onLanguageChange={handleLanguageChange}
      onEdit={handleToggleEditMode}
      onSave={handleSave}
      onCancel={handleCancel}
    >
      <div className={styles.contentCard}>
        {/* Contact Info Section */}
        {contactData.contactInfo && (
          <>
            <ContactInfoForm
              contactInfo={contactData.contactInfo}
              onChange={handleContactInfoChange}
              errors={validationErrors.contactInfo || {}}
              isEditing={isEditing}
            />

            <div className={styles.sectionDivider}></div>
          </>
        )}

        {/* Schedules Section */}
        {contactData.schedules && (
          <>
            <ScheduleForm
              schedules={contactData.schedules}
              onChange={handleSchedulesChange}
              errors={validationErrors.schedules || {}}
              isEditing={isEditing}
            />

            <div className={styles.sectionDivider}></div>
          </>
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
    </ContactLayout>
  );
};

/**
 * Main page component with data loading
 */
const ContactPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial load - just set loading to false
    // Actual data loading happens in ContactContent
    setLoading(false);
  }, []);

  const reload = () => {
    setLoading(true);
    setError(null);
    // Trigger reload by toggling loading state
    setTimeout(() => setLoading(false), 100);
  };

  return (
    <PageContainer>
      <div className={styles.contactPage}>
        <ContactContent loading={loading} error={error} reload={reload} />
      </div>
    </PageContainer>
  );
};

export default ContactPage;
