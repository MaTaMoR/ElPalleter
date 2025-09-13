import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Sidebar from '../componentes/sidebar/Sidebar';
import TopBar from '../componentes/topbar/TopBar';

import './AdminLayout.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('menu')) return 'Gestión de Carta';
    if (path.includes('users')) return 'Usuarios';
    if (path.includes('settings')) return 'Configuración';
    return 'Panel de Administración';
  };

  return (
    <div className="admin-layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <div className="main-content">
        <TopBar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
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