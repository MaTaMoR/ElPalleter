import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Search, Languages } from 'lucide-react';
import MenuTextField from '../menu/fields/MenuTextField';
import styles from './TranslationsForm.module.css';

/**
 * Form component for editing translations
 */
const TranslationsForm = ({
  translations,
  onChange,
  errors = {},
  isEditing = false,
  language = 'es'
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter translations based on search term
  const filteredTranslations = useMemo(() => {
    if (!translations || typeof translations !== 'object') {
      return [];
    }

    const translationsArray = Object.entries(translations).map(([key, value]) => ({
      key,
      value: value || ''
    }));

    if (!searchTerm.trim()) {
      return translationsArray;
    }

    const lowerSearch = searchTerm.toLowerCase().trim();

    return translationsArray.filter(({ key, value }) => {
      return (
        key.toLowerCase().includes(lowerSearch) ||
        value.toLowerCase().includes(lowerSearch)
      );
    });
  }, [translations, searchTerm]);

  const handleTranslationChange = (key, newValue) => {
    if (!onChange) return;

    const updatedTranslations = {
      ...translations,
      [key]: newValue
    };

    onChange(updatedTranslations);
  };

  if (!isEditing) {
    // Read-only display
    return (
      <div className={styles.section}>
        <div className={styles.translationsCard}>
          <div className={`${styles.cardHeader} ${styles.cardHeaderReadOnly}`}>
            <Languages size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Traducciones</h3>
          </div>
          <div className={styles.cardContent}>
            {/* Search Box */}
            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Buscar por clave o traducción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Translations List */}
            <div className={styles.translationsList}>
              {filteredTranslations.length === 0 ? (
                <div className={styles.emptyState}>
                  {searchTerm ? (
                    <p>No se encontraron traducciones que coincidan con "{searchTerm}"</p>
                  ) : (
                    <p>No hay traducciones disponibles</p>
                  )}
                </div>
              ) : (
                filteredTranslations.map(({ key, value }) => (
                  <div key={key} className={styles.translationItem}>
                    <div className={styles.translationKey}>
                      <strong>{key}</strong>
                    </div>
                    <div className={styles.translationValue}>
                      <span>{value || '(vacío)'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Results count */}
            {searchTerm && filteredTranslations.length > 0 && (
              <div className={styles.resultsCount}>
                Mostrando {filteredTranslations.length} de {Object.keys(translations).length} traducciones
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className={styles.section}>
      <div className={styles.translationsCard}>
        <div className={styles.cardHeader}>
          <Languages size={20} className={styles.cardIcon} />
          <h3 className={styles.cardTitle}>Traducciones - {language.toUpperCase()}</h3>
        </div>
        <div className={styles.cardContent}>
          {/* Search Box */}
          <div className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar por clave o traducción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Translations List - Editable */}
          <div className={styles.translationsList}>
            {filteredTranslations.length === 0 ? (
              <div className={styles.emptyState}>
                {searchTerm ? (
                  <p>No se encontraron traducciones que coincidan con "{searchTerm}"</p>
                ) : (
                  <p>No hay traducciones disponibles</p>
                )}
              </div>
            ) : (
              filteredTranslations.map(({ key, value }) => (
                <div key={key} className={styles.translationItemEdit}>
                  <div className={styles.translationKeyLabel}>
                    <label htmlFor={`translation-${key}`}>{key}</label>
                  </div>
                  <div className={styles.translationValueInput}>
                    <MenuTextField
                      id={`translation-${key}`}
                      value={value}
                      onChange={(newValue) => handleTranslationChange(key, newValue)}
                      error={errors[key]}
                      placeholder="Ingresa la traducción..."
                      multiline
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Results count */}
          {searchTerm && filteredTranslations.length > 0 && (
            <div className={styles.resultsCount}>
              Editando {filteredTranslations.length} de {Object.keys(translations).length} traducciones
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

TranslationsForm.propTypes = {
  translations: PropTypes.object,
  onChange: PropTypes.func,
  errors: PropTypes.object,
  isEditing: PropTypes.bool,
  language: PropTypes.string
};

export default TranslationsForm;
