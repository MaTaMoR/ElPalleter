import { useState, useEffect } from 'react';
import { CONTACT_VALIDATION_CONFIG } from '../config/contactValidationConfig';
import {
  validateTextField,
  validateEmailField,
  validatePhoneField,
  validateUrlField,
  validatePostalCodeField,
  validateTimeField
} from '../utils/validationUtils';

/**
 * Hook to handle contact data validation
 * Validates contact info, schedules, and social media
 */
export const useContactValidation = (contactData, isEditing) => {
  const [validationErrors, setValidationErrors] = useState({});

  const validateContactData = () => {
    const errors = {};

    if (!contactData) {
      return errors;
    }

    // Validate ContactInfo
    if (contactData.contactInfo) {
      const contactInfoErrors = {};
      const config = CONTACT_VALIDATION_CONFIG.contactInfo;
      const info = contactData.contactInfo;

      // Validate street
      const streetError = validateTextField(info.street, config.street);
      if (streetError) contactInfoErrors.street = streetError;

      // Validate postal code
      const postalCodeError = validatePostalCodeField(info.postalCode, config.postalCode);
      if (postalCodeError) contactInfoErrors.postalCode = postalCodeError;

      // Validate city
      const cityError = validateTextField(info.city, config.city);
      if (cityError) contactInfoErrors.city = cityError;

      // Validate province
      const provinceError = validateTextField(info.province, config.province);
      if (provinceError) contactInfoErrors.province = provinceError;

      // Validate country
      const countryError = validateTextField(info.country, config.country);
      if (countryError) contactInfoErrors.country = countryError;

      // Validate phone
      const phoneError = validatePhoneField(info.phoneMain, config.phoneMain);
      if (phoneError) contactInfoErrors.phoneMain = phoneError;

      // Validate email
      const emailError = validateEmailField(info.emailMain, config.emailMain);
      if (emailError) contactInfoErrors.emailMain = emailError;

      // Validate website (optional)
      if (info.website && info.website.trim()) {
        const websiteError = validateUrlField(info.website, config.website);
        if (websiteError) contactInfoErrors.website = websiteError;
      }

      if (Object.keys(contactInfoErrors).length > 0) {
        errors.contactInfo = contactInfoErrors;
      }
    }

    // Validate Schedules and Schedule Ranges
    if (contactData.schedules && Array.isArray(contactData.schedules)) {
      const schedulesErrors = {};

      contactData.schedules.forEach(schedule => {
        if (!schedule.isOpen || !schedule.scheduleRanges) {
          return; // Skip closed days
        }

        const rangesErrors = {};

        schedule.scheduleRanges.forEach((range, rangeIndex) => {
          const rangeErrors = {};
          const config = CONTACT_VALIDATION_CONFIG.scheduleRange;

          // Validate nameKey
          const nameKeyError = validateTextField(range.nameKey, config.nameKey);
          if (nameKeyError) rangeErrors.nameKey = nameKeyError;

          // Validate startTime
          const startTimeError = validateTimeField(range.startTime, config.startTime);
          if (startTimeError) rangeErrors.startTime = startTimeError;

          // Validate endTime
          const endTimeError = validateTimeField(range.endTime, config.endTime);
          if (endTimeError) rangeErrors.endTime = endTimeError;

          // Validate that endTime is after startTime
          if (!startTimeError && !endTimeError) {
            const startMinutes = timeToMinutes(range.startTime);
            const endMinutes = timeToMinutes(range.endTime);
            if (endMinutes <= startMinutes) {
              rangeErrors.endTime = 'La hora de fin debe ser posterior a la hora de inicio';
            }
          }

          if (Object.keys(rangeErrors).length > 0) {
            rangesErrors[rangeIndex] = rangeErrors;
          }
        });

        if (Object.keys(rangesErrors).length > 0) {
          schedulesErrors[schedule.dayOfWeek] = {
            ranges: rangesErrors
          };
        }
      });

      if (Object.keys(schedulesErrors).length > 0) {
        errors.schedules = schedulesErrors;
      }
    }

    // Validate Social Medias
    if (contactData.socialMedias && Array.isArray(contactData.socialMedias)) {
      const socialMediasErrors = {};

      contactData.socialMedias.forEach((social, socialIndex) => {
        const socialErrors = {};
        const config = CONTACT_VALIDATION_CONFIG.socialMedia;

        // Validate platform
        const platformError = validateTextField(social.platform, config.platform);
        if (platformError) socialErrors.platform = platformError;

        // Only validate URL and handle if the social media is enabled
        if (social.enabled) {
          // Validate URL
          const urlError = validateUrlField(social.url, config.url);
          if (urlError) socialErrors.url = urlError;

          // Validate handle
          const handleError = validateTextField(social.handle, config.handle);
          if (handleError) socialErrors.handle = handleError;
        }

        if (Object.keys(socialErrors).length > 0) {
          socialMediasErrors[socialIndex] = socialErrors;
        }
      });

      if (Object.keys(socialMediasErrors).length > 0) {
        errors.socialMedias = socialMediasErrors;
      }
    }

    return errors;
  };

  useEffect(() => {
    if (isEditing) {
      const errors = validateContactData();
      setValidationErrors(errors);
    } else {
      setValidationErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactData, isEditing]);

  const hasErrors = () => Object.keys(validationErrors).length > 0;

  return {
    validationErrors,
    validateContactData,
    hasErrors
  };
};

/**
 * Helper function to convert time string to minutes
 * @param {string} timeString - Time in format HH:MM
 * @returns {number} Minutes since midnight
 */
function timeToMinutes(timeString) {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}
