import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';
import styles from './LanguageSelector.module.css';

const LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'val', name: 'Valencià', flag: '🇪🇸' }
];

const LanguageSelector = ({ selectedLanguage, onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedLang = LANGUAGES.find(lang => lang.code === selectedLanguage) || LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (langCode) => {
    if (onChange && !disabled) {
      onChange(langCode);
    }
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`} ref={dropdownRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={toggleDropdown}
        disabled={disabled}
        aria-label="Seleccionar idioma"
      >
        <span className={styles.flag}>{selectedLang.flag}</span>
        <span className={styles.code}>{selectedLang.code.toUpperCase()}</span>
        <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              type="button"
              className={`${styles.option} ${lang.code === selectedLanguage ? styles.optionSelected : ''}`}
              onClick={() => handleSelect(lang.code)}
            >
              <span className={styles.flag}>{lang.flag}</span>
              <span className={styles.name}>{lang.name}</span>
              {lang.code === selectedLanguage && (
                <span className={styles.checkmark}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

LanguageSelector.propTypes = {
  selectedLanguage: PropTypes.oneOf(['es', 'en', 'val']).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default LanguageSelector;
