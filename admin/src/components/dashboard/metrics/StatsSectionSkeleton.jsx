import React from 'react';
import Skeleton from '../../common/Skeleton';
import styles from './DeviceStatsSection.module.css';

/**
 * Skeleton para secciones de estadísticas (dispositivos, idiomas, etc.)
 */
const StatsSectionSkeleton = () => {
  return (
    <div className={styles.deviceStats}>
      <Skeleton variant="text" width="120px" height="1.5rem" style={{ marginBottom: '1rem' }} />
      <div className={styles.deviceList}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className={styles.deviceItem}>
            <div className={styles.deviceLeft}>
              <span className={styles.deviceIcon}>
                <Skeleton variant="circle" width="24px" height="24px" />
              </span>
              <Skeleton variant="text" width="80px" height="1rem" />
            </div>
            <div className={styles.deviceRight}>
              <Skeleton variant="text" width="50px" height="1rem" style={{ marginRight: '0.5rem' }} />
              <Skeleton variant="text" width="50px" height="1rem" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsSectionSkeleton;
