import React from 'react';
import PageContainer from '../../components/common/PageContainer';
import QuickManagementSection from '../../components/dashboard/QuickManagementSection';
import SocialMediaSection from '../../components/dashboard/socialmedia/SocialMediaSection';
import WebMetricsSection from '../../components/dashboard/metrics/WebMetricsSection';

const DashboardPage = () => {
  return (
    <PageContainer>
      <QuickManagementSection />
      <SocialMediaSection />
      <WebMetricsSection />
    </PageContainer>
  );
};

export default DashboardPage;