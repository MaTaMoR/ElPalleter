import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Extension } from '@tiptap/core';
import { useEffect, useState, useRef } from 'react';
import CustomColorPicker from './CustomColorPicker';

// FontSize extension for inline font size control
const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});
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

// Unified Color Picker Component
const ColorPickerButton = ({
  title,
  icon,
  presetColors,
  defaultColor = '#000000',
  isOpen,
  onToggle,
  onClose,
  onColorChange,
  onRemove,
  removeButtonText = 'Quitar color',
  editor = null,
  type = null, // 'text' | 'highlight' | null (for custom handlers)
}) => {
  const [customColor, setCustomColor] = useState(defaultColor);
  const [pickerPosition, setPickerPosition] = useState(null);
  const [savedSelection, setSavedSelection] = useState(null);
  const hasAppliedRef = useRef(false);
  const buttonRef = useRef(null);

  // Calculate picker position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPickerPosition({
        top: rect.bottom + 8,
        left: rect.left
      });

      // Save current selection (only for editor-based pickers)
      if (editor && type) {
        const { from, to } = editor.state.selection;
        setSavedSelection({ from, to });
        hasAppliedRef.current = false;

        // Get current color from selection
        const currentColor = type === 'text'
          ? editor.getAttributes('textStyle').color
          : editor.getAttributes('highlight').color;

        setCustomColor(currentColor || defaultColor);
      }

      // Close picker on scroll
      const handleScroll = () => {
        onClose();
      };

      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
      };
    } else {
      setPickerPosition(null);
    }
  }, [isOpen, onClose, editor, type, defaultColor]);

  const handleColorChange = (color) => {
    const hexColor = color.hex;
    setCustomColor(hexColor);

    // Handle editor-based color changes
    if (editor && type && savedSelection) {
      if (!hasAppliedRef.current) {
        hasAppliedRef.current = true;
      }

      // Restore selection and apply color
      if (savedSelection.from !== savedSelection.to) {
        editor.chain()
          .focus()
          .setTextSelection(savedSelection)
          .run();

        if (type === 'text') {
          editor.chain().setColor(hexColor).run();
        } else if (type === 'highlight') {
          editor.chain().setHighlight({ color: hexColor }).run();
        }
      }
    }

    // Handle custom color change callback
    if (onColorChange) {
      onColorChange(hexColor);
    }
  };

  const handleRemove = () => {
    if (editor && type) {
      if (type === 'text') {
        editor.chain().focus().unsetColor().run();
      } else if (type === 'highlight') {
        editor.chain().focus().unsetHighlight().run();
      }
    }

    if (onRemove) {
      onRemove();
    }

    onClose();
  };

  return (
    <div className={styles.colorPickerWrapper}>
      <button
        ref={buttonRef}
        onClick={onToggle}
        className={`${styles.menuButton} ${isOpen ? styles.isActive : ''}`}
        title={title}
      >
        {icon}
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
              <span className={styles.colorPickerTitle}>{title}</span>
              <button onClick={onClose} className={styles.colorPickerClose}>×</button>
            </div>

            <div className={styles.colorPickerContent}>
              <CustomColorPicker
                color={customColor}
                onChange={handleColorChange}
                presetColors={presetColors}
                onRemove={handleRemove}
                removeButtonText={removeButtonText}
              />
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
    { label: 'Grande', value: '1.5em' },
    { label: 'Mediano', value: '1.25em' },
    { label: 'Pequeño', value: '0.875em' },
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
          const fontSize = editor.getAttributes('textStyle').fontSize;
          const isActive = size.value === null
            ? !fontSize
            : fontSize === size.value;

          return (
            <button
              key={size.label}
              onClick={() => {
                if (size.value === null) {
                  editor.chain().focus().unsetFontSize().run();
                } else {
                  editor.chain().focus().setFontSize(size.value).run();
                }
              }}
              className={`${styles.menuButton} ${isActive ? styles.isActive : ''}`}
              title={size.label}
            >
              {size.label === 'Normal' && <Type size={18} />}
              {size.label === 'Grande' && <Heading1 size={18} />}
              {size.label === 'Mediano' && <Heading2 size={18} />}
              {size.label === 'Pequeño' && <Heading3 size={18} />}
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
        <ColorPickerButton
          title="Color de texto"
          icon={<Palette size={18} />}
          presetColors={[
            '#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505', '#BD10E0',
            '#9013FE', '#4A90E2', '#50E3C2', '#B8E986', '#000000', '#4A4A4A', '#9B9B9B'
          ]}
          defaultColor="#000000"
          editor={editor}
          type="text"
          isOpen={openPicker === 'text'}
          onToggle={() => handleTogglePicker('text')}
          onClose={handleClosePicker}
          removeButtonText="Quitar color"
        />
        <ColorPickerButton
          title="Resaltar texto"
          icon={<Highlighter size={18} />}
          presetColors={[
            '#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505', '#BD10E0',
            '#9013FE', '#4A90E2', '#50E3C2', '#B8E986', '#000000', '#4A4A4A', '#9B9B9B'
          ]}
          defaultColor="#FFFF00"
          editor={editor}
          type="highlight"
          isOpen={openPicker === 'highlight'}
          onToggle={() => handleTogglePicker('highlight')}
          onClose={handleClosePicker}
          removeButtonText="Quitar resaltado"
        />
        <ColorPickerButton
          title="Fondo del editor"
          icon={<PaintBucket size={18} />}
          presetColors={[
            '#FFFFFF', '#F9FAFB', '#F3F4F6', '#FEF3C7', '#FEE2E2', '#DBEAFE', '#D1FAE5',
            '#E0E7FF', '#FCE7F3', '#F5F3FF', '#FED7AA', '#E5E7EB', '#1F2937', '#0A0A0A'
          ]}
          defaultColor="#FFFFFF"
          isOpen={openPicker === 'editorBackground'}
          onToggle={() => handleTogglePicker('editorBackground')}
          onClose={handleClosePicker}
          onColorChange={onEditorBackgroundChange}
          onRemove={() => onEditorBackgroundChange('#FFFFFF')}
          removeButtonText="Restablecer fondo"
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
      FontSize,
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
