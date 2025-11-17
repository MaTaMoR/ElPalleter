import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './MenuPage.module.css';

/**
 * Layout component for menu pages
 * This wraps all menu routes
 */
const MenuLayout = () => {
  return (
    <div className={styles.viewContainer}>
      <Outlet />
    </div>
  );
};

export default MenuLayout;
