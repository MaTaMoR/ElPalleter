import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Trash2 } from 'lucide-react';
import MenuTextField from '../menu/fields/MenuTextField';
import MenuCheckbox from '../menu/fields/MenuCheckbox';
import Button from '../common/Button';
import styles from './ScheduleForm.module.css';

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
    // Read-only display
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Horarios</h2>
        <div className={styles.scheduleList}>
          {sortedSchedules.map(schedule => (
            <div key={schedule.dayOfWeek} className={styles.scheduleDay}>
              <div className={styles.dayName}>
                <strong>{dayNames[schedule.dayOfWeek]}:</strong>
              </div>
              <div className={styles.daySchedule}>
                {!schedule.isOpen || !schedule.scheduleRanges || schedule.scheduleRanges.length === 0 ? (
                  <span className={styles.closed}>Cerrado</span>
                ) : (
                  <div className={styles.ranges}>
                    {schedule.scheduleRanges.map((range, index) => (
                      <div key={index} className={styles.range}>
                        {range.nameKey && <span className={styles.rangeName}>{range.nameKey}: </span>}
                        <span className={styles.rangeTime}>
                          {range.startTime} - {range.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
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
                            label="Nombre del horario"
                            value={range.nameKey}
                            onChange={(value) => handleRangeChange(schedule.dayOfWeek, rangeIndex, 'nameKey', value)}
                            error={rangeError.nameKey}
                            placeholder="Ej: Mañana, Tarde, Todo el día"
                            required
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
                            title="Eliminar rango"
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
  schedules: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    dayOfWeek: PropTypes.string.isRequired,
    isOpen: PropTypes.bool.isRequired,
    scheduleRanges: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      nameKey: PropTypes.string,
      startTime: PropTypes.string,
      endTime: PropTypes.string
    }))
  })).isRequired,
  onChange: PropTypes.func,
  errors: PropTypes.object,
  isEditing: PropTypes.bool
};

export default ScheduleForm;
