import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';
import Icon from '../common/Icon';
import I18nService from '@services/I18nService.js';
import styles from './LanguageSelector.module.css';

const LanguageSelector = ({ selectedLanguage, onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState([]);
  const dropdownRef = useRef(null);

  // Load languages from I18nService
  useEffect(() => {
    const availableLanguages = I18nService.getAvailableLanguages();
    setLanguages(availableLanguages);
  }, []);

  const selectedLang = languages.find(lang => lang.code === selectedLanguage) || languages[0];

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

  // Render flag image from backend SVG
  const renderFlag = (lang) => {
    if (!lang?.flag?.name) {
      return null;
    }

    return (
      <Icon name={lang.flag.name} className={styles.flagImage} />
    );
  };

  if (languages.length === 0) {
    return null; // Don't render until languages are loaded
  }

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`} ref={dropdownRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={toggleDropdown}
        disabled={disabled}
        aria-label="Seleccionar idioma"
      >
        {renderFlag(selectedLang)}
        <span className={styles.code}>{selectedLang?.shortName || selectedLang?.code?.toUpperCase()}</span>
        <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {languages.map(lang => (
            <button
              key={lang.code}
              type="button"
              className={`${styles.option} ${lang.code === selectedLanguage ? styles.optionSelected : ''}`}
              onClick={() => handleSelect(lang.code)}
            >
              {renderFlag(lang)}
              <span className={styles.name}>{lang.nativeName || lang.name}</span>
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
  selectedLanguage: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default LanguageSelector;
