import React from 'react';
import { getDeviceIcon, formatNumber, formatPercentage } from '@utils/analyticsUtils';
import './DeviceStatsSection.css';

const DeviceStatsSection = ({ analyticsData }) => {
  const deviceStats = analyticsData?.deviceStats || {};
  const totalVisits = analyticsData?.totalVisits || 0;

  const devices = Object.entries(deviceStats).map(([device, count]) => ({
    name: device.charAt(0).toUpperCase() + device.slice(1).toLowerCase(),
    count: count,
    percentage: totalVisits > 0 ? (count / totalVisits) * 100 : 0,
    icon: getDeviceIcon(device)
  })).sort((a, b) => b.count - a.count);

  if (devices.length === 0) {
    return (
      <div className="device-stats">
        <h4>Dispositivos</h4>
        <p className="text-muted">No hay datos de dispositivos disponibles</p>
      </div>
    );
  }

  return (
    <div className="device-stats">
      <h4>Dispositivos</h4>
      <div className="device-list">
        {devices.map((device) => (
          <div key={device.name} className="device-item">
            <span className="device-icon">{device.icon}</span>
            <span className="device-name">{device.name}</span>
            <span className="device-stats">
              <span className="device-count">{formatNumber(device.count)}</span>
              <span className="device-percentage">({formatPercentage(device.percentage)})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceStatsSection;