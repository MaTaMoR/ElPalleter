import React from 'react';
import PropTypes from 'prop-types';
import MenuTextField from '../menu/fields/MenuTextField';
import styles from './ContactInfoForm.module.css';

/**
 * Form component for editing contact information
 * Reuses MenuTextField components from menu module
 */
const ContactInfoForm = ({
  contactInfo,
  onChange,
  errors = {},
  isEditing = false
}) => {
  const handleFieldChange = (field, value) => {
    if (onChange) {
      onChange({
        ...contactInfo,
        [field]: value
      });
    }
  };

  if (!isEditing) {
    // Read-only display
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Información de Contacto</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <strong>Calle:</strong> {contactInfo.street}
          </div>
          <div className={styles.infoItem}>
            <strong>Código Postal:</strong> {contactInfo.postalCode}
          </div>
          <div className={styles.infoItem}>
            <strong>Ciudad:</strong> {contactInfo.city}
          </div>
          <div className={styles.infoItem}>
            <strong>Provincia:</strong> {contactInfo.province}
          </div>
          <div className={styles.infoItem}>
            <strong>País:</strong> {contactInfo.country}
          </div>
          <div className={styles.infoItem}>
            <strong>Teléfono:</strong> {contactInfo.phoneMain}
          </div>
          <div className={styles.infoItem}>
            <strong>Email:</strong> {contactInfo.emailMain}
          </div>
          <div className={styles.infoItem}>
            <strong>Sitio Web:</strong> {contactInfo.website || 'No especificado'}
          </div>
        </div>
      </div>
    );
  }

  // Editable form
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Información de Contacto</h2>
      <div className={styles.formGrid}>
        <div className={styles.fullWidth}>
          <MenuTextField
            label="Calle"
            value={contactInfo.street}
            onChange={(value) => handleFieldChange('street', value)}
            error={errors.street}
            required
            placeholder="Calle Ejemplo, 123"
            helperText="Dirección completa de la calle"
          />
        </div>

        <MenuTextField
          label="Código Postal"
          value={contactInfo.postalCode}
          onChange={(value) => handleFieldChange('postalCode', value)}
          error={errors.postalCode}
          required
          placeholder="03720"
          helperText="5 dígitos"
        />

        <MenuTextField
          label="Ciudad"
          value={contactInfo.city}
          onChange={(value) => handleFieldChange('city', value)}
          error={errors.city}
          required
          placeholder="Benissa"
        />

        <MenuTextField
          label="Provincia"
          value={contactInfo.province}
          onChange={(value) => handleFieldChange('province', value)}
          error={errors.province}
          required
          placeholder="Alicante"
        />

        <MenuTextField
          label="País"
          value={contactInfo.country}
          onChange={(value) => handleFieldChange('country', value)}
          error={errors.country}
          required
          placeholder="España"
        />

        <MenuTextField
          label="Teléfono Principal"
          value={contactInfo.phoneMain}
          onChange={(value) => handleFieldChange('phoneMain', value)}
          error={errors.phoneMain}
          required
          placeholder="+34 965 123 456"
          helperText="Formato internacional: +XX XXX XXX XXX"
        />

        <MenuTextField
          label="Email Principal"
          value={contactInfo.emailMain}
          onChange={(value) => handleFieldChange('emailMain', value)}
          error={errors.emailMain}
          required
          placeholder="info@restaurante.com"
        />

        <MenuTextField
          label="Sitio Web"
          value={contactInfo.website}
          onChange={(value) => handleFieldChange('website', value)}
          error={errors.website}
          placeholder="https://restaurante.com"
          helperText="Opcional"
        />
      </div>
    </div>
  );
};

ContactInfoForm.propTypes = {
  contactInfo: PropTypes.shape({
    street: PropTypes.string,
    postalCode: PropTypes.string,
    city: PropTypes.string,
    province: PropTypes.string,
    country: PropTypes.string,
    phoneMain: PropTypes.string,
    emailMain: PropTypes.string,
    website: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func,
  errors: PropTypes.object,
  isEditing: PropTypes.bool
};

export default ContactInfoForm;
