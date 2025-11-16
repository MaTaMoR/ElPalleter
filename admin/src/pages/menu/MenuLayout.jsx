import React from 'react';
import { Outlet } from 'react-router-dom';
import MenuBreadcrumbs from '../../components/menu/navigation/MenuBreadcrumbs';
import styles from './MenuPage.module.css';

/**
 * Layout component for menu pages
 * This wraps all menu routes and provides the breadcrumb navigation
 */
const MenuLayout = () => {
  return (
    <>
      <MenuBreadcrumbs />
      <div className={styles.viewContainer}>
        <Outlet />
      </div>
    </>
  );
};

export default MenuLayout;
