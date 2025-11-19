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

  if (!isEditing) {
    // Read-only display with weekly calendar grid
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Horarios</h2>
        <WeeklyCalendar schedules={sortedSchedules} />
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
