import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Phone,
  Settings,
  Users,
  Zap
} from 'lucide-react';
import styles from './QuickManagementSection.module.css';

const QuickManagementSection = () => {
  const navigate = useNavigate();

  const managementSections = [
    {
      id: 'carta',
      title: 'Carta',
      info: 'Configurar carta',
      action: 'Gestionar',
      icon: FileText,
      className: 'carta',
      path: '/admin/menu'
    },
    {
      id: 'contacto',
      title: 'Contacto',
      info: 'Información completa',
      action: 'Editar',
      icon: Phone,
      className: 'contacto',
      path: '/admin/contact'
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

  const handleManagementClick = (section) => {
    if (section.path) {
      navigate(section.path);
    } else {
      console.debug(`Navegando a: ${section.id} / TODO`);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Zap className={styles.sectionIcon} size={24} />
        <h2 className={styles.sectionTitle}>Gestión Rápida</h2>
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
              <div className={styles.tileAction}>{section.action}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickManagementSection;
