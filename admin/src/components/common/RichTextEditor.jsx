import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Extension } from '@tiptap/core';
import BoldExtension from '@tiptap/extension-bold';
import { useEffect, useState, useRef, useCallback } from 'react';
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

// Custom Color extension that preserves inline colors from any element
const CustomColor = Color.extend({
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          color: {
            default: null,
            parseHTML: (element) => {
              // Extract color from style attribute of ANY element
              // This includes <strong>, <em>, <span>, etc.
              return element.style.color || null;
            },
            renderHTML: (attributes) => {
              if (!attributes.color) {
                return {};
              }
              return {
                style: `color: ${attributes.color}`,
              };
            },
          },
        },
      },
    ];
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

// Color presets constants
const TEXT_COLOR_PRESETS = [
  '#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505', '#BD10E0',
  '#9013FE', '#4A90E2', '#50E3C2', '#B8E986', '#000000', '#4A4A4A', '#9B9B9B'
];

const HIGHLIGHT_COLOR_PRESETS = [
  '#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505', '#BD10E0',
  '#9013FE', '#4A90E2', '#50E3C2', '#B8E986', '#000000', '#4A4A4A', '#9B9B9B'
];

const BACKGROUND_COLOR_PRESETS = [
  '#FFFFFF', '#F9FAFB', '#F3F4F6', '#FEF3C7', '#FEE2E2', '#DBEAFE', '#D1FAE5',
  '#E0E7FF', '#FCE7F3', '#F5F3FF', '#FED7AA', '#E5E7EB', '#1F2937', '#0A0A0A'
];

const TEXT_COLOR_DEFAULT_COLOR = '#FFFFFF';
const HIGHLIGHT_COLOR_DEFAULT_COLOR = '#FFFF00';
const BACKGROUND_DEFAULT_COLOR = '#000000';

// Unified Color Picker Component
const ColorPickerButton = ({
  title,
  icon,
  presetColors,
  defaultColor = '#000000',
  currentColor,
  isOpen,
  onToggle,
  onClose,
  onColorChange,
  onRemove,
  removeButtonText = 'Quitar color',
}) => {
  const [pickerPosition, setPickerPosition] = useState(null);
  const buttonRef = useRef(null);

  // Calculate picker position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPickerPosition({
        top: rect.bottom + 8,
        left: rect.left
      });

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
  }, [isOpen, onClose]);

  const handleColorChange = useCallback((color) => {
    if (onColorChange) {
      onColorChange(color.hex);
    }
  }, [onColorChange]);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove();
    }
    onClose();
  }, [onRemove, onClose]);

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
                color={currentColor || defaultColor}
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
  const savedTextColorSelection = useRef(null);
  const savedHighlightSelection = useRef(null);
  const isColorPickerActive = useRef(false);
  
  // Store the color when picker opens (to handle multi-color selections)
  const [activeTextColor, setActiveTextColor] = useState(null);
  const [activeHighlightColor, setActiveHighlightColor] = useState(null);

  // Force re-render when editor selection changes (but not when color picker is active)
  useEffect(() => {
    if (!editor) return;

    const updateHandler = () => {
      // Don't force update while color picker is active to prevent drag interruption
      if (!isColorPickerActive.current) {
        forceUpdate({});
      }
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

  // Helper function to check if selection has consistent color
  const getSelectionColor = (attributeType) => {
    const { from, to } = editor.state.selection;
    
    // If no selection (cursor only), return current mark color
    if (from === to) {
      if (attributeType === 'color') {
        return editor.getAttributes('textStyle').color || null;
      } else {
        return editor.getAttributes('highlight').color || null;
      }
    }
    
    let foundColor = undefined; // undefined = not found yet
    let isConsistent = true;
    
    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      // Stop if already inconsistent
      if (!isConsistent) return false;
      
      // Only process text nodes
      if (!node.isText) return;
      
      // Calculate overlap between this text node and our selection
      const nodeStart = pos;
      const nodeEnd = pos + node.nodeSize;
      const overlapStart = Math.max(from, nodeStart);
      const overlapEnd = Math.min(to, nodeEnd);
      
      // Skip if no actual overlap
      if (overlapStart >= overlapEnd) return;
      
      // Get color from this text node's marks
      let colorInNode = null;
      for (const mark of node.marks) {
        if (attributeType === 'color' && mark.type.name === 'textStyle' && mark.attrs.color) {
          colorInNode = mark.attrs.color;
          break;
        } else if (attributeType === 'highlight' && mark.type.name === 'highlight' && mark.attrs.color) {
          colorInNode = mark.attrs.color;
          break;
        }
      }
      
      // Check consistency
      if (foundColor === undefined) {
        foundColor = colorInNode;
      } else if (foundColor !== colorInNode) {
        isConsistent = false;
      }
    });
    
    // Return color only if consistent, otherwise null (will use default)
    return isConsistent ? (foundColor ?? null) : null;
  };

  // Picker handlers
  const handleTogglePicker = (pickerType) => {
    const newState = openPicker === pickerType ? null : pickerType;

    // Save selection when opening text color picker
    if (newState === 'text') {
      const { from, to } = editor.state.selection;
      savedTextColorSelection.current = { from, to };
      isColorPickerActive.current = true;
      // Get current color of selection (or null if multiple colors)
      setActiveTextColor(TEXT_COLOR_DEFAULT_COLOR);
    }

    // Save selection when opening highlight picker
    if (newState === 'highlight') {
      const { from, to } = editor.state.selection;
      savedHighlightSelection.current = { from, to };
      isColorPickerActive.current = true;
      // Get current highlight color of selection (or null if multiple colors)
      setActiveHighlightColor(HIGHLIGHT_COLOR_DEFAULT_COLOR);
    }

    if (newState === 'editorBackground') {
      isColorPickerActive.current = true;
    }

    // If closing picker, mark as inactive and clear active colors
    if (newState === null) {
      isColorPickerActive.current = false;
      setActiveTextColor(null);
      setActiveHighlightColor(null);
    }

    setOpenPicker(newState);
  };

  const handleClosePicker = () => {
    isColorPickerActive.current = false;
    setOpenPicker(null);
  };

  // Undo/Redo handlers
  const handleUndo = () => {
    editor.chain().focus().undo().run();
  };

  const handleRedo = () => {
    editor.chain().focus().redo().run();
  };

  // Font size handlers
  const handleFontSizeChange = (value) => {
    if (value === null) {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(value).run();
    }
  };

  // Text formatting handlers
  const handleToggleBold = () => {
    editor.chain().focus().toggleBold().run();
  };

  const handleToggleItalic = () => {
    editor.chain().focus().toggleItalic().run();
  };

  const handleToggleUnderline = () => {
    editor.chain().focus().toggleUnderline().run();
  };

  // List handlers
  const handleToggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
  };

  const handleToggleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run();
  };

  // Alignment handlers
  const handleSetTextAlign = (alignment) => {
    editor.chain().focus().setTextAlign(alignment).run();
  };

  // Color handlers - DON'T use focus() to avoid stealing focus from slider
  const handleTextColorChange = useCallback((hexColor) => {
    if (savedTextColorSelection.current) {
      const { from, to } = savedTextColorSelection.current;
      if (from !== to) {
        // Use withoutFocus pattern: set selection and color without stealing focus
        editor
          .chain()
          .setTextSelection({ from, to })
          .setColor(hexColor)
          .run();
      }
    }
  }, [editor]);

  const handleTextColorRemove = useCallback(() => {
    editor.chain().focus().unsetColor().run();
  }, [editor]);

  const handleHighlightColorChange = useCallback((hexColor) => {
    if (savedHighlightSelection.current) {
      const { from, to } = savedHighlightSelection.current;
      if (from !== to) {
        // Use withoutFocus pattern: set selection and highlight without stealing focus
        editor
          .chain()
          .setTextSelection({ from, to })
          .setHighlight({ color: hexColor })
          .run();
      }
    }
  }, [editor]);

  const handleHighlightRemove = useCallback(() => {
    editor.chain().focus().unsetHighlight().run();
  }, [editor]);

  const handleEditorBackgroundReset = useCallback(() => {
    onEditorBackgroundChange(BACKGROUND_DEFAULT_COLOR);
  }, [onEditorBackgroundChange]);

  return (
    <div className={styles.menuBar}>
      {/* Undo/Redo/Reset */}
      <div className={styles.buttonGroup}>
        <button
          onClick={handleUndo}
          disabled={!editor.can().undo()}
          className={styles.menuButton}
          title="Deshacer"
        >
          <Undo size={18} />
        </button>
        <button
          onClick={handleRedo}
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
              onClick={() => handleFontSizeChange(size.value)}
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
          onClick={handleToggleBold}
          className={`${styles.menuButton} ${editor.isActive('bold') ? styles.isActive : ''}`}
          title="Negrita"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={handleToggleItalic}
          className={`${styles.menuButton} ${editor.isActive('italic') ? styles.isActive : ''}`}
          title="Cursiva"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={handleToggleUnderline}
          className={`${styles.menuButton} ${editor.isActive('underline') ? styles.isActive : ''}`}
          title="Subrayado"
        >
          <UnderlineIcon size={18} />
        </button>
      </div>

      {/* Listas */}
      <div className={styles.buttonGroup}>
        <button
          onClick={handleToggleBulletList}
          className={`${styles.menuButton} ${editor.isActive('bulletList') ? styles.isActive : ''}`}
          title="Lista con viñetas"
        >
          <List size={18} />
        </button>
        <button
          onClick={handleToggleOrderedList}
          className={`${styles.menuButton} ${editor.isActive('orderedList') ? styles.isActive : ''}`}
          title="Lista numerada"
        >
          <ListOrdered size={18} />
        </button>
      </div>

      {/* Alineación */}
      <div className={styles.buttonGroup}>
        <button
          onClick={() => handleSetTextAlign('left')}
          className={`${styles.menuButton} ${editor.isActive({ textAlign: 'left' }) ? styles.isActive : ''}`}
          title="Alinear a la izquierda"
        >
          <AlignLeft size={18} />
        </button>
        <button
          onClick={() => handleSetTextAlign('center')}
          className={`${styles.menuButton} ${editor.isActive({ textAlign: 'center' }) ? styles.isActive : ''}`}
          title="Centrar"
        >
          <AlignCenter size={18} />
        </button>
        <button
          onClick={() => handleSetTextAlign('right')}
          className={`${styles.menuButton} ${editor.isActive({ textAlign: 'right' }) ? styles.isActive : ''}`}
          title="Alinear a la derecha"
        >
          <AlignRight size={18} />
        </button>
        <button
          onClick={() => handleSetTextAlign('justify')}
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
          presetColors={TEXT_COLOR_PRESETS}
          defaultColor={TEXT_COLOR_DEFAULT_COLOR}
          currentColor={activeTextColor}
          isOpen={openPicker === 'text'}
          onToggle={() => handleTogglePicker('text')}
          onClose={handleClosePicker}
          onColorChange={handleTextColorChange}
          onRemove={handleTextColorRemove}
          removeButtonText="Quitar color"
        />
        <ColorPickerButton
          title="Resaltar texto"
          icon={<Highlighter size={18} />}
          presetColors={HIGHLIGHT_COLOR_PRESETS}
          defaultColor={HIGHLIGHT_COLOR_DEFAULT_COLOR}
          currentColor={activeHighlightColor}
          isOpen={openPicker === 'highlight'}
          onToggle={() => handleTogglePicker('highlight')}
          onClose={handleClosePicker}
          onColorChange={handleHighlightColorChange}
          onRemove={handleHighlightRemove}
          removeButtonText="Quitar resaltado"
        />
        <ColorPickerButton
          title="Fondo del editor"
          icon={<PaintBucket size={18} />}
          presetColors={BACKGROUND_COLOR_PRESETS}
          defaultColor={BACKGROUND_DEFAULT_COLOR}
          currentColor={editorBackgroundColor}
          isOpen={openPicker === 'editorBackground'}
          onToggle={() => handleTogglePicker('editorBackground')}
          onClose={handleClosePicker}
          onColorChange={onEditorBackgroundChange}
          onRemove={handleEditorBackgroundReset}
          removeButtonText="Restablecer fondo"
        />
      </div>
    </div>
  );
};

const RichTextEditor = ({ value, onChange, placeholder = 'Escribe aquí...', disabled = false, onReset }) => {
  const [editorBackgroundColor, setEditorBackgroundColor] = useState(BACKGROUND_DEFAULT_COLOR);

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
      CustomColor, // Use custom color that preserves inline styles from any element
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

  const handleEditorBackgroundChange = useCallback((color) => {
    setEditorBackgroundColor(color);
  }, []);

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