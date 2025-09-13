import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { 
  Menu, 
  Settings, 
  LogOut, 
  ChevronDown,
} from 'lucide-react';

import './TopBar.css';

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
    <header className="topbar">
      <div className="topbar-left">
        <button 
          className="menu-button"
          onClick={onMenuClick}
        >
          <Menu size={24} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="topbar-right">
        <div className="user-menu-container">
          <button 
            className="user-menu-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar-small">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="user-name-topbar">{user?.name}</span>
            <ChevronDown size={16} />
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
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