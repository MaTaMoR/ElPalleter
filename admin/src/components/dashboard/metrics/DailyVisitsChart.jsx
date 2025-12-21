import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@utils/analyticsUtils';
import { useAnalyticsYearlyData } from '../../../hooks/useAnalyticsYearlyData';
import styles from './DailyVisitsChart.module.css';

const DailyVisitsChart = ({ analyticsData }) => {
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' o 'yearly'
  const { yearlyData, loading: yearlyLoading } = useAnalyticsYearlyData();

  // Datos para vista mensual (día por día)
  const monthlyChartData = useMemo(() => {
    const currentVisits = analyticsData?.dailyVisits || {};

    // Obtener fechas del mes actual y ordenarlas
    const currentDates = Object.keys(currentVisits).sort();

    if (currentDates.length === 0) {
      return [];
    }

    // Crear array de datos basado en el mes actual
    return currentDates.map((currentDate) => {
      const dateObj = new Date(currentDate);
      const dayNumber = dateObj.getDate();
      const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });
      const month = dateObj.toLocaleDateString('es-ES', { month: 'short' });

      return {
        date: currentDate,
        label: `${dayNumber}`,
        fullLabel: `${dayName} ${dayNumber} ${month}`,
        visitas: currentVisits[currentDate] || 0
      };
    });
  }, [analyticsData]);

  // Datos para vista anual (mes por mes)
  const yearlyChartData = useMemo(() => {
    if (!yearlyData?.monthlyBreakdown) {
      return [];
    }

    // Filtrar solo los meses que tienen visitas y mapearlos
    return yearlyData.monthlyBreakdown
      .filter(item => item.visits > 0) // Solo meses con visitas
      .map((item) => {
        const [year, month] = item.yearMonth.split('-');
        const dateObj = new Date(year, parseInt(month) - 1, 1);
        const monthName = dateObj.toLocaleDateString('es-ES', { month: 'short' });
        const monthFullName = dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

        return {
          yearMonth: item.yearMonth,
          label: monthName,
          fullLabel: monthFullName,
          visitas: item.visits
        };
      });
  }, [yearlyData]);

  // Seleccionar datos según el modo de vista
  const chartData = viewMode === 'monthly' ? monthlyChartData : yearlyChartData;
  const hasData = chartData.some(d => d.visitas > 0);

  if (!hasData && !yearlyLoading) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.chartHeader}>
          <h4>{viewMode === 'monthly' ? 'Visitas Diarias del Mes' : 'Visitas Mensuales del Año'}</h4>
          <div className={styles.toggleContainer}>
            <button
              className={`${styles.toggleButton} ${viewMode === 'monthly' ? styles.active : ''}`}
              onClick={() => setViewMode('monthly')}
            >
              Este Mes
            </button>
            <button
              className={`${styles.toggleButton} ${viewMode === 'yearly' ? styles.active : ''}`}
              onClick={() => setViewMode('yearly')}
            >
              Último Año
            </button>
          </div>
        </div>
        <p className={styles.noData}>No hay datos de visitas disponibles</p>
      </div>
    );
  }

  // Calcular el máximo para el eje Y
  const maxValue = Math.max(
    ...chartData.map(d => d.visitas),
    1 // Mínimo de 1 para evitar problemas
  );

  // Redondear hacia arriba al múltiplo de 10 más cercano
  const yAxisMax = Math.ceil(maxValue / 10) * 10;

  // Calcular estadísticas
  const totalVisits = chartData.reduce((sum, d) => sum + d.visitas, 0);
  const averageVisits = Math.round(totalVisits / chartData.length);

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h4>{viewMode === 'monthly' ? 'Visitas Diarias del Mes' : 'Visitas Mensuales del Año'}</h4>
        <div className={styles.toggleContainer}>
          <button
            className={`${styles.toggleButton} ${viewMode === 'monthly' ? styles.active : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            Este Mes
          </button>
          <button
            className={`${styles.toggleButton} ${viewMode === 'yearly' ? styles.active : ''}`}
            onClick={() => setViewMode('yearly')}
          >
            Último Año
          </button>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis
              dataKey="label"
              stroke="var(--text-secondary)"
              style={{ fontSize: '0.875rem' }}
              interval={0}
              tick={(props) => {
                const { x, y, payload, index } = props;

                if (viewMode === 'monthly') {
                  // En vista mensual, solo mostrar domingos
                  const item = chartData[index];
                  const dateObj = item ? new Date(item.date) : null;
                  const isSunday = dateObj && dateObj.getDay() === 0;

                  // Solo renderizar si es domingo
                  if (!isSunday) {
                    return null;
                  }

                  return (
                    <text
                      x={x}
                      y={y}
                      dy={16}
                      textAnchor="middle"
                      fill="var(--primary)"
                      fontSize="0.875rem"
                      fontWeight="bold"
                    >
                      {payload.value}
                    </text>
                  );
                } else {
                  // En vista anual, mostrar todos
                  return (
                    <text
                      x={x}
                      y={y}
                      dy={16}
                      textAnchor="middle"
                      fill="var(--text-secondary)"
                      fontSize="0.875rem"
                    >
                      {payload.value}
                    </text>
                  );
                }
              }}
            />
            <YAxis
              stroke="var(--text-secondary)"
              style={{ fontSize: '0.875rem' }}
              domain={[0, yAxisMax]}
              allowDecimals={false}
              tickCount={6}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem'
              }}
              labelFormatter={(label) => {
                const item = chartData.find(d => d.label === label);
                return item?.fullLabel || label;
              }}
              formatter={(value) => [`${value} visitas`, 'Total']}
            />

            <Line
              type="linear"
              dataKey="visitas"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: 'var(--primary)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.chartSummary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>
            {viewMode === 'monthly' ? 'Total del mes:' : 'Total del año:'}
          </span>
          <span className={styles.summaryValue}>{totalVisits}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>
            {viewMode === 'monthly' ? 'Promedio diario:' : 'Promedio mensual:'}
          </span>
          <span className={styles.summaryValue}>{averageVisits}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>
            {viewMode === 'monthly' ? 'Días con datos:' : 'Meses con datos:'}
          </span>
          <span className={styles.summaryValue}>{chartData.length}</span>
        </div>
      </div>
    </div>
  );
};

export default DailyVisitsChart;
