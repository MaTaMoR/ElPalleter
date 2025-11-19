import React from 'react';
import styles from './Button.module.css';

const Button = ({
  children,
  variant = 'primary',
  icon: Icon,
  onClick,
  disabled = false,
  type = 'button',
  className = ''
}) => {
  const variantClass = styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${variantClass} ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children && <span className={styles.buttonText}>{children}</span>}
    </button>
  );
};

export default Button;
