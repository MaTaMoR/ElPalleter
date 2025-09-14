import React from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { 
  Menu,
  Phone,
  BookOpen,
  Settings,
  Users,
  MapPin,
  Instagram,
  Facebook
} from 'lucide-react';

import WebMetricsSection from '../../components/dashboard/WebMetricsSection';
import DeviceStatsSection from '../../components/dashboard/DeviceStatsSection';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const { data: analyticsData, loading, error, refresh, lastUpdated } = useAnalyticsData();

  const managementSections = [
    {
      id: 'carta',
      title: 'Carta',
      info: '24 platos', // Esto podría venir del CartaService
      action: 'Gestionar',
      icon: Menu,
      className: 'carta'
    },
    {
      id: 'contacto',
      title: 'Contacto',
      info: 'Información completa',
      action: 'Editar',
      icon: Phone,
      className: 'contacto'
    },
    {
      id: 'historia',
      title: 'Historia',
      info: 'Del restaurante',
      action: 'Modificar',
      icon: BookOpen,
      className: 'historia'
    },
    {
      id: 'configuracion',
      title: 'Configuración',
      info: 'Ajustes generales',
      action: 'Configurar',
      icon: Settings,
      className: 'configuracion'
    },
    {
      id: 'usuarios',
      title: 'Usuarios',
      info: '3 administradores',
      action: 'Administrar',
      icon: Users,
      className: 'usuarios'
    }
  ];

  // Mock data para social media (esto podrías conectarlo con APIs reales más tarde)
  const socialStats = [
    {
      platform: 'Google Business',
      icon: MapPin,
      mainStat: '4.8★',
      label: '67 reseñas',
      change: '+3',
      changeLabel: 'esta semana',
      className: 'google'
    },
    {
      platform: 'Instagram',
      icon: Instagram,
      mainStat: '1,234',
      label: 'seguidores',
      change: '+47',
      changeLabel: 'este mes',
      className: 'instagram'
    },
    {
      platform: 'Facebook',
      icon: Facebook,
      mainStat: '856',
      label: 'me gusta',
      change: '+23',
      changeLabel: 'este mes',
      className: 'facebook'
    }
  ];

  const handleManagementClick = (sectionId) => {
    console.log(`Navegando a: ${sectionId}`);
    // TODO: Implementar navegación real aquí
  };

  return (
    <div className="dashboard-new">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard del Restaurante</h1>
        <p className="dashboard-subtitle">Panel de control y gestión integral</p>
      </div>

      {/* Gestión Rápida Section */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Gestión Rápida</h2>
          <span className="status-badge">Navegación rápida</span>
        </div>
        
        <div className="management-grid">
          {managementSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div 
                key={section.id}
                className={`management-tile ${section.className}`}
                onClick={() => handleManagementClick(section.id)}
              >
                <IconComponent className="tile-icon" size={45} />
                <h3 className="tile-title">{section.title}</h3>
                <p className="tile-info">{section.info}</p>
                <div className="tile-action">{section.action}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Marketing Digital Section */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Marketing Digital</h2>
          <span className="status-badge info">Rendimiento excelente</span>
        </div>
        
        <div className="social-grid">
          {socialStats.map((social, index) => {
            const IconComponent = social.icon;
            return (
              <div key={index} className={`social-card ${social.className}`}>
                <div className="social-header">
                  <span className="social-platform">{social.platform}</span>
                  <IconComponent className="social-icon" size={24} />
                </div>
                <div className="social-stats">
                  <div>
                    <div className="social-main-stat">{social.mainStat}</div>
                    <div className="social-label">{social.label}</div>
                  </div>
                  <div className="social-change">
                    <div className="change-positive">{social.change}</div>
                    <div className="social-label">{social.changeLabel}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Device Stats con datos reales */}
        {analyticsData && (
          <div className="additional-stats">
            <DeviceStatsSection analyticsData={analyticsData} />
          </div>
        )}
      </div>

      {/* Métricas Web Section - Con datos reales del backend */}
      <WebMetricsSection 
        analyticsData={analyticsData}
        loading={loading}
        error={error}
        onRefresh={refresh}
        lastUpdated={lastUpdated}
      />
    </div>
  );
};

export default DashboardPage;