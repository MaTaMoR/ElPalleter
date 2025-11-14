import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { 
  Menu, 
  Settings, 
  LogOut, 
  ChevronDown,
} from 'lucide-react';
import styles from './TopBar.module.css';

const TopBar = ({ onMenuClick, title }) => {
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <button 
          className={styles.menuButton}
          onClick={onMenuClick}
        >
          <Menu size={24} />
        </button>
        <h1 className={styles.pageTitle}>{title}</h1>
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
              <button onClick={() => navigate('/admin/settings')}>
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
    </header>
  );
};

export default TopBar;