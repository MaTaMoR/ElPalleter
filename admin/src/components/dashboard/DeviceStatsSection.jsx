import React from 'react';
import { getDeviceIcon, getDeviceName, formatNumber, formatPercentage } from '@utils/analyticsUtils';
import styles from './DeviceStatsSection.module.css';

const DeviceStatsSection = ({ analyticsData }) => {
  const deviceStats = analyticsData?.deviceStats || {};
  const totalVisits = analyticsData?.totalVisits || 0;

  const devices = Object.entries(deviceStats).map(([type, count]) => ({
    type: type,
    name: getDeviceName(type),
    icon: getDeviceIcon(type),
    count: count,
    percentage: totalVisits > 0 ? (count / totalVisits) * 100 : 0
  })).sort((a, b) => b.count - a.count);

  if (devices.length === 0) {
    return (
      <div className={styles.deviceStats}>
        <h4>Dispositivos</h4>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
          No hay datos de dispositivos disponibles
        </p>
      </div>
    );
  }

  return (
    <div className={styles.deviceStats}>
      <h4>Dispositivos</h4>
      <div className={styles.deviceList}>
        {devices.map((device) => (
          <div key={device.type} className={styles.deviceItem}>
            <div className={styles.deviceLeft}>
              <span className={styles.deviceIcon}>{device.icon}</span>
              <span className={styles.deviceName}>{device.name}</span>
            </div>
            <div className={styles.deviceRight}>
              <span className={styles.deviceCount}>{formatNumber(device.count)}</span>
              <span className={styles.devicePercentage}>{formatPercentage(device.percentage)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceStatsSection;