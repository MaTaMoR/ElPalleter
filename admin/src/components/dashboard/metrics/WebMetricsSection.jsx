import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { useAnalyticsMonthlyData, useAnalyticsStartDate } from '../../../hooks/useAnalyticsMonthlyData';
import { useMetricsData } from '../../../hooks/useMetricsData';
import MonthlyPicker from '../../common/MonthlyPicker';
import MetricsCards from './MetricsCards';
import DeviceStatsSection from './DeviceStatsSection';
import LanguageStatsSection from './LanguageStatsSection';
import DailyVisitsChart from './DailyVisitsChart';
import WebMetricsSectionSkeleton from './WebMetricsSectionSkeleton';
import RefreshButton from '../../refreshbutton/RefreshButton';

import styles from './WebMetricsSection.module.css';

const WebMetricsSection = () => {
  // Obtener la fecha de inicio de las analíticas
  const { startDate: analyticsStartDate, loading: startDateLoading } = useAnalyticsStartDate();

  // Estado para el mes/año seleccionado (por defecto mes actual)
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(now);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12

  // Obtener datos mensuales
  const { currentMonthData, previousMonthData, loading, error, refetch } = useAnalyticsMonthlyData(selectedYear, selectedMonth);

  // Procesar datos con el hook existente
  const metricsData = useMetricsData(currentMonthData, previousMonthData, loading);

  // Crear la fecha mínima a partir de analyticsStartDate
  const minDate = analyticsStartDate
    ? new Date(analyticsStartDate.year, analyticsStartDate.month - 1, 1)
    : new Date(2025, 6, 1); // Default: Julio 2025

  // Manejar cambio de mes en el picker
  const handleMonthChange = ({ month, year }) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setSelectedDate(new Date(year, month - 1, 1));
  };

  // Error sin datos previos (solo si no hay metricsData Y hay error)
  if (!metricsData && error && !loading) {
    return (
      <div className={styles.errorState}>
        <span className={styles.errorIcon}>⚠️</span>
        <h3>Error al cargar las métricas</h3>
        <p>{error}</p>
        <button onClick={refetch} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.metricsSection}>
      <div className={styles.sectionContainer}>
        {/* Header con MonthlyPicker y refresh */}
        <div className={styles.sectionHeader}>
          <div>
            <BarChart3 className={styles.sectionIcon} size={24} />
            <h2>Métricas Web</h2>
            <RefreshButton
              onClick={refetch}
              refreshing={loading}
            />
          </div>
          <div className={styles.headerControls}>
            <MonthlyPicker
              minDate={minDate}
              value={selectedDate}
              onChange={handleMonthChange}
            />
          </div>
        </div>

        {/* Contenido de la sección */}
        {loading || !metricsData ? (
          <WebMetricsSectionSkeleton />
        ) : (
          <>
            {/* Grid de métricas principales */}
            <MetricsCards
              metrics={metricsData.metrics}
              changes={metricsData.changes}
            />

            {/* Gráfico de visitas diarias */}
            <DailyVisitsChart
              analyticsData={metricsData.displayData}
            />

            {/* Estadísticas de dispositivos e idiomas */}
            <div className={styles.statsGrid}>
              <DeviceStatsSection analyticsData={metricsData.displayData} />
              <LanguageStatsSection analyticsData={metricsData.displayData} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WebMetricsSection;