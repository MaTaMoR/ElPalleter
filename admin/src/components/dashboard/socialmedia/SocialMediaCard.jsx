import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import DashboardCard from '../common/DashboardCard';
import styles from './SocialMediaCard.module.css';

const SocialMediaCard = ({
  platform,
  icon: Icon,
  mainStat,
  showStar,
  label,
  change,
  changeLabel,
  growthRate,
  changeType = 'positive'
}) => {
  const isPositive = changeType === 'positive';

  return (
    <DashboardCard changeType={changeType}>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <div className={styles.platformWrapper}>
            <div className={styles.iconContainer}>
              <Icon className={styles.platformIcon} size={20} />
            </div>
            <span className={styles.platformName}>{platform}</span>
          </div>

          <div className={`${styles.changeBadge} ${styles[changeType]}`}>
            <span>{change}</span>
          </div>
        </div>

        <div className={styles.mainStats}>
          <div className={styles.mainStatWrapper}>
            <span className={styles.mainStat}>{mainStat}</span>
            {showStar && showStar}
          </div>
          <div className={styles.statLabel}>{label}</div>
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.footerItem}>
            <div className={styles.footerLabel}>{changeLabel}</div>
            <div className={styles.footerValue}>{change}</div>
          </div>
          <div className={styles.footerItem}>
            <div className={styles.footerLabel}>Crecimiento</div>
            <div className={styles.footerValue}>{growthRate}</div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

export default SocialMediaCard;
