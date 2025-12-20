import React from 'react';
import Skeleton from '../../common/Skeleton';
import styles from './SocialMediaSection.module.css';

const SocialMediaCardSkeleton = () => {
  return (
    <div className={styles.cardSkeleton}>
      <Skeleton width="100%" height="180px" borderRadius="12px" />
    </div>
  );
};

const SocialMediaSectionSkeleton = () => {
  return (
    <div className={styles.socialGrid}>
      <SocialMediaCardSkeleton />
      <SocialMediaCardSkeleton />
      <SocialMediaCardSkeleton />
      <SocialMediaCardSkeleton />
    </div>
  );
};

export default SocialMediaSectionSkeleton;
