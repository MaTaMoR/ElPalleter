import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Type
} from 'lucide-react';
import styles from './RichTextEditor.module.css';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const colorPresets = [
    '#000000', // Negro
    '#FF0000', // Rojo
    '#00FF00', // Verde
    '#0000FF', // Azul
    '#FFFF00', // Amarillo
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Naranja
    '#800080', // Púrpura
    '#A52A2A', // Marrón
    '#808080', // Gris
    '#FFFFFF', // Blanco
  ];

  const fontSizes = [
    { label: 'Normal', value: null },
    { label: 'H1', value: 1 },
    { label: 'H2', value: 2 },
    { label: 'H3', value: 3 },
  ];

  return (
    <div className={styles.menuBar}>
      {/* Undo/Redo */}
      <div className={styles.buttonGroup}>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={styles.menuButton}
          title="Deshacer"
        >
          <Undo size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={styles.menuButton}
          title="Rehacer"
        >
          <Redo size={18} />
        </button>
      </div>

      {/* Tamaño de texto */}
      <div className={styles.buttonGroup}>
        {fontSizes.map((size) => (
          <button
            key={size.label}
            onClick={() => {
              if (size.value === null) {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: size.value }).run();
              }
            }}
            className={`${styles.menuButton} ${
              size.value === null
                ? editor.isActive('paragraph') ? styles.isActive : ''
                : editor.isActive('heading', { level: size.value }) ? styles.isActive : ''
            }`}
            title={size.label}
          >
            {size.label === 'H1' && <Heading1 size={18} />}
            {size.label === 'H2' && <Heading2 size={18} />}
            {size.label === 'H3' && <Heading3 size={18} />}
            {size.label === 'Normal' && <Type size={18} />}
          </button>
        ))}
      </div>

      {/* Formato de texto */}
      <div className={styles.buttonGroup}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${styles.menuButton} ${editor.isActive('bold') ? styles.isActive : ''}`}
          title="Negrita"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${styles.menuButton} ${editor.isActive('italic') ? styles.isActive : ''}`}
          title="Cursiva"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${styles.menuButton} ${editor.isActive('underline') ? styles.isActive : ''}`}
          title="Subrayado"
        >
          <UnderlineIcon size={18} />
        </button>
      </div>

      {/* Listas */}
      <div className={styles.buttonGroup}>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${styles.menuButton} ${editor.isActive('bulletList') ? styles.isActive : ''}`}
          title="Lista con viñetas"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${styles.menuButton} ${editor.isActive('orderedList') ? styles.isActive : ''}`}
          title="Lista numerada"
        >
          <ListOrdered size={18} />
        </button>
      </div>

      {/* Alineación */}
      <div className={styles.buttonGroup}>
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`${styles.menuButton} ${editor.isActive({ textAlign: 'left' }) ? styles.isActive : ''}`}
          title="Alinear a la izquierda"
        >
          <AlignLeft size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`${styles.menuButton} ${editor.isActive({ textAlign: 'center' }) ? styles.isActive : ''}`}
          title="Centrar"
        >
          <AlignCenter size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`${styles.menuButton} ${editor.isActive({ textAlign: 'right' }) ? styles.isActive : ''}`}
          title="Alinear a la derecha"
        >
          <AlignRight size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`${styles.menuButton} ${editor.isActive({ textAlign: 'justify' }) ? styles.isActive : ''}`}
          title="Justificar"
        >
          <AlignJustify size={18} />
        </button>
      </div>

      {/* Selector de color */}
      <div className={styles.buttonGroup}>
        <div className={styles.colorPicker}>
          <label className={styles.colorLabel}>Color:</label>
          <div className={styles.colorGrid}>
            {colorPresets.map((color) => (
              <button
                key={color}
                onClick={() => editor.chain().focus().setColor(color).run()}
                className={`${styles.colorButton} ${
                  editor.isActive('textStyle', { color }) ? styles.isActive : ''
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const RichTextEditor = ({ value, onChange, placeholder = 'Escribe aquí...', disabled = false }) => {
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
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const html = editor.getHTML();
      if (onChange) {
        onChange({ json, html });
      }
    },
  });

  // Actualizar el contenido del editor cuando cambie el valor externo
  useEffect(() => {
    if (editor && value && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Actualizar el estado de edición cuando cambie disabled
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  return (
    <div className={`${styles.richTextEditor} ${disabled ? styles.disabled : ''}`}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className={styles.editorContent} />
    </div>
  );
};

export default RichTextEditor;
