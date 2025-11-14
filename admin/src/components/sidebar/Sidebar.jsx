import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { 
  X, 
  Home, 
  FileText, 
  Users, 
  Settings, 
  LogOut
} from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { path: '/admin/menu', label: 'Carta', icon: FileText },
    { path: '/admin/users', label: 'Usuarios', icon: Users },
    { path: '/admin/settings', label: 'Configuración', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (!isDesktop) {
      onClose();
    }
  };

  return (
    <>
      {!isDesktop && isOpen && (
        <div 
          className={styles.sidebarOverlay}
          onClick={onClose}
        />
      )}
      
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>El Palleter</h2>
          <button 
            className={styles.sidebarClose}
            onClick={onClose}
            style={{ display: isDesktop ? 'none' : 'block' }}
          >
            <X size={24} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userRole}>Administrador</span>
            </div>
          </div>
          <button 
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;