import React from 'react';
import PageContainer from '../../components/common/PageContainer';
import styles from './UsersPage.module.css';

const UsersPage = () => (
  <PageContainer maxWidth="800px">
    <div className={styles.pageContent}>
      <h2>Gestión de Usuarios</h2>
      <p>Próximamente: administración de usuarios del sistema.</p>
    </div>
  </PageContainer>
);

export default UsersPage;