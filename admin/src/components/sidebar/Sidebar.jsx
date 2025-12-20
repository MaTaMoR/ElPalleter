import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  Phone,
  Users,
  Settings,
  Type
} from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { path: '/admin/menu', label: 'Carta', icon: FileText },
    { path: '/admin/contact', label: 'Contacto', icon: Phone },
    { path: '/admin/users', label: 'Usuarios', icon: Users },
    { path: '/admin/content', label: 'Contenido', icon: Type },
    { path: '/admin/settings', label: 'Configuración', icon: Settings },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    // En móvil, cerrar el sidebar al navegar
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Determinar si el sidebar está visible
  const sidebarClasses = [
    styles.sidebar,
    isCollapsed && !isMobile ? styles.collapsed : '',
    isOpen && isMobile ? styles.mobileOpen : ''
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Overlay solo en móvil */}
      {isMobile && isOpen && (
        <div
          className={`${styles.sidebarOverlay} ${styles.visible}`}
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        <div className={styles.sidebarInner}>
          <nav className={styles.sidebarNav}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  onClick={() => handleNavigation(item.path)}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={styles.navIcon} size={24} />
                  <span className={styles.navText}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
