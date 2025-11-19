import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import TopBar from '../components/topbar/TopBar';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Colapsado por defecto
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);

      // Si cambiamos a desktop, cerrar el sidebar móvil
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar sidebar móvil al cambiar de ruta
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('menu')) return 'Gestión de Carta';
    if (path.includes('users')) return 'Usuarios';
    if (path.includes('settings')) return 'Configuración';
    return 'Panel de Administración';
  };

  const handleMenuClick = () => {
    if (isMobile) {
      // En móvil: toggle sidebar abierto/cerrado
      setSidebarOpen(!sidebarOpen);
    } else {
      // En desktop: toggle sidebar colapsado/expandido
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleToggleCollapse = () => {
    if (!isMobile) {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className={styles.adminLayout}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobile={isMobile}
      />
      <div
        className={`${styles.mainContent} ${
          !isMobile && sidebarCollapsed ? styles.mainContentCollapsed : ''
        }`}
      >
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
