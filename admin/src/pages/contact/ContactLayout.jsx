import React from 'react';
import { Edit3, Save, X } from 'lucide-react';
import Button from '../../components/common/Button';
import LanguageSelector from '../../components/menu/utils/LanguageSelector';
import styles from './ContactPage.module.css';

/**
 * Layout component for contact page
 * Includes header with language selector and edit controls
 */
const ContactLayout = ({
  isEditing,
  isSaving,
  selectedLanguage,
  hasChanges,
  onLanguageChange,
  onEdit,
  onSave,
  onCancel,
  children
}) => {
  return (
    <div className={styles.viewContainer}>
      {/* Header with controls */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          {/* Title Section */}
          <div className={styles.titleWrapper}>
            <h1 className={styles.pageTitle}>Información de Contacto</h1>
          </div>

          {/* Controls Group */}
          <div className={styles.controlsGroup}>
            {/* Conditional controls based on edit mode */}
            {!isEditing ? (
              <>
                {/* Language Selector - Solo en modo visualización */}
                <div className={styles.languageWrapper}>
                  <LanguageSelector
                    selectedLanguage={selectedLanguage}
                    onChange={onLanguageChange}
                    disabled={false}
                  />
                </div>

                <div className={styles.controlDivider}></div>

                {/* Edit Button */}
                <div className={styles.buttonWrapper}>
                  <Button
                    variant="primary"
                    icon={Edit3}
                    onClick={onEdit}
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
                    onClick={onSave}
                    disabled={!hasChanges || isSaving}
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
                    onClick={onCancel}
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
        {children}
      </div>
    </div>
  );
};

export default ContactLayout;
