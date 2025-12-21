import React, { useState } from 'react';
import {
  MapPin,
  Instagram,
  Facebook,
  TrendingUp,
  Star,
  Glasses
} from 'lucide-react';
import { useSocialMediaMonthlyData, useSocialMediaStartDate } from '../../../hooks/useSocialMediaData';
import { useSocialMediaMetrics } from '../../../hooks/useSocialMediaMetrics';
import MonthlyPicker from '../../common/MonthlyPicker';
import RefreshButton from '../../refreshbutton/RefreshButton';
import SocialMediaCard from './SocialMediaCard';
import SocialMediaSectionSkeleton from './SocialMediaSectionSkeleton';
import styles from './SocialMediaSection.module.css';

// Mapa de iconos por plataforma
const PLATFORM_ICONS = {
  'Google Business': MapPin,
  'Instagram': Instagram,
  'Facebook': Facebook,
  'Tripadvisor': Glasses
};

const SocialMediaSection = () => {
  // Obtener la fecha de inicio de los datos
  const { startDate: socialMediaStartDate, loading: startDateLoading } = useSocialMediaStartDate();

  // Estado para el mes/año seleccionado (por defecto mes actual)
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(now);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12

  // Obtener datos mensuales
  const { currentMonthData, previousMonthData, loading, error, refetch } = useSocialMediaMonthlyData(selectedYear, selectedMonth);

  // Procesar métricas
  const metricsData = useSocialMediaMetrics(currentMonthData, previousMonthData, loading);

  // Crear la fecha mínima a partir de socialMediaStartDate
  const minDate = socialMediaStartDate
    ? new Date(socialMediaStartDate.year, socialMediaStartDate.month - 1, 1)
    : new Date(2024, 2, 1); // Default: Marzo 2024

  // Manejar cambio de mes en el picker
  const handleMonthChange = ({ month, year }) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setSelectedDate(new Date(year, month - 1, 1));
  };

  // Error sin datos previos
  if (!metricsData && error && !loading) {
    return (
      <div className={styles.errorState}>
        <span className={styles.errorIcon}>⚠️</span>
        <h3>Error al cargar las métricas de redes sociales</h3>
        <p>{error}</p>
        <button onClick={refetch} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionContainer}>
        {/* Header con MonthlyPicker y refresh */}
        <div className={styles.sectionHeader}>
          <div>
            <TrendingUp className={styles.sectionIcon} size={24} />
            <h2>Marketing Digital</h2>
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

        {/* Grid de cards */}
        {loading || !metricsData ? (
          <SocialMediaSectionSkeleton />
        ) : (
          <div className={styles.socialGrid}>
            {metricsData.platforms.map((platform, index) => {
              const Icon = PLATFORM_ICONS[platform.platform] || TrendingUp;

              return (
                <SocialMediaCard
                  key={platform.key}
                  platform={platform.platform}
                  icon={Icon}
                  mainStat={platform.mainStat}
                  showStar={platform.showStar ? <Star className={styles.starIcon} size={24} fill="#fbbf24" stroke="#fbbf24" /> : null}
                  label={platform.label}
                  change={platform.change}
                  changeLabel={platform.changeLabel}
                  growthRate={platform.growthRate}
                  changeType={platform.changeType}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaSection;