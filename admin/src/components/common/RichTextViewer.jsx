import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { useEffect } from 'react';
import styles from './RichTextViewer.module.css';

/**
 * Componente para mostrar contenido de texto rico (solo lectura)
 *
 * @param {Object} props
 * @param {string|Object} props.content - Contenido en formato HTML o JSON de TipTap
 * @param {string} props.className - Clase CSS adicional
 */
const RichTextViewer = ({ content, className = '' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
    ],
    content: content || '',
    editable: false,
    editorProps: {
      attributes: {
        class: styles.viewerContent,
      },
    },
  });

  // Actualizar el contenido cuando cambie
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!content) {
    return <div className={styles.emptyContent}>No hay contenido para mostrar</div>;
  }

  return (
    <div className={`${styles.richTextViewer} ${className}`}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextViewer;
