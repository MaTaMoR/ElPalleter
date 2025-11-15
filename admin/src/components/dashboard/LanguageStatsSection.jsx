import React from 'react';
import { getLanguageFlagUrl, getLanguageName, formatNumber, formatPercentage } from '@utils/analyticsUtils';
import styles from './LanguageStatsSection.module.css';

const LanguageStatsSection = ({ analyticsData }) => {
  const languageStats = analyticsData?.languageStats || {};
  const totalVisits = analyticsData?.totalVisits || 0;

  const languages = Object.entries(languageStats).map(([code, count]) => ({
    code: code,
    name: getLanguageName(code),
    count: count,
    percentage: totalVisits > 0 ? (count / totalVisits) * 100 : 0,
    flagUrl: getLanguageFlagUrl(code)
  })).sort((a, b) => b.count - a.count);

  if (languages.length === 0) {
    return (
      <div className={styles.languageStats}>
        <h4>Idiomas</h4>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
          No hay datos de idiomas disponibles
        </p>
      </div>
    );
  }

  return (
    <div className={styles.languageStats}>
      <h4>Idiomas</h4>
      <div className={styles.languageList}>
        {languages.map((language) => (
          <div key={language.code} className={styles.languageItem}>
            <div className={styles.languageLeft}>
              {language.flagUrl && (
                <img 
                  src={language.flagUrl} 
                  alt={`${language.name} flag`}
                  className={styles.languageFlag}
                />
              )}
              <span className={styles.languageName}>{language.name}</span>
            </div>
            <div className={styles.languageRight}>
              <span className={styles.languageCount}>{formatNumber(language.count)}</span>
              <span className={styles.languagePercentage}>{formatPercentage(language.percentage)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageStatsSection;