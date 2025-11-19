import React from 'react';
import styles from './PageContainer.module.css';

const PageContainer = ({ children, maxWidth = '1400px', className = '' }) => {
  return (
    <div
      className={`${styles.pageContainer} ${className}`}
      style={{ maxWidth }}
    >
      {children}
    </div>
  );
};

export default PageContainer;
