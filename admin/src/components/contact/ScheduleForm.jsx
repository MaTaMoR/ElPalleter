import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Trash2 } from 'lucide-react';
import MenuTextField from '../menu/fields/MenuTextField';
import MenuCheckbox from '../menu/fields/MenuCheckbox';
import Button from '../common/Button';
import styles from './ScheduleForm.module.css';

/**
 * Weekly Calendar component for displaying schedules in a grid format
 * Columns: Days of the week (Mon-Sun)
 * Rows: Hours where the restaurant has any activity
 */
const WeeklyCalendar = ({ schedules }) => {
  const dayNames = {
    monday: 'Lun',
    tuesday: 'Mar',
    wednesday: 'Mié',
    thursday: 'Jue',
    friday: 'Vie',
    saturday: 'Sáb',
    sunday: 'Dom'
  };

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Get all unique hours from all schedules
  const getAllHours = () => {
    const hoursSet = new Set();

    schedules.forEach(schedule => {
      if (schedule.isOpen && schedule.scheduleRanges) {
        schedule.scheduleRanges.forEach(range => {
          const startHour = parseInt(range.startTime.split(':')[0]);
          const endHour = parseInt(range.endTime.split(':')[0]);

          // Add all hours in the range
          for (let hour = startHour; hour <= endHour; hour++) {
            hoursSet.add(hour);
          }
        });
      }
    });

    return Array.from(hoursSet).sort((a, b) => a - b);
  };

  // Check if a specific hour is within any open range for a day
  const isHourOpen = (dayOfWeek, hour) => {
    const schedule = schedules.find(s => s.dayOfWeek === dayOfWeek);

    if (!schedule || !schedule.isOpen || !schedule.scheduleRanges) {
      return false;
    }

    return schedule.scheduleRanges.some(range => {
      const [startHour, startMinute] = range.startTime.split(':').map(Number);
      const [endHour, endMinute] = range.endTime.split(':').map(Number);

      // Convert times to minutes since midnight for accurate comparison
      const rangeStartMinutes = startHour * 60 + startMinute;
      const rangeEndMinutes = endHour * 60 + endMinute;
      const hourStartMinutes = hour * 60;
      const hourEndMinutes = (hour + 1) * 60;

      // Check if the hour overlaps with the range
      return rangeStartMinutes < hourEndMinutes && rangeEndMinutes > hourStartMinutes;
    });
  };

  const hours = getAllHours();

  if (hours.length === 0) {
    return <span className={styles.closed}>Cerrado toda la semana</span>;
  }

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendar}>
        {/* Header row with days */}
        <div className={styles.calendarHeader}>
          <div className={styles.timeLabel}></div>
          {dayOrder.map(day => (
            <div key={day} className={styles.dayLabel}>
              {dayNames[day]}
            </div>
          ))}
        </div>

        {/* Hour rows */}
        {hours.map(hour => (
          <div key={hour} className={styles.calendarRow}>
            <div className={styles.timeLabel}>
              {hour.toString().padStart(2, '0')}:00
            </div>
            {dayOrder.map(day => (
              <div
                key={`${day}-${hour}`}
                className={`${styles.calendarCell} ${isHourOpen(day, hour) ? styles.cellOpen : styles.cellClosed}`}
              >
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

WeeklyCalendar.propTypes = {
  schedules: PropTypes.arrayOf(
    PropTypes.shape({
      dayOfWeek: PropTypes.string.isRequired,
      isOpen: PropTypes.bool.isRequired,
      scheduleRanges: PropTypes.arrayOf(
        PropTypes.shape({
          startTime: PropTypes.string.isRequired,
          endTime: PropTypes.string.isRequired
        })
      )
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

  // Group consecutive days with the same schedule for editing
  const groupSchedulesForEdit = () => {
    const groups = [];
    let currentGroup = null;

    sortedSchedules.forEach((schedule) => {
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
    // Read-only display with weekly calendar grid
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Horarios</h2>
        <WeeklyCalendar schedules={sortedSchedules} />
      </div>
    );
  }

  // Handler for group changes (updates all days in the group)
  const handleGroupDayOpenChange = (group, isOpen) => {
    const updatedSchedules = schedules.map(schedule =>
      group.days.includes(schedule.dayOfWeek)
        ? { ...schedule, isOpen }
        : schedule
    );
    onChange(updatedSchedules);
  };

  const handleGroupRangeChange = (group, rangeIndex, field, value) => {
    const updatedSchedules = schedules.map(schedule => {
      if (group.days.includes(schedule.dayOfWeek)) {
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

  const handleGroupAddRange = (group) => {
    const updatedSchedules = schedules.map(schedule => {
      if (group.days.includes(schedule.dayOfWeek)) {
        const newRange = {
          id: Date.now(),
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

  const handleGroupDeleteRange = (group, rangeIndex) => {
    const updatedSchedules = schedules.map(schedule => {
      if (group.days.includes(schedule.dayOfWeek)) {
        const updatedRanges = schedule.scheduleRanges.filter((_, index) => index !== rangeIndex);
        return { ...schedule, scheduleRanges: updatedRanges };
      }
      return schedule;
    });
    onChange(updatedSchedules);
  };

  // Editable form - compact table-like layout with grouped days
  const groupedSchedules = groupSchedulesForEdit();

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Horarios</h2>
      <div className={styles.scheduleTable}>
        {groupedSchedules.map((group, groupIndex) => {
          const dayErrors = errors[group.startDay] || {};
          const rangeErrors = dayErrors.ranges || {};
          const isGrouped = group.days.length > 1;

          return (
            <div key={groupIndex} className={styles.scheduleRow}>
              {/* Day name(s) and open checkbox */}
              <div className={styles.dayColumn}>
                <div className={styles.dayNameGroup}>
                  <span className={styles.dayName}>{getDayRangeLabel(group)}</span>
                  {isGrouped && (
                    <span className={styles.groupBadge}>{group.days.length} días</span>
                  )}
                </div>
                <MenuCheckbox
                  label="Abierto"
                  checked={group.schedule.isOpen}
                  onChange={(checked) => handleGroupDayOpenChange(group, checked)}
                />
              </div>

              {/* Time ranges */}
              <div className={styles.rangesColumn}>
                {group.schedule.isOpen ? (
                  <>
                    {group.schedule.scheduleRanges && group.schedule.scheduleRanges.map((range, rangeIndex) => {
                      const rangeError = rangeErrors[rangeIndex] || {};

                      return (
                        <div key={rangeIndex} className={styles.rangeRow}>
                          <MenuTextField
                            label="Inicio"
                            value={range.startTime}
                            onChange={(value) => handleGroupRangeChange(group, rangeIndex, 'startTime', value)}
                            error={rangeError.startTime}
                            placeholder="09:00"
                            required
                          />
                          <MenuTextField
                            label="Fin"
                            value={range.endTime}
                            onChange={(value) => handleGroupRangeChange(group, rangeIndex, 'endTime', value)}
                            error={rangeError.endTime}
                            placeholder="17:00"
                            required
                          />
                          <div className={styles.rangeActions}>
                            <button
                              type="button"
                              className={styles.addRangeButton}
                              onClick={() => handleGroupAddRange(group)}
                              aria-label="Añadir rango horario"
                              title="Añadir rango horario"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              type="button"
                              className={styles.deleteRangeButton}
                              onClick={() => handleGroupDeleteRange(group, rangeIndex)}
                              aria-label="Eliminar rango horario"
                              title="Eliminar rango horario"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <span className={styles.closedLabel}>Cerrado</span>
                )}
              </div>
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
