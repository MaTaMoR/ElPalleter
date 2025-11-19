import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Trash2, Clock } from 'lucide-react';
import MenuTextField from '../menu/fields/MenuTextField';
import MenuCheckbox from '../menu/fields/MenuCheckbox';
import Button from '../common/Button';
import styles from './ScheduleForm.module.css';

/**
 * Badge component for displaying time ranges
 */
const TimeBadges = ({ ranges }) => {
  return (
    <div className={styles.badgesContainer}>
      {ranges.map((range, index) => (
        <div key={index} className={styles.timeBadge}>
          <Clock size={14} className={styles.badgeIcon} />
          <span className={styles.badgeTime}>
            {range.startTime} - {range.endTime}
          </span>
          {range.nameKey && (
            <span className={styles.badgeLabel}>({range.nameKey})</span>
          )}
        </div>
      ))}
    </div>
  );
};

TimeBadges.propTypes = {
  ranges: PropTypes.arrayOf(
    PropTypes.shape({
      startTime: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
      nameKey: PropTypes.string
    })
  ).isRequired
};

/**
 * Form component for editing restaurant schedules
 * Allows toggling days open/closed and editing time ranges
 */
const ScheduleForm = ({
  schedules,
  onChange,
  errors = {},
  isEditing = false
}) => {
  const dayNames = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const handleDayOpenChange = (dayOfWeek, isOpen) => {
    const updatedSchedules = schedules.map(schedule =>
      schedule.dayOfWeek === dayOfWeek
        ? { ...schedule, isOpen }
        : schedule
    );
    onChange(updatedSchedules);
  };

  const handleRangeChange = (dayOfWeek, rangeIndex, field, value) => {
    const updatedSchedules = schedules.map(schedule => {
      if (schedule.dayOfWeek === dayOfWeek) {
        const updatedRanges = [...schedule.scheduleRanges];
        updatedRanges[rangeIndex] = {
          ...updatedRanges[rangeIndex],
          [field]: value
        };
        return { ...schedule, scheduleRanges: updatedRanges };
      }
      return schedule;
    });
    onChange(updatedSchedules);
  };

  const handleAddRange = (dayOfWeek) => {
    const updatedSchedules = schedules.map(schedule => {
      if (schedule.dayOfWeek === dayOfWeek) {
        const newRange = {
          id: Date.now(), // Temporary ID for new ranges
          nameKey: '',
          startTime: '09:00',
          endTime: '17:00'
        };
        return {
          ...schedule,
          scheduleRanges: [...(schedule.scheduleRanges || []), newRange]
        };
      }
      return schedule;
    });
    onChange(updatedSchedules);
  };

  const handleDeleteRange = (dayOfWeek, rangeIndex) => {
    const updatedSchedules = schedules.map(schedule => {
      if (schedule.dayOfWeek === dayOfWeek) {
        const updatedRanges = schedule.scheduleRanges.filter((_, index) => index !== rangeIndex);
        return { ...schedule, scheduleRanges: updatedRanges };
      }
      return schedule;
    });
    onChange(updatedSchedules);
  };

  // Sort schedules by day order
  const sortedSchedules = [...schedules].sort((a, b) => {
    return dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
  });

  // Group consecutive days with the same schedule
  const groupSchedules = () => {
    const groups = [];
    let currentGroup = null;

    sortedSchedules.forEach((schedule, index) => {
      const scheduleKey = schedule.isOpen
        ? JSON.stringify(schedule.scheduleRanges?.map(r => ({ s: r.startTime, e: r.endTime })) || [])
        : 'closed';

      if (currentGroup && currentGroup.scheduleKey === scheduleKey) {
        // Add to current group
        currentGroup.days.push(schedule.dayOfWeek);
        currentGroup.endDay = schedule.dayOfWeek;
      } else {
        // Start new group
        currentGroup = {
          scheduleKey,
          days: [schedule.dayOfWeek],
          startDay: schedule.dayOfWeek,
          endDay: schedule.dayOfWeek,
          schedule: schedule
        };
        groups.push(currentGroup);
      }
    });

    return groups;
  };

  const getDayRangeLabel = (group) => {
    if (group.days.length === 1) {
      return dayNames[group.startDay];
    }
    return `${dayNames[group.startDay]} - ${dayNames[group.endDay]}`;
  };

  if (!isEditing) {
    // Read-only display with grouped days
    const groupedSchedules = groupSchedules();

    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Horarios</h2>
        <div className={styles.scheduleList}>
          {groupedSchedules.map((group, index) => (
            <div key={index} className={styles.scheduleDay}>
              <div className={styles.dayName}>
                <strong>{getDayRangeLabel(group)}:</strong>
              </div>
              <div className={styles.daySchedule}>
                {!group.schedule.isOpen || !group.schedule.scheduleRanges || group.schedule.scheduleRanges.length === 0 ? (
                  <span className={styles.closed}>Cerrado</span>
                ) : (
                  <TimeBadges ranges={group.schedule.scheduleRanges} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Editable form
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Horarios</h2>
      <div className={styles.scheduleEditor}>
        {sortedSchedules.map(schedule => {
          const dayErrors = errors[schedule.dayOfWeek] || {};
          const rangeErrors = dayErrors.ranges || {};

          return (
            <div key={schedule.dayOfWeek} className={styles.dayEditor}>
              <div className={styles.dayHeader}>
                <h3 className={styles.dayTitle}>{dayNames[schedule.dayOfWeek]}</h3>
                <MenuCheckbox
                  label="Abierto"
                  checked={schedule.isOpen}
                  onChange={(checked) => handleDayOpenChange(schedule.dayOfWeek, checked)}
                />
              </div>

              {schedule.isOpen && (
                <div className={styles.rangesEditor}>
                  {schedule.scheduleRanges && schedule.scheduleRanges.map((range, rangeIndex) => {
                    const rangeError = rangeErrors[rangeIndex] || {};

                    return (
                      <div key={rangeIndex} className={styles.rangeEditor}>
                        <div className={styles.rangeFields}>
                          <MenuTextField
                            label="Nombre (opcional)"
                            value={range.nameKey}
                            onChange={(value) => handleRangeChange(schedule.dayOfWeek, rangeIndex, 'nameKey', value)}
                            error={rangeError.nameKey}
                            placeholder="ej: Almuerzo, Cena"
                          />
                          <MenuTextField
                            label="Hora inicio"
                            value={range.startTime}
                            onChange={(value) => handleRangeChange(schedule.dayOfWeek, rangeIndex, 'startTime', value)}
                            error={rangeError.startTime}
                            placeholder="09:00"
                            required
                          />
                          <MenuTextField
                            label="Hora fin"
                            value={range.endTime}
                            onChange={(value) => handleRangeChange(schedule.dayOfWeek, rangeIndex, 'endTime', value)}
                            error={rangeError.endTime}
                            placeholder="17:00"
                            required
                          />
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => handleDeleteRange(schedule.dayOfWeek, rangeIndex)}
                            aria-label="Eliminar rango horario"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    variant="secondary"
                    icon={Plus}
                    onClick={() => handleAddRange(schedule.dayOfWeek)}
                    className={styles.addRangeButton}
                  >
                    Añadir rango horario
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

ScheduleForm.propTypes = {
  schedules: PropTypes.arrayOf(
    PropTypes.shape({
      dayOfWeek: PropTypes.string.isRequired,
      isOpen: PropTypes.bool.isRequired,
      scheduleRanges: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number,
          nameKey: PropTypes.string,
          startTime: PropTypes.string.isRequired,
          endTime: PropTypes.string.isRequired
        })
      )
    })
  ).isRequired,
  onChange: PropTypes.func,
  errors: PropTypes.object,
  isEditing: PropTypes.bool
};

export default ScheduleForm;
