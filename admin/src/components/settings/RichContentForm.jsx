import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { FileText } from 'lucide-react';
import RichTextEditor from '../common/RichTextEditor';
import { RichContentService } from '../../../../src/services/RichContentService';
import styles from './RichContentForm.module.css';

/**
 * Form component for editing rich text content
 * Supports single language editing (language selected in parent)
 *
 * Exposes methods via ref:
 * - save(): Saves the rich content for the current language
 * - cancel(): Discards changes and reloads original data
 * - hasChanges(): Returns true if there are pending changes
 */
const RichContentForm = forwardRef(({
  id,
  contentKey,
  title = 'Contenido Rico',
  language = 'es',
  onHasChangesChange,
  isEditing = false
}, ref) => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load content when component mounts or language changes
  useEffect(() => {
    loadContent();
  }, [contentKey, language]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load content from backend for current language
      const contentData = await RichContentService.getContentByLanguageAndKey(language, contentKey);

      const html = contentData?.contentValue || '';
      setContent(html);
      setOriginalContent(html);
    } catch (err) {
      // If content doesn't exist (404), start with empty content
      if (err.status === 404) {
        setContent('');
        setOriginalContent('');
      } else {
        console.error('Error loading rich content:', err);
        setError(err.message || 'Error al cargar el contenido');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if there are any pending changes
  const checkHasChanges = () => {
    return content !== originalContent;
  };

  // Notify parent of changes whenever content changes
  useEffect(() => {
    if (onHasChangesChange) {
      onHasChangesChange(id, checkHasChanges());
    }
  }, [content, originalContent, id, onHasChangesChange]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    save: async () => {
      try {
        console.log('Saving rich content:', contentKey, language, content);

        // Save content to backend using upsert (create or update)
        await RichContentService.upsertContent(language, contentKey, content);

        // Update original content after successful save
        setOriginalContent(content);
      } catch (err) {
        console.error('Error saving rich content:', err);
        throw new Error(`Error al guardar el contenido: ${err.message || 'Error desconocido'}`);
      }
    },

    cancel: () => {
      // Reload content to discard changes
      loadContent();
    },

    hasChanges: () => {
      return checkHasChanges();
    }
  }), [content, contentKey, language]);

  const handleContentChange = ({ html }) => {
    setContent(html);
  };

  const handleReset = () => {
    setContent(originalContent);
  };

  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.richContentCard}>
          <div className={`${styles.cardHeader} ${styles.cardHeaderReadOnly}`}>
            <FileText size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>{title}</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.emptyState}>Cargando contenido...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.richContentCard}>
          <div className={`${styles.cardHeader} ${styles.cardHeaderReadOnly}`}>
            <FileText size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>{title}</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.errorState}>Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isEditing) {
    // Read-only display
    return (
      <div className={styles.section}>
        <div className={styles.richContentCard}>
          <div className={`${styles.cardHeader} ${styles.cardHeaderReadOnly}`}>
            <FileText size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>{title}</h3>
          </div>
          <div className={styles.cardContent}>
            {content ? (
              <div
                className={styles.richContentDisplay}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className={styles.emptyState}>No hay contenido disponible</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className={styles.section}>
      <div className={styles.richContentCard}>
        <div className={styles.cardHeader}>
          <FileText size={20} className={styles.cardIcon} />
          <h3 className={styles.cardTitle}>{title}</h3>
        </div>
        <div className={styles.cardContent}>
          <RichTextEditor
            value={content}
            onChange={handleContentChange}
            placeholder={`Escribe el contenido en ${language}...`}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
});

RichContentForm.displayName = 'RichContentForm';

RichContentForm.propTypes = {
  id: PropTypes.string.isRequired,
  contentKey: PropTypes.string.isRequired,
  title: PropTypes.string,
  language: PropTypes.string,
  onHasChangesChange: PropTypes.func,
  isEditing: PropTypes.bool
};

export default RichContentForm;
