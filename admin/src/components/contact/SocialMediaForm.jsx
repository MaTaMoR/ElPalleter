import React from 'react';
import PropTypes from 'prop-types';
import { Share2 } from 'lucide-react';
import MenuTextField from '../menu/fields/MenuTextField';
import MenuCheckbox from '../menu/fields/MenuCheckbox';
import styles from './SocialMediaForm.module.css';

/**
 * Form component for editing social media links
 * Allows enabling/disabling platforms and editing URLs and handles
 */
const SocialMediaForm = ({
  socialMedias,
  onChange,
  errors = {},
  isEditing = false
}) => {
  const handleSocialChange = (socialIndex, field, value) => {
    const updatedSocials = socialMedias.map((social, index) =>
      index === socialIndex
        ? { ...social, [field]: value }
        : social
    );
    onChange(updatedSocials);
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
      whatsapp: '💬',
      youtube: '📹',
      tiktok: '🎵',
      linkedin: '💼'
    };
    return icons[platform.toLowerCase()] || '🔗';
  };

  if (!isEditing) {
    // Read-only display - only show enabled socials
    const enabledSocials = socialMedias.filter(social => social.enabled);

    if (enabledSocials.length === 0) {
      return (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Redes Sociales</h2>
          <div className={styles.socialMediaCard}>
            <div className={styles.cardHeader}>
              <Share2 size={20} className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Redes Sociales</h3>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.emptyMessage}>No hay redes sociales configuradas</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Redes Sociales</h2>
        <div className={styles.socialMediaCard}>
          <div className={styles.cardHeader}>
            <Share2 size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Redes Sociales</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.socialGrid}>
              {enabledSocials.map((social, index) => (
                <div key={index} className={styles.socialCard}>
                  <div className={styles.socialIcon}>{getPlatformIcon(social.platform)}</div>
                  <div className={styles.socialInfo}>
                    <div className={styles.platform}>{social.platform}</div>
                    <div className={styles.handle}>{social.handle}</div>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialLink}
                    >
                      Ver perfil →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Editable form
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Redes Sociales</h2>
      <div className={styles.socialMediaCard}>
        <div className={styles.cardHeader}>
          <Share2 size={20} className={styles.cardIcon} />
          <h3 className={styles.cardTitle}>Configuración de redes sociales</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.socialEditor}>
            {socialMedias.map((social, socialIndex) => {
              const socialErrors = errors[socialIndex] || {};

              return (
                <div key={socialIndex} className={styles.socialItem}>
                  <div className={styles.socialHeader}>
                    <div className={styles.socialHeaderLeft}>
                      <div className={styles.socialIconLarge}>
                        {getPlatformIcon(social.platform)}
                      </div>
                      <h3 className={styles.socialPlatform}>{social.platform}</h3>
                    </div>
                    <MenuCheckbox
                      label="Habilitado"
                      checked={social.enabled}
                      onChange={(checked) => handleSocialChange(socialIndex, 'enabled', checked)}
                    />
                  </div>

                  {social.enabled && (
                    <div className={styles.socialFields}>
                      <MenuTextField
                        label="Usuario / Handle"
                        value={social.handle}
                        onChange={(value) => handleSocialChange(socialIndex, 'handle', value)}
                        error={socialErrors.handle}
                        placeholder="@restaurante"
                        required
                      />

                      <MenuTextField
                        label="URL del perfil"
                        value={social.url}
                        onChange={(value) => handleSocialChange(socialIndex, 'url', value)}
                        error={socialErrors.url}
                        placeholder={`https://${social.platform.toLowerCase()}.com/restaurante`}
                        required
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

SocialMediaForm.propTypes = {
  socialMedias: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    platform: PropTypes.string.isRequired,
    enabled: PropTypes.bool.isRequired,
    url: PropTypes.string,
    handle: PropTypes.string,
    icon: PropTypes.string
  })).isRequired,
  onChange: PropTypes.func,
  errors: PropTypes.object,
  isEditing: PropTypes.bool
};

export default SocialMediaForm;
