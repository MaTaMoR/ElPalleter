import React from 'react';
import PropTypes from 'prop-types';
import styles from './LanguageSelector.module.css';

const LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'val', name: 'Valencià', flag: '🇪🇸' }
];

const LanguageSelector = ({ selectedLanguage, onChange, disabled = false }) => {
  const handleChange = (e) => {
    if (onChange && !disabled) {
      onChange(e.target.value);
    }
  };

  const selectedLang = LANGUAGES.find(lang => lang.code === selectedLanguage) || LANGUAGES[0];

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`}>
      <select
        value={selectedLanguage}
        onChange={handleChange}
        disabled={disabled}
        className={styles.select}
        aria-label="Seleccionar idioma"
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.code.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
};

LanguageSelector.propTypes = {
  selectedLanguage: PropTypes.oneOf(['es', 'en', 'val']).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default LanguageSelector;
