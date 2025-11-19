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

  // Filter and sort translations based on search term
  const filteredTranslations = useMemo(() => {
    if (!translations || typeof translations !== 'object') {
      return [];
    }

    const translationsArray = Object.entries(translations).map(([key, value]) => ({
      key,
      value: value || '',
      level: (key.match(/\./g) || []).length // Count dots to determine depth
    }));

    // If no search, sort by level (shallow first)
    if (!searchTerm.trim()) {
      return translationsArray.sort((a, b) => {
        if (a.level !== b.level) {
          return a.level - b.level; // Lower level first
        }
        return a.key.localeCompare(b.key); // Alphabetical if same level
      });
    }

    const lowerSearch = searchTerm.toLowerCase().trim();

    // Filter matching translations
    const filtered = translationsArray.filter(({ key, value }) => {
      return (
        key.toLowerCase().includes(lowerSearch) ||
        value.toLowerCase().includes(lowerSearch)
      );
    });

    // Sort by relevance when searching
    return filtered.sort((a, b) => {
      const aKeyLower = a.key.toLowerCase();
      const bKeyLower = b.key.toLowerCase();
      const aValueLower = a.value.toLowerCase();
      const bValueLower = b.value.toLowerCase();

      // 1. Exact key match has highest priority
      const aExactKey = aKeyLower === lowerSearch;
      const bExactKey = bKeyLower === lowerSearch;
      if (aExactKey && !bExactKey) return -1;
      if (!aExactKey && bExactKey) return 1;

      // 2. Key starts with search term
      const aKeyStarts = aKeyLower.startsWith(lowerSearch);
      const bKeyStarts = bKeyLower.startsWith(lowerSearch);
      if (aKeyStarts && !bKeyStarts) return -1;
      if (!aKeyStarts && bKeyStarts) return 1;

      // 3. Key contains search term (already filtered)
      const aKeyContains = aKeyLower.includes(lowerSearch);
      const bKeyContains = bKeyLower.includes(lowerSearch);
      if (aKeyContains && !bKeyContains) return -1;
      if (!aKeyContains && bKeyContains) return 1;

      // 4. Within key matches, prefer lower level (less dots)
      if (aKeyContains && bKeyContains) {
        if (a.level !== b.level) {
          return a.level - b.level;
        }
      }

      // 5. Value exact match
      const aExactValue = aValueLower === lowerSearch;
      const bExactValue = bValueLower === lowerSearch;
      if (aExactValue && !bExactValue) return -1;
      if (!aExactValue && bExactValue) return 1;

      // 6. Value starts with search
      const aValueStarts = aValueLower.startsWith(lowerSearch);
      const bValueStarts = bValueLower.startsWith(lowerSearch);
      if (aValueStarts && !bValueStarts) return -1;
      if (!aValueStarts && bValueStarts) return 1;

      // 7. Default: alphabetical by key
      return a.key.localeCompare(b.key);
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
