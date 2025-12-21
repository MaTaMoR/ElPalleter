import React from 'react';
import DashboardCard from '../common/DashboardCard';
import styles from './MetricCard.module.css';

const MetricCard = ({
  title,
  value,
  formatter = (v) => v,
  change,
  icon: Icon
}) => {
  const isPositive = change?.changeType === 'positive';
  const isNegative = change?.changeType === 'negative';
  const isNeutral = change?.changeType === 'neutral';

  return (
    <DashboardCard changeType={change?.showChange ? change.changeType : 'neutral'}>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <div className={styles.iconTitleWrapper}>
            <div className={styles.iconContainer}>
              {Icon && <Icon className={styles.cardIcon} size={20} />}
            </div>
            <span className={styles.cardTitle}>{title}</span>
          </div>

          {change?.showChange && (
            <div className={`${styles.changeBadge} ${styles[change.changeType]}`}>
              <span>{change.displayText}</span>
            </div>
          )}
        </div>

        <div className={styles.cardValue}>
          {formatter(value)}
        </div>

        <div className={styles.cardFooter}>
          vs período anterior
        </div>
      </div>
    </DashboardCard>
  );
};

export default MetricCard;