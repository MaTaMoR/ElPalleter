import React from 'react';
import PageContainer from '../../components/common/PageContainer';
import styles from './SettingsPage.module.css';

const SettingsPage = () => (
  <PageContainer maxWidth="800px">
    <div className={styles.pageContent}>
      <h2>Configuración</h2>
      <p>Próximamente: configuración del sistema.</p>
    </div>
  </PageContainer>
);

export default SettingsPage;