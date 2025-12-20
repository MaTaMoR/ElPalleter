import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import RichTextEditor from '../common/RichTextEditor';
import LanguageSelector from '../menu/utils/LanguageSelector';
import { FileText } from 'lucide-react';
import styles from './RichContentForm.module.css';

/**
 * Formulario para editar contenido de texto rico
 * Soporta múltiples idiomas
 */
const RichContentForm = forwardRef(({
  id,
  contentKey,
  title,
  onHasChangesChange,
  isEditing
}, ref) => {
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [content, setContent] = useState({
    es: { html: '' },
    en: { html: '' },
    val: { html: '' }
  });
  const [originalContent, setOriginalContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar contenido al montar el componente
  useEffect(() => {
    loadContent();
  }, [contentKey]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar el archivo rich-content.json
      const response = await fetch('/data/rich-content.json');
      if (!response.ok) {
        throw new Error('Error al cargar el contenido');
      }

      const data = await response.json();
      const contentData = data[contentKey];

      if (contentData) {
        setContent(contentData);
        setOriginalContent(JSON.parse(JSON.stringify(contentData)));
      } else {
        // Si no existe, crear estructura vacía
        const emptyContent = {
          es: { html: '' },
          en: { html: '' },
          val: { html: '' }
        };
        setContent(emptyContent);
        setOriginalContent(JSON.parse(JSON.stringify(emptyContent)));
      }
    } catch (err) {
      console.error('Error loading content:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar si hay cambios
  const hasChanges = () => {
    if (!originalContent) return false;

    return Object.keys(content).some(lang => {
      return content[lang].html !== originalContent[lang].html;
    });
  };

  // Notificar al padre cuando hay cambios
  useEffect(() => {
    if (onHasChangesChange) {
      onHasChangesChange(id, hasChanges());
    }
  }, [content, originalContent, id, onHasChangesChange]);

  // Manejar cambio de contenido en el editor
  const handleContentChange = ({ html }) => {
    setContent(prev => ({
      ...prev,
      [selectedLanguage]: { html }
    }));
  };

  // Exponer métodos al componente padre a través de ref
  useImperativeHandle(ref, () => ({
    save: async () => {
      // Aquí deberías implementar la lógica para guardar en el backend
      // Por ahora solo simularemos el guardado
      console.log('Saving rich content:', contentKey, content);

      // Simulación de guardado (reemplazar con llamada real al backend)
      return new Promise((resolve) => {
        setTimeout(() => {
          setOriginalContent(JSON.parse(JSON.stringify(content)));
          resolve();
        }, 1000);
      });
    },
    cancel: () => {
      // Restaurar contenido original
      if (originalContent) {
        setContent(JSON.parse(JSON.stringify(originalContent)));
      }
    }
  }));

  const handleLanguageChange = (lang) => {
    if (!isEditing) {
      setSelectedLanguage(lang);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.formSection}>
        <div className={styles.sectionHeader}>
          <FileText size={20} />
          <h2 className={styles.sectionTitle}>{title}</h2>
        </div>
        <div className={styles.loading}>Cargando contenido...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.formSection}>
        <div className={styles.sectionHeader}>
          <FileText size={20} />
          <h2 className={styles.sectionTitle}>{title}</h2>
        </div>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.formSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.titleGroup}>
          <FileText size={20} />
          <h2 className={styles.sectionTitle}>{title}</h2>
        </div>

        {!isEditing && (
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onChange={handleLanguageChange}
            disabled={isEditing}
          />
        )}
      </div>

      {isEditing && (
        <div className={styles.languageTabs}>
          {Object.keys(content).map(lang => (
            <button
              key={lang}
              className={`${styles.languageTab} ${selectedLanguage === lang ? styles.active : ''}`}
              onClick={() => setSelectedLanguage(lang)}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <div className={styles.editorContainer}>
        <RichTextEditor
          value={content[selectedLanguage]?.html || ''}
          onChange={handleContentChange}
          disabled={!isEditing}
          placeholder={`Escribe el contenido en ${selectedLanguage}...`}
        />
      </div>

      {hasChanges() && isEditing && (
        <div className={styles.changesIndicator}>
          Hay cambios sin guardar en este contenido
        </div>
      )}
    </div>
  );
});

RichContentForm.displayName = 'RichContentForm';

export default RichContentForm;
