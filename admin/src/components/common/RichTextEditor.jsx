import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { useEffect, useState } from 'react';
import { CirclePicker } from 'react-color';
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
  Type,
  Palette,
  Highlighter
} from 'lucide-react';
import styles from './RichTextEditor.module.css';

const ColorPicker = ({ editor, type = 'text', isOpen, onToggle, onClose }) => {
  const [customColor, setCustomColor] = useState('#000000');

  const colorPresets = [
    '#000000', // Negro
    '#374151', // Gris oscuro
    '#6B7280', // Gris
    '#EF4444', // Rojo
    '#F59E0B', // Naranja
    '#10B981', // Verde
    '#3B82F6', // Azul
    '#8B5CF6', // Púrpura
    '#EC4899', // Rosa
    '#FFFFFF', // Blanco
    '#FFEB3B', // Amarillo
    '#FF5722', // Naranja oscuro
  ];

  const applyColor = (color) => {
    if (type === 'text') {
      editor.chain().focus().setColor(color).run();
    } else {
      // Use setHighlight instead of toggleHighlight to always set the color
      editor.chain().focus().setHighlight({ color }).run();
    }
    setCustomColor(color);
  };

  const handleHexInputChange = (e) => {
    let hex = e.target.value;
    // Ensure it starts with #
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    setCustomColor(hex);

    // Only apply if it's a valid hex color
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      applyColor(hex);
    }
  };

  const removeColor = () => {
    if (type === 'text') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().unsetHighlight().run();
    }
    onClose();
  };

  return (
    <div className={styles.colorPickerWrapper}>
      <button
        onClick={onToggle}
        className={`${styles.menuButton} ${isOpen ? styles.isActive : ''}`}
        title={type === 'text' ? 'Color de texto' : 'Color de fondo'}
      >
        {type === 'text' ? <Palette size={18} /> : <Highlighter size={18} />}
      </button>

      {isOpen && (
        <div className={styles.colorPickerDropdown}>
          <div className={styles.colorPickerHeader}>
            <span className={styles.colorPickerTitle}>
              {type === 'text' ? 'Color de texto' : 'Color de fondo'}
            </span>
            <button
              onClick={onClose}
              className={styles.colorPickerClose}
            >
              ×
            </button>
          </div>

          <div className={styles.colorPickerContent}>
            {/* Color presets */}
            <div className={styles.colorPresetsLabel}>Colores predeterminados:</div>
            <div className={styles.colorPresetsGrid}>
              {colorPresets.map((color) => (
                <button
                  key={color}
                  onClick={() => applyColor(color)}
                  className={styles.colorButton}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Circle Picker */}
            <div className={styles.customColorSection}>
              <div className={styles.colorPresetsLabel}>Selector de color:</div>
              <div className={styles.circlePickerWrapper}>
                <CirclePicker
                  color={customColor}
                  onChange={(color) => applyColor(color.hex)}
                  colors={[
                    '#f44336', '#e91e63', '#9c27b0', '#673ab7',
                    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
                    '#009688', '#4caf50', '#8bc34a', '#cddc39',
                    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
                    '#795548', '#607d8b', '#000000', '#ffffff'
                  ]}
                  width="100%"
                />
              </div>
            </div>

            {/* Hex Input */}
            <div className={styles.hexInputSection}>
              <div className={styles.colorPresetsLabel}>Color personalizado:</div>
              <input
                type="text"
                value={customColor}
                onChange={handleHexInputChange}
                placeholder="#000000"
                className={styles.hexInput}
                maxLength={7}
              />
            </div>

            {/* Remove color button */}
            <button
              onClick={removeColor}
              className={styles.removeColorButton}
            >
              Quitar color
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuBar = ({ editor }) => {
  const [openPicker, setOpenPicker] = useState(null);

  if (!editor) {
    return null;
  }

  const fontSizes = [
    { label: 'Normal', value: null },
    { label: 'H1', value: 1 },
    { label: 'H2', value: 2 },
    { label: 'H3', value: 3 },
  ];

  const handleTogglePicker = (pickerType) => {
    setOpenPicker(openPicker === pickerType ? null : pickerType);
  };

  const handleClosePicker = () => {
    setOpenPicker(null);
  };

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

      {/* Selectores de color */}
      <div className={styles.buttonGroup}>
        <ColorPicker
          editor={editor}
          type="text"
          isOpen={openPicker === 'text'}
          onToggle={() => handleTogglePicker('text')}
          onClose={handleClosePicker}
        />
        <ColorPicker
          editor={editor}
          type="background"
          isOpen={openPicker === 'background'}
          onToggle={() => handleTogglePicker('background')}
          onClose={handleClosePicker}
        />
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
      Highlight.configure({
        multicolor: true,
      }),
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
