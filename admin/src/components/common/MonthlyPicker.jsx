import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar } from 'lucide-react';
import styles from './MonthlyPicker.module.css';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

/**
 * MonthlyPicker - Selector de mes y año con dropdown
 *
 * @param {Object} props
 * @param {Date} props.minDate - Fecha mínima permitida (no se puede navegar antes)
 * @param {Date} props.value - Fecha actualmente seleccionada
 * @param {Function} props.onChange - Callback cuando cambia la selección (recibe objeto {month, year})
 */
const MonthlyPicker = ({ minDate, value, onChange }) => {
  const [selectedDate, setSelectedDate] = useState(value || new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownYear, setDropdownYear] = useState(value ? value.getFullYear() : new Date().getFullYear());
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
    }
  }, [value]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentMonth = selectedDate.getMonth(); // 0-11
  const currentYear = selectedDate.getFullYear();

  const minMonth = minDate.getMonth();
  const minYear = minDate.getFullYear();

  const today = new Date();
  const maxMonth = today.getMonth();
  const maxYear = today.getFullYear();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Al abrir, mostrar el año de la fecha seleccionada
      setDropdownYear(currentYear);
    }
  };

  const handleYearChange = (direction) => {
    const newYear = dropdownYear + direction;
    if (newYear >= minYear && newYear <= maxYear) {
      setDropdownYear(newYear);
    }
  };

  const handleMonthSelect = (monthIndex) => {
    const month = monthIndex + 1; // 1-12
    const year = dropdownYear;

    // Verificar que la selección es válida
    if (year < minYear || (year === minYear && monthIndex < minMonth)) {
      return; // No permitir seleccionar antes del minDate
    }

    if (year > maxYear || (year === maxYear && monthIndex > maxMonth)) {
      return; // No permitir seleccionar en el futuro
    }

    const newDate = new Date(year, monthIndex, 1);
    setSelectedDate(newDate);
    setIsOpen(false);

    onChange({ month, year });
  };

  const isMonthDisabled = (monthIndex) => {
    const year = dropdownYear;

    // Deshabilitar si está antes del minDate
    if (year < minYear || (year === minYear && monthIndex < minMonth)) {
      return true;
    }

    // Deshabilitar si está en el futuro
    if (year > maxYear || (year === maxYear && monthIndex > maxMonth)) {
      return true;
    }

    return false;
  };

  const isMonthSelected = (monthIndex) => {
    return monthIndex === currentMonth && dropdownYear === currentYear;
  };

  const canGoBackYear = dropdownYear > minYear;
  const canGoForwardYear = dropdownYear < maxYear;

  return (
    <div className={styles.monthlyPicker} ref={dropdownRef}>
      {/* Botón principal que muestra el mes/año seleccionado */}
      <button
        className={styles.pickerButton}
        onClick={toggleDropdown}
        aria-label="Abrir selector de mes"
      >
        <Calendar className={styles.calendarIcon} size={20} />
        <div className={styles.displayMonth}>
          <span className={styles.monthName}>
            <span className={styles.monthFull}>{MONTHS[currentMonth]}</span>
            <span className={styles.monthShort}>{MONTHS_SHORT[currentMonth]}</span>
          </span>
          <span className={styles.yearName}>{currentYear}</span>
        </div>
        <ChevronDown
          className={`${styles.chevronIcon} ${isOpen ? styles.open : ''}`}
          size={20}
        />
      </button>

      {/* Dropdown con selector de año y meses */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Selector de año */}
          <div className={styles.yearSelector}>
            <button
              className={`${styles.yearButton} ${!canGoBackYear ? styles.disabled : ''}`}
              onClick={() => handleYearChange(-1)}
              disabled={!canGoBackYear}
              aria-label="Año anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className={styles.yearDisplay}>{dropdownYear}</span>
            <button
              className={`${styles.yearButton} ${!canGoForwardYear ? styles.disabled : ''}`}
              onClick={() => handleYearChange(1)}
              disabled={!canGoForwardYear}
              aria-label="Año siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Lista de meses */}
          <div className={styles.monthsGrid}>
            {MONTHS.map((month, index) => (
              <button
                key={index}
                className={`${styles.monthButton} ${
                  isMonthSelected(index) ? styles.selected : ''
                } ${isMonthDisabled(index) ? styles.disabled : ''}`}
                onClick={() => handleMonthSelect(index)}
                disabled={isMonthDisabled(index)}
              >
                {month}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyPicker;
