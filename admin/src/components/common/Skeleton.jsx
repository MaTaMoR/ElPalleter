import React from 'react';
import styles from './Skeleton.module.css';

/**
 * Componente Skeleton para mostrar placeholders de carga
 * @param {Object} props
 * @param {string} props.variant - Tipo de skeleton: 'text', 'circular', 'rectangular'
 * @param {string} props.width - Ancho del skeleton
 * @param {string} props.height - Alto del skeleton
 * @param {string} props.className - Clases CSS adicionales
 */
const Skeleton = ({
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'text':
        return styles.text;
      case 'circular':
        return styles.circular;
      case 'rectangular':
      default:
        return styles.rectangular;
    }
  };

  return (
    <div
      className={`${styles.skeleton} ${getVariantClass()} ${className}`}
      style={{ width, height }}
      {...props}
    />
  );
};

export default Skeleton;
