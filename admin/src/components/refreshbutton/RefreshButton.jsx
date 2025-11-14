import React from 'react';
import { RefreshCw } from 'lucide-react';
import styles from './RefreshButton.module.css';

/**
 * Componente reutilizable para botón de refresh/actualizar
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
    let className = styles.refreshButton;
    
    if (refreshing) className += ` ${styles.refreshing}`;
    if (error || variant === 'error') className += ` ${styles.error}`;
    if (disabled || refreshing) className += ` ${styles.disabled}`;
    
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
        className={refreshing ? styles.spinning : ''} 
      />
    </button>
  );
};

export default RefreshButton;