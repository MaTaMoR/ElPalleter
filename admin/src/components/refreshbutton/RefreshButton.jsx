import React from 'react';
import { RefreshCw } from 'lucide-react';
import './RefreshButton.css';

/**
 * Componente reutilizable para botón de refresh/actualizar
 * @param {Object} props
 * @param {boolean} props.refreshing - Si está en proceso de refresh
 * @param {boolean} props.error - Si hay un error 
 * @param {function} props.onClick - Función a ejecutar al hacer click
 * @param {string} props.title - Tooltip del botón
 * @param {number} props.size - Tamaño del icono (default: 16)
 * @param {string} props.variant - Variante visual: 'default' | 'error'
 * @param {boolean} props.disabled - Si está deshabilitado
 */
const RefreshButton = ({
  refreshing = false,
  error = false,
  onClick,
  title = "Actualizar datos",
  size = 16,
  variant = 'default',
  disabled = false,
  ...props
}) => {
  const handleClick = () => {
    if (!refreshing && !disabled && onClick) {
      onClick();
    }
  };

  const getClassName = () => {
    let className = 'refresh-button';
    
    if (refreshing) className += ' refreshing';
    if (error || variant === 'error') className += ' error';
    if (disabled || refreshing) className += ' disabled';
    
    return className;
  };

  return (
    <button 
      className={getClassName()}
      onClick={handleClick}
      title={refreshing ? "Actualizando..." : title}
      disabled={disabled || refreshing}
      type="button"
      {...props}
    >
      <RefreshCw 
        size={size} 
        className={refreshing ? 'spinning' : ''} 
      />
    </button>
  );
};

export default RefreshButton;