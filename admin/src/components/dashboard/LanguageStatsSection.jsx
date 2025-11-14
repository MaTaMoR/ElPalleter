import React from 'react';
import { getLanguageFlag, getLanguageName, formatNumber, formatPercentage } from '@utils/analyticsUtils';
import styles from './LanguageStatsSection.module.css';

const LanguageStatsSection = ({ analyticsData }) => {
  const languageStats = analyticsData?.languageStats || {};
  const totalVisits = analyticsData?.totalVisits || 0;

  const languages = Object.entries(languageStats).map(([code, count]) => ({
    code: code,
    name: getLanguageName(code),
    count: count,
    percentage: totalVisits > 0 ? (count / totalVisits) * 100 : 0,
    flag: getLanguageFlag(code)
  })).sort((a, b) => b.count - a.count);

  if (languages.length === 0) {
    return (
      <div className={styles.languageStats}>
        <h4>Idiomas</h4>
        <p className="text-muted">No hay datos de idiomas disponibles</p>
      </div>
    );
  }

  return (
    <div className={styles.languageStats}>
      <h4>Idiomas</h4>
      <div className={styles.languageList}>
        {languages.map((language) => (
          <div key={language.code} className={styles.languageItem}>
            <span className={styles.languageFlag}>{language.flag}</span>
            <span className={styles.languageName}>{language.name}</span>
            <div>
              <div className={styles.languageCount}>{formatNumber(language.count)}</div>
              <div className={styles.languagePercentage}>({formatPercentage(language.percentage)})</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageStatsSection;