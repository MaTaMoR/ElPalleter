import React, { useState, useMemo, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import PropTypes from 'prop-types';
import { Search, Languages } from 'lucide-react';
import MenuTextField from '../menu/fields/MenuTextField';
import { I18nService } from '@services/I18nService';
import styles from './TranslationsForm.module.css';

/**
 * Form component for editing translations
 *
 * Exposes methods via ref:
 * - save(): Saves all changed translations
 * - cancel(): Discards changes and reloads original data
 * - hasChanges(): Returns true if there are pending changes
 */
const TranslationsForm = forwardRef(({
  language = 'es',
  onHasChangesChange,
  errors = {},
  isEditing = false
}, ref) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [translations, setTranslations] = useState(null);
  const [loading, setLoading] = useState(true);

  // Store original translations for comparison
  const originalTranslationsRef = useRef(null);

  // Load translations from service
  useEffect(() => {
    loadTranslations();
  }, [language]);

  const loadTranslations = () => {
    setLoading(true);
    try {
      const flatTranslations = I18nService.getAllTranslations(language);
      setTranslations(flatTranslations);
      originalTranslationsRef.current = flatTranslations;
    } catch (error) {
      console.error('Error loading translations:', error);
      setTranslations({});
      originalTranslationsRef.current = {};
    } finally {
      setLoading(false);
    }
  };

  // Check if there are any pending changes
  const checkHasChanges = () => {
    if (!translations || !originalTranslationsRef.current) return false;
    return JSON.stringify(translations) !== JSON.stringify(originalTranslationsRef.current);
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    save: async () => {
      if (!translations || !originalTranslationsRef.current) return;

      // Get changed translations
      const changedTranslations = [];
      for (const [key, value] of Object.entries(translations)) {
        if (originalTranslationsRef.current[key] !== value) {
          changedTranslations.push({ key, newValue: value });
        }
      }

      // Update all changed translations
      if (changedTranslations.length > 0) {
        const updatePromises = changedTranslations.map(({ key, newValue }) =>
          I18nService.updateTranslation(language, key, newValue)
        );
        await Promise.all(updatePromises);
      }

      // Reload translations
      loadTranslations();
    },

    cancel: () => {
      // Reload translations to discard changes
      loadTranslations();
    },

    hasChanges: () => {
      return checkHasChanges();
    }
  }), [translations, language]);

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

    // Filter matching translations by key only (not value to avoid disappearing during edit)
    const filtered = translationsArray.filter(({ key }) => {
      return key.toLowerCase().includes(lowerSearch);
    });

    // Sort by relevance when searching
    return filtered.sort((a, b) => {
      const aKeyLower = a.key.toLowerCase();
      const bKeyLower = b.key.toLowerCase();

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

      // 3. Within key matches, prefer lower level (less dots)
      if (a.level !== b.level) {
        return a.level - b.level;
      }

      // 4. Default: alphabetical by key
      return a.key.localeCompare(b.key);
    });
  }, [translations, searchTerm]);

  const handleTranslationChange = (key, newValue) => {
    const updatedTranslations = {
      ...translations,
      [key]: newValue
    };

    setTranslations(updatedTranslations);

    // Notify parent of changes
    if (onHasChangesChange) {
      const hasChanges = JSON.stringify(updatedTranslations) !== JSON.stringify(originalTranslationsRef.current);
      onHasChangesChange(hasChanges);
    }
  };

  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.translationsCard}>
          <div className={`${styles.cardHeader} ${styles.cardHeaderReadOnly}`}>
            <Languages size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Traducciones</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.emptyState}>Cargando traducciones...</div>
          </div>
        </div>
      </div>
    );
  }

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
                      autoResize
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
  language: PropTypes.string,
  onHasChangesChange: PropTypes.func,
  errors: PropTypes.object,
  isEditing: PropTypes.bool
};

export default TranslationsForm;
