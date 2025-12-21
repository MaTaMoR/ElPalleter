import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { useEffect, useState, useRef } from 'react';
import CustomColorPicker from './CustomColorPicker';
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
  Highlighter,
  PaintBucket,
  RotateCcw
} from 'lucide-react';
import styles from './RichTextEditor.module.css';

const ColorPicker = ({ editor, type = 'text', isOpen, onToggle, onClose }) => {
  const [customColor, setCustomColor] = useState('#000000');
  const [pickerPosition, setPickerPosition] = useState(null);
  const [savedSelection, setSavedSelection] = useState(null);
  const [initialColor, setInitialColor] = useState('#000000');
  const hasAppliedRef = useRef(false);
  const buttonRef = useRef(null);

  const colorPresets = [
    '#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505', '#BD10E0',
    '#9013FE', '#4A90E2', '#50E3C2', '#B8E986', '#000000', '#4A4A4A', '#9B9B9B'
  ];

  // Calculate picker position and save selection when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPickerPosition({
        top: rect.bottom + 8,
        left: rect.left
      });

      // Save current selection
      const { from, to } = editor.state.selection;
      setSavedSelection({ from, to });
      hasAppliedRef.current = false;

      // Get current color from selection
      const currentColor = type === 'text'
        ? editor.getAttributes('textStyle').color
        : editor.getAttributes('highlight').color;

      setCustomColor(currentColor || '#000000');
      setInitialColor(currentColor || '#000000');
    } else {
      setPickerPosition(null);
    }
  }, [isOpen]);

  const handleColorChange = (color) => {
    const hexColor = color.hex;
    setCustomColor(hexColor);

    // Only apply if user has interacted
    if (!hasAppliedRef.current) {
      hasAppliedRef.current = true;
    }

    // Restore selection and apply color
    if (savedSelection && savedSelection.from !== savedSelection.to) {
      editor.chain()
        .focus()
        .setTextSelection(savedSelection)
        .run();

      if (type === 'text') {
        editor.chain().setColor(hexColor).run();
      } else {
        editor.chain().setHighlight({ color: hexColor }).run();
      }
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

  const getTitle = () => {
    if (type === 'text') return 'Color de texto';
    return 'Resaltar texto';
  };

  return (
    <div className={styles.colorPickerWrapper}>
      <button
        ref={buttonRef}
        onClick={onToggle}
        className={`${styles.menuButton} ${isOpen ? styles.isActive : ''}`}
        title={getTitle()}
      >
        {type === 'text' ? <Palette size={18} /> : <Highlighter size={18} />}
      </button>

      {isOpen && pickerPosition && (
        <>
          {/* Backdrop to close picker when clicking outside */}
          <div className={styles.colorPickerBackdrop} onClick={onClose} />

          {/* Picker with fixed position */}
          <div
            className={styles.colorPickerDropdownFixed}
            style={{
              top: `${pickerPosition.top}px`,
              left: `${pickerPosition.left}px`
            }}
          >
            <div className={styles.colorPickerHeader}>
              <span className={styles.colorPickerTitle}>{getTitle()}</span>
              <button onClick={onClose} className={styles.colorPickerClose}>×</button>
            </div>

            <div className={styles.colorPickerContent}>
              <CustomColorPicker
                color={customColor}
                onChange={handleColorChange}
                presetColors={colorPresets}
              />

              <div className={styles.colorPickerFooter}>
                <button onClick={removeColor} className={styles.removeColorButton}>
                  Quitar color
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Background Color Picker for editor container (visual only, not saved)
const BackgroundColorPicker = ({ isOpen, onToggle, onClose, onColorChange }) => {
  const [customColor, setCustomColor] = useState('#FFFFFF');
  const [pickerPosition, setPickerPosition] = useState(null);
  const buttonRef = useRef(null);

  const backgroundPresets = [
    '#FFFFFF', '#F9FAFB', '#F3F4F6', '#FEF3C7', '#FEE2E2', '#DBEAFE', '#D1FAE5',
    '#E0E7FF', '#FCE7F3', '#F5F3FF', '#FED7AA', '#E5E7EB', '#1F2937', '#0A0A0A'
  ];

  // Calculate picker position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPickerPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    } else {
      setPickerPosition(null);
    }
  }, [isOpen]);

  const handleColorChange = (color) => {
    const hexColor = color.hex;
    setCustomColor(hexColor);
    if (onColorChange) {
      onColorChange(hexColor);
    }
  };

  const resetBackground = () => {
    setCustomColor('#FFFFFF');
    if (onColorChange) {
      onColorChange('#FFFFFF');
    }
    onClose();
  };

  return (
    <div className={styles.colorPickerWrapper}>
      <button
        ref={buttonRef}
        onClick={onToggle}
        className={`${styles.menuButton} ${isOpen ? styles.isActive : ''}`}
        title="Color de fondo del editor"
      >
        <PaintBucket size={18} />
      </button>

      {isOpen && pickerPosition && (
        <>
          {/* Backdrop to close picker when clicking outside */}
          <div className={styles.colorPickerBackdrop} onClick={onClose} />

          {/* Picker with fixed position */}
          <div
            className={styles.colorPickerDropdownFixed}
            style={{
              top: `${pickerPosition.top}px`,
              left: `${pickerPosition.left}px`
            }}
          >
            <div className={styles.colorPickerHeader}>
              <span className={styles.colorPickerTitle}>Fondo del editor</span>
              <button onClick={onClose} className={styles.colorPickerClose}>×</button>
            </div>

            <div className={styles.colorPickerContent}>
              <CustomColorPicker
                color={customColor}
                onChange={handleColorChange}
                presetColors={backgroundPresets}
              />

              <div className={styles.colorPickerFooter}>
                <button onClick={resetBackground} className={styles.removeColorButton}>
                  Restablecer fondo
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const MenuBar = ({ editor, onReset, editorBackgroundColor, onEditorBackgroundChange }) => {
  const [openPicker, setOpenPicker] = useState(null);
  const [, forceUpdate] = useState({});

  // Force re-render when editor selection changes
  useEffect(() => {
    if (!editor) return;

    const updateHandler = () => {
      forceUpdate({});
    };

    editor.on('selectionUpdate', updateHandler);
    editor.on('transaction', updateHandler);

    return () => {
      editor.off('selectionUpdate', updateHandler);
      editor.off('transaction', updateHandler);
    };
  }, [editor]);

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
      {/* Undo/Redo/Reset */}
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
        {onReset && (
          <button
            onClick={onReset}
            className={styles.menuButton}
            title="Deshacer todos los cambios"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>

      {/* Tamaño de texto */}
      <div className={styles.buttonGroup}>
        {fontSizes.map((size) => {
          const isActive = size.value === null
            ? !editor.isActive('heading')
            : editor.isActive('heading', { level: size.value });

          return (
            <button
              key={size.label}
              onClick={() => {
                if (size.value === null) {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor.chain().focus().toggleHeading({ level: size.value }).run();
                }
              }}
              className={`${styles.menuButton} ${isActive ? styles.isActive : ''}`}
              title={size.label}
            >
              {size.label === 'H1' && <Heading1 size={18} />}
              {size.label === 'H2' && <Heading2 size={18} />}
              {size.label === 'H3' && <Heading3 size={18} />}
              {size.label === 'Normal' && <Type size={18} />}
            </button>
          );
        })}
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
          isOpen={openPicker === 'highlight'}
          onToggle={() => handleTogglePicker('highlight')}
          onClose={handleClosePicker}
        />
        <BackgroundColorPicker
          isOpen={openPicker === 'editorBackground'}
          onToggle={() => handleTogglePicker('editorBackground')}
          onClose={handleClosePicker}
          onColorChange={onEditorBackgroundChange}
        />
      </div>
    </div>
  );
};

const RichTextEditor = ({ value, onChange, placeholder = 'Escribe aquí...', disabled = false, onReset }) => {
  const [editorBackgroundColor, setEditorBackgroundColor] = useState('#FFFFFF');

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

  const handleEditorBackgroundChange = (color) => {
    setEditorBackgroundColor(color);
  };

  return (
    <div className={`${styles.richTextEditor} ${disabled ? styles.disabled : ''}`}>
      <MenuBar
        editor={editor}
        onReset={onReset}
        editorBackgroundColor={editorBackgroundColor}
        onEditorBackgroundChange={handleEditorBackgroundChange}
      />
      <EditorContent
        editor={editor}
        className={styles.editorContent}
        style={{ backgroundColor: editorBackgroundColor }}
      />
    </div>
  );
};

export default RichTextEditor;
