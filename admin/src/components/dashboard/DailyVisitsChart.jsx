import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@utils/analyticsUtils';
import styles from './DailyVisitsChart.module.css';

const DailyVisitsChart = ({ analyticsData, previousData }) => {
  const chartData = useMemo(() => {
    const currentVisits = analyticsData?.dailyVisits || {};
    const previousVisits = previousData?.dailyVisits || {};

    // Obtener fechas de la semana actual y ordenarlas
    const currentDates = Object.keys(currentVisits).sort();
    
    if (currentDates.length === 0) {
      return [];
    }

    // Crear array de datos basado en la semana actual
    return currentDates.map((currentDate, index) => {
      const dateObj = new Date(currentDate);
      const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });
      const dayNumber = dateObj.getDate();
      const month = dateObj.toLocaleDateString('es-ES', { month: 'short' });

      // Buscar la fecha correspondiente de la semana anterior (7 días antes)
      const previousDate = new Date(dateObj);
      previousDate.setDate(previousDate.getDate() - 7);
      const previousDateStr = previousDate.toISOString().split('T')[0];

      return {
        date: currentDate,
        label: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber}`,
        fullLabel: `${dayName} ${dayNumber} ${month}`,
        semanaActual: currentVisits[currentDate] || 0,
        semanaAnterior: previousVisits[previousDateStr] || 0
      };
    });
  }, [analyticsData, previousData]);

  const hasCurrentData = chartData.some(d => d.semanaActual > 0);
  const hasPreviousData = chartData.some(d => d.semanaAnterior > 0);

  if (!hasCurrentData && !hasPreviousData) {
    return (
      <div className={styles.chartContainer}>
        <h4>Visitas Diarias</h4>
        <p className={styles.noData}>No hay datos de visitas disponibles</p>
      </div>
    );
  }

  // Calcular el máximo para el eje Y
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.semanaActual, d.semanaAnterior)),
    1 // Mínimo de 1 para evitar problemas
  );
  
  // Redondear hacia arriba al múltiplo de 10 más cercano
  const yAxisMax = Math.ceil(maxValue / 10) * 10;

  // Calcular totales
  const totalCurrent = chartData.reduce((sum, d) => sum + d.semanaActual, 0);
  const totalPrevious = chartData.reduce((sum, d) => sum + d.semanaAnterior, 0);

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h4>Visitas Diarias</h4>
        <div className={styles.chartLegend}>
          {hasCurrentData && (
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.current}`}></span>
              <span>Semana Actual</span>
            </div>
          )}
          {hasPreviousData && (
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.previous}`}></span>
              <span>Semana Anterior</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis
              dataKey="label"
              stroke="var(--text-secondary)"
              style={{ fontSize: '0.875rem' }}
            />
            <YAxis
              stroke="var(--text-secondary)"
              style={{ fontSize: '0.875rem' }}
              domain={[0, yAxisMax]}
              allowDecimals={false}
              tickCount={6}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem'
              }}
              labelStyle={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}
              formatter={(value, name) => {
                const label = name === 'semanaActual' ? 'Semana Actual' : 'Semana Anterior';
                return [value, label];
              }}
            />
            
            {hasCurrentData && (
              <Line
                type="monotone"
                dataKey="semanaActual"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{ fill: 'var(--primary)', r: 5 }}
                activeDot={{ r: 7 }}
              />
            )}
            
            {hasPreviousData && (
              <Line
                type="monotone"
                dataKey="semanaAnterior"
                stroke="var(--text-muted)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'var(--text-muted)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.chartSummary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total esta semana:</span>
          <span className={styles.summaryValue}>{totalCurrent}</span>
        </div>
        {hasPreviousData && (
          <>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total semana anterior:</span>
              <span className={styles.summaryValue}>{totalPrevious}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Diferencia:</span>
              <span className={`${styles.summaryValue} ${totalCurrent >= totalPrevious ? styles.positive : styles.negative}`}>
                {totalCurrent >= totalPrevious ? '+' : ''}{totalCurrent - totalPrevious}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyVisitsChart;