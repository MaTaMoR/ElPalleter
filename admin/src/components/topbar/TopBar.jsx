import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import {
  Menu,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import logoLight from '/src/assets/mini-logo-light.svg';
import styles from './TopBar.module.css';

const TopBar = ({ onMenuClick, title }) => {
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/admin/login');
  };

  const handleNavigateSettings = () => {
    setShowUserMenu(false);
    navigate('/admin/settings');
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarCard}>
        <div className={styles.topbarLeft}>
          <button
            className={styles.menuButton}
            onClick={onMenuClick}
          >
            <Menu size={24} />
          </button>
          <img src={logoLight} alt="El Palleter" className={styles.logo} />
        </div>

        <div className={styles.topbarRight}>
          <div className={styles.userMenuContainer}>
            <button
              className={styles.userMenuButton}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className={styles.userAvatarSmall}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className={styles.userNameTopbar}>{user?.name}</span>
              <ChevronDown size={16} />
            </button>

            {showUserMenu && (
              <div className={styles.userDropdown}>
                <button onClick={handleNavigateSettings}>
                  <Settings size={16} />
                  Configuración
                </button>
                <button onClick={handleLogout}>
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;