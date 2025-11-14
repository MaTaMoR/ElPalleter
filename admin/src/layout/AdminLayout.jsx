import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import TopBar from '../components/topbar/TopBar';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const location = useLocation();
  
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth > 768;
      setIsDesktop(desktop);
      
      if (desktop) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isDesktop]);
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('menu')) return 'Gestión de Carta';
    if (path.includes('users')) return 'Usuarios';
    if (path.includes('settings')) return 'Configuración';
    return 'Panel de Administración';
  };

  const handleMenuClick = () => {
    if (!isDesktop) {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleSidebarClose = () => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className={styles.adminLayout}>
      <Sidebar 
        isOpen={isDesktop || sidebarOpen}
        onClose={handleSidebarClose} 
      />
      <div className={styles.mainContent}>
        <TopBar 
          onMenuClick={handleMenuClick}
          title={getPageTitle()}
        />
        <div className={styles.pageContainer}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;