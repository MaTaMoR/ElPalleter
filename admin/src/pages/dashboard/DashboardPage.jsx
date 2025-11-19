import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import PageContainer from '../../components/common/PageContainer';
import WebMetricsSection from '../../components/dashboard/WebMetricsSection';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: analyticsData, previousData, loading, refreshing, error, refresh, lastUpdated } = useAnalyticsData();

  const managementSections = [
    {
      id: 'carta',
      title: 'Carta',
      info: 'Configurar carta',
      action: 'Gestionar',
      icon: Menu,
      className: 'carta',
      path: '/menu'
    },
    {
      id: 'contacto',
      title: 'Contacto',
      info: 'Información completa',
      action: 'Editar',
      icon: Phone,
      className: 'contacto',
      path: '/contact'
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

  const handleManagementClick = (section) => {
    if (section.path) {
      navigate(section.path);
    } else {
      console.debug(`Navegando a: ${section.id} / TODO`);
    }
  };

  return (
    <PageContainer>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Gestión Rápida</h2>
          <span className={styles.statusBadge}>Navegación rápida</span>
        </div>
        
        <div className={styles.managementGrid}>
          {managementSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div
                key={section.id}
                className={`${styles.managementTile} ${styles[section.className]} ${section.path ? styles.clickable : ''}`}
                onClick={() => handleManagementClick(section)}
              >
                <IconComponent className={styles.tileIcon} size={45} />
                <h3 className={styles.tileTitle}>{section.title}</h3>
                <p className={styles.tileInfo}>{section.info}</p>
                <div className={styles.tileAction}>{section.action}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Marketing Digital</h2>
          <span className={`${styles.statusBadge} ${styles.info}`}>Rendimiento excelente</span>
        </div>
        
        <div className={styles.socialGrid}>
          {socialStats.map((social, index) => {
            const IconComponent = social.icon;
            return (
              <div key={index} className={`${styles.socialCard} ${styles[social.className]}`}>
                <div className={styles.socialHeader}>
                  <span className={styles.socialPlatform}>{social.platform}</span>
                  <IconComponent className={styles.socialIcon} size={24} />
                </div>
                <div className={styles.socialStats}>
                  <div>
                    <div className={styles.socialMainStat}>{social.mainStat}</div>
                    <div className={styles.socialLabel}>{social.label}</div>
                  </div>
                  <div className={styles.socialChange}>
                    <div className={styles.changePositive}>{social.change}</div>
                    <div className={styles.socialLabel}>{social.changeLabel}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Métricas Web Section */}
      <WebMetricsSection
        analyticsData={analyticsData}
        previousData={previousData}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        lastUpdated={lastUpdated}
      />
    </PageContainer>
  );
};

export default DashboardPage;