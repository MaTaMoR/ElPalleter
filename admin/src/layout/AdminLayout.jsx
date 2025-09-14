import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Sidebar from '../components/sidebar/Sidebar';
import TopBar from '../components/topbar/TopBar';

import './AdminLayout.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const location = useLocation();
  
  // Detectar cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth > 768;
      setIsDesktop(desktop);
      
      // En desktop, el sidebar siempre está "abierto" pero no usa overlay
      // En móvil, mantener el estado actual del sidebar
      if (desktop) {
        setSidebarOpen(false); // No necesitamos overlay en desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar sidebar en móvil cuando cambie la ruta
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
    // Solo funciona en móvil
    if (!isDesktop) {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleSidebarClose = () => {
    // Solo funciona en móvil
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar 
        isOpen={isDesktop || sidebarOpen} // Siempre abierto en desktop, controlado en móvil
        onClose={handleSidebarClose} 
      />
      <div className="main-content">
        <TopBar 
          onMenuClick={handleMenuClick}
          title={getPageTitle()}
        />
        <div className="page-container">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;