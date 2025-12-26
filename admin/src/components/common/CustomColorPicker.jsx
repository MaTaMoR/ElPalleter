import { useState, useEffect, useRef } from 'react';
import styles from './CustomColorPicker.module.css';

// Convert HSV to RGB
const hsvToRgb = (h, s, v) => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
};

// Convert RGB to HSV
const rgbToHsv = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
};

// Convert HEX to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Convert RGB to HEX
const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const CustomColorPicker = ({ color = '#4F46E5', onChange, presetColors = [], onRemove, removeButtonText = 'Quitar color' }) => {
  // Initialize HSV from color prop using lazy initialization
  const [hue, setHue] = useState(() => {
    const rgb = hexToRgb(color);
    return rgb ? rgbToHsv(rgb.r, rgb.g, rgb.b).h : 0;
  });

  const [saturation, setSaturation] = useState(() => {
    const rgb = hexToRgb(color);
    return rgb ? rgbToHsv(rgb.r, rgb.g, rgb.b).s : 1;
  });

  const [value, setValue] = useState(() => {
    const rgb = hexToRgb(color);
    return rgb ? rgbToHsv(rgb.r, rgb.g, rgb.b).v : 1;
  });

  const [alpha, setAlpha] = useState(1);
  const [mode, setMode] = useState('hex'); // 'hex' or 'rgb'
  const [isAdvanced, setIsAdvanced] = useState(false);

  const canvasRef = useRef(null);
  const isDraggingCanvas = useRef(false);
  const isDraggingHue = useRef(false);
  const isDraggingAlpha = useRef(false);

  // Helper function to notify parent of color changes
  const notifyColorChange = (h, s, v, a) => {
    if (onChange) {
      const rgb = hsvToRgb(h, s, v);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      onChange({
        hex,
        rgb,
        hsv: { h, s, v },
        alpha: a
      });
    }
  };

  // Draw saturation/value canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Draw hue background
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(0, 0, width, height);

    // Draw saturation gradient (white to transparent)
    const saturationGradient = ctx.createLinearGradient(0, 0, width, 0);
    saturationGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    saturationGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = saturationGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw value gradient (transparent to black)
    const valueGradient = ctx.createLinearGradient(0, 0, 0, height);
    valueGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    valueGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = valueGradient;
    ctx.fillRect(0, 0, width, height);
  }, [hue, isAdvanced]);

  const handleCanvasInteraction = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const newSaturation = x / rect.width;
    const newValue = 1 - (y / rect.height);

    setSaturation(newSaturation);
    setValue(newValue);
    notifyColorChange(hue, newSaturation, newValue, alpha);
  };

  const handleHueChange = (e) => {
    const slider = e.currentTarget;
    const rect = slider.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newHue = (x / rect.width) * 360;

    setHue(newHue);
    notifyColorChange(newHue, saturation, value, alpha);
  };

  const handleAlphaChange = (e) => {
    const slider = e.currentTarget;
    const rect = slider.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newAlpha = x / rect.width;

    setAlpha(newAlpha);
    notifyColorChange(hue, saturation, value, newAlpha);
  };

  const handleMouseMove = (e) => {
    if (isDraggingCanvas.current) {
      handleCanvasInteraction(e);
    } else if (isDraggingHue.current) {
      handleHueChange(e);
    } else if (isDraggingAlpha.current) {
      handleAlphaChange(e);
    }
  };

  const handleMouseUp = () => {
    isDraggingCanvas.current = false;
    isDraggingHue.current = false;
    isDraggingAlpha.current = false;
  };

  useEffect(() => {
    const moveHandler = (e) => handleMouseMove(e);
    const upHandler = () => handleMouseUp();

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);

    return () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    };
  }, [hue, saturation, value, alpha]);

  const currentRgb = hsvToRgb(hue, saturation, value);
  const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);

  const handleHexInput = (e) => {
    let hex = e.target.value;
    if (!hex.startsWith('#')) hex = '#' + hex;

    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      const rgb = hexToRgb(hex);
      if (rgb) {
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        setHue(hsv.h);
        setSaturation(hsv.s);
        setValue(hsv.v);
        notifyColorChange(hsv.h, hsv.s, hsv.v, alpha);
      }
    }
  };

  const handleRgbInput = (channel, value) => {
    const num = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newRgb = { ...currentRgb, [channel]: num };
    const hsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setValue(hsv.v);
    notifyColorChange(hsv.h, hsv.s, hsv.v, alpha);
  };

  const handleAlphaInput = (e) => {
    const num = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
    const newAlpha = num / 100;
    setAlpha(newAlpha);
    notifyColorChange(hue, saturation, value, newAlpha);
  };

  const handlePresetClick = (presetHex) => {
    const rgb = hexToRgb(presetHex);
    if (rgb) {
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
      notifyColorChange(hsv.h, hsv.s, hsv.v, alpha);
    }
  };

  return (
    <div className={styles.colorPicker}>
      {/* Preset Colors - Always at top */}
      {presetColors.length > 0 && (
        <div className={styles.presetsSection}>
          <div className={styles.presetsLabel}>Colores predeterminados</div>
          <div className={styles.presetsGrid}>
            {presetColors.map((presetColor, index) => (
              <button
                key={index}
                className={styles.presetColor}
                style={{ backgroundColor: presetColor }}
                onClick={() => handlePresetClick(presetColor)}
                title={presetColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Advanced Editor - Conditionally shown */}
      {isAdvanced && (
        <div className={styles.advancedSection}>
          {/* Saturation/Value Canvas */}
          <div className={styles.canvasWrapper}>
            <canvas
              ref={canvasRef}
              width={240}
              height={150}
              className={styles.canvas}
              onMouseDown={(e) => {
                isDraggingCanvas.current = true;
                handleCanvasInteraction(e);
              }}
            />
            <div
              className={styles.canvasCursor}
              style={{
                left: `${saturation * 100}%`,
                top: `${(1 - value) * 100}%`,
                backgroundColor: currentHex
              }}
            />
          </div>

          {/* Hue Slider */}
          <div className={styles.sliderWrapper}>
            <div
              className={styles.hueSlider}
              onMouseDown={(e) => {
                isDraggingHue.current = true;
                handleHueChange(e);
              }}
            >
              <div
                className={styles.sliderThumb}
                style={{ left: `${(hue / 360) * 100}%` }}
              />
            </div>
          </div>

          {/* Alpha Slider */}
          <div className={styles.sliderWrapper}>
            <div
              className={styles.alphaSlider}
              onMouseDown={(e) => {
                isDraggingAlpha.current = true;
                handleAlphaChange(e);
              }}
            >
              <div
                className={styles.alphaSliderFill}
                style={{
                  background: `linear-gradient(to right, transparent, ${currentHex})`
                }}
              />
              <div
                className={styles.sliderThumb}
                style={{ left: `${alpha * 100}%` }}
              />
            </div>
          </div>

          {/* Input Section */}
          <div className={styles.inputSection}>
            <button
              className={styles.modeToggle}
              onClick={() => setMode(mode === 'hex' ? 'rgb' : 'hex')}
            >
              {mode === 'hex' ? 'Hex' : 'RGB'} ▼
            </button>

            {mode === 'hex' ? (
              <input
                type="text"
                value={currentHex}
                onChange={handleHexInput}
                className={styles.hexInput}
                maxLength={7}
              />
            ) : (
              <div className={styles.rgbInputs}>
                <input
                  type="number"
                  value={currentRgb.r}
                  onChange={(e) => handleRgbInput('r', e.target.value)}
                  className={styles.rgbInput}
                  min="0"
                  max="255"
                />
                <input
                  type="number"
                  value={currentRgb.g}
                  onChange={(e) => handleRgbInput('g', e.target.value)}
                  className={styles.rgbInput}
                  min="0"
                  max="255"
                />
                <input
                  type="number"
                  value={currentRgb.b}
                  onChange={(e) => handleRgbInput('b', e.target.value)}
                  className={styles.rgbInput}
                  min="0"
                  max="255"
                />
              </div>
            )}

            <input
              type="number"
              value={Math.round(alpha * 100)}
              onChange={handleAlphaInput}
              className={styles.alphaInput}
              min="0"
              max="100"
            />
          </div>
        </div>
      )}

      {/* Action Buttons - Always at bottom */}
      <div className={styles.actionButtons}>
        <button
          className={styles.toggleButton}
          onClick={() => setIsAdvanced(!isAdvanced)}
          title={isAdvanced ? 'Modo simple' : 'Modo avanzado'}
        >
          {isAdvanced ? '−' : '+'}
        </button>
        {onRemove && (
          <button
            className={styles.removeButton}
            onClick={onRemove}
          >
            {removeButtonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomColorPicker;
