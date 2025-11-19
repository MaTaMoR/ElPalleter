import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, Trash2 } from 'lucide-react';
import MenuTextField from '../menu/fields/MenuTextField';
import Button from '../common/Button';
import ConfirmDialog from '../menu/utils/ConfirmDialog';
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
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    dayOfWeek: null,
    pattern: null,
    currentRanges: '',
    newRanges: ''
  });

  // State to keep orphan patterns (patterns without assigned days) visible
  const [orphanPatterns, setOrphanPatterns] = useState([]);
  // State to track the order of patterns to prevent reordering when days change
  const [patternOrder, setPatternOrder] = useState([]);

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

  // Group schedules by their time ranges for editing
  const groupSchedulesByPattern = () => {
    const patterns = [];
    const daysByPattern = {};

    sortedSchedules.forEach(schedule => {
      if (!schedule.isOpen || !schedule.scheduleRanges || schedule.scheduleRanges.length === 0) {
        return; // Skip closed days
      }

      // Create a normalized pattern key by sorting ranges and using only time values
      const normalizedRanges = [...schedule.scheduleRanges]
        .map(r => ({ s: r.startTime.trim(), e: r.endTime.trim() }))
        .sort((a, b) => {
          if (a.s !== b.s) return a.s.localeCompare(b.s);
          return a.e.localeCompare(b.e);
        });

      const patternKey = JSON.stringify(normalizedRanges);

      if (!daysByPattern[patternKey]) {
        // Create sorted ranges for consistent display
        const sortedRanges = [...schedule.scheduleRanges].sort((a, b) => {
          const timeA = a.startTime.trim();
          const timeB = b.startTime.trim();
          if (timeA !== timeB) return timeA.localeCompare(timeB);
          return a.endTime.trim().localeCompare(b.endTime.trim());
        });

        daysByPattern[patternKey] = {
          ranges: sortedRanges,
          days: []
        };
        patterns.push(patternKey);
      }

      daysByPattern[patternKey].days.push(schedule.dayOfWeek);
    });

    const activePatterns = patterns.map(key => ({
      patternKey: key,
      ...daysByPattern[key]
    }));

    // Remove orphans that now have days assigned
    const updatedOrphans = orphanPatterns.filter(orphan => {
      return !activePatterns.some(p => p.patternKey === orphan.patternKey);
    });

    // Update orphan patterns state if it changed
    if (updatedOrphans.length !== orphanPatterns.length) {
      setOrphanPatterns(updatedOrphans);
    }

    // Combine active and orphan patterns
    const allPatterns = [...activePatterns, ...updatedOrphans];

    // Update pattern order - add new patterns to the order list
    const newOrder = [...patternOrder];
    let orderChanged = false;

    allPatterns.forEach(pattern => {
      if (!newOrder.includes(pattern.patternKey)) {
        newOrder.push(pattern.patternKey);
        orderChanged = true;
      }
    });

    // Remove patterns that no longer exist
    const cleanedOrder = newOrder.filter(key =>
      allPatterns.some(p => p.patternKey === key)
    );

    if (orderChanged || cleanedOrder.length !== newOrder.length) {
      setPatternOrder(cleanedOrder);
    }

    // Sort patterns by the order they first appeared
    const orderedPatterns = allPatterns.sort((a, b) => {
      const indexA = cleanedOrder.indexOf(a.patternKey);
      const indexB = cleanedOrder.indexOf(b.patternKey);
      return indexA - indexB;
    });

    return orderedPatterns;
  };

  const handlePatternDayToggle = (pattern, dayOfWeek, isChecked) => {
    if (isChecked) {
      // Check if this day already has a different pattern assigned
      const currentSchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
      const isDayAlreadyAssigned = currentSchedule && currentSchedule.isOpen && currentSchedule.scheduleRanges.length > 0;

      if (isDayAlreadyAssigned) {
        // Check if it's a different pattern
        const currentPatternKey = JSON.stringify(
          [...currentSchedule.scheduleRanges]
            .map(r => ({ s: r.startTime.trim(), e: r.endTime.trim() }))
            .sort((a, b) => {
              if (a.s !== b.s) return a.s.localeCompare(b.s);
              return a.e.localeCompare(b.e);
            })
        );

        if (currentPatternKey !== pattern.patternKey) {
          const currentRanges = currentSchedule.scheduleRanges
            .map(r => `${r.startTime}-${r.endTime}`)
            .join(', ');
          const newRanges = pattern.ranges
            .map(r => `${r.startTime}-${r.endTime}`)
            .join(', ');

          // Show confirmation dialog
          setConfirmDialog({
            isOpen: true,
            dayOfWeek,
            pattern,
            currentRanges,
            newRanges
          });
          return; // Wait for user confirmation
        }
      }
    }

    // Apply the change
    applyPatternToDay(pattern, dayOfWeek, isChecked);
  };

  const applyPatternToDay = (pattern, dayOfWeek, isChecked) => {
    const updatedSchedules = schedules.map(schedule => {
      if (schedule.dayOfWeek === dayOfWeek) {
        if (isChecked) {
          // Apply this pattern to the day
          return {
            ...schedule,
            isOpen: true,
            scheduleRanges: pattern.ranges.map(r => ({ ...r }))
          };
        } else {
          // Remove pattern from day (close it)
          return {
            ...schedule,
            isOpen: false,
            scheduleRanges: []
          };
        }
      }
      return schedule;
    });

    // Check if we need to preserve a pattern that's losing its last day
    if (isChecked) {
      // Find the old pattern of the day being changed
      const oldSchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
      if (oldSchedule && oldSchedule.isOpen && oldSchedule.scheduleRanges.length > 0) {
        // Create the old pattern key
        const oldPatternKey = JSON.stringify(
          [...oldSchedule.scheduleRanges]
            .map(r => ({ s: r.startTime.trim(), e: r.endTime.trim() }))
            .sort((a, b) => {
              if (a.s !== b.s) return a.s.localeCompare(b.s);
              return a.e.localeCompare(b.e);
            })
        );

        // Check if this pattern will have any days left after the change
        const daysWithOldPattern = updatedSchedules.filter(s => {
          if (!s.isOpen || !s.scheduleRanges || s.scheduleRanges.length === 0) return false;
          const scheduleKey = JSON.stringify(
            [...s.scheduleRanges]
              .map(r => ({ s: r.startTime.trim(), e: r.endTime.trim() }))
              .sort((a, b) => {
                if (a.s !== b.s) return a.s.localeCompare(b.s);
                return a.e.localeCompare(b.e);
              })
          );
          return scheduleKey === oldPatternKey;
        });

        // If the old pattern has no days left and is not already an orphan, make it orphan
        if (daysWithOldPattern.length === 0) {
          const isAlreadyOrphan = orphanPatterns.some(o => o.patternKey === oldPatternKey);
          if (!isAlreadyOrphan) {
            const sortedRanges = [...oldSchedule.scheduleRanges].sort((a, b) => {
              const timeA = a.startTime.trim();
              const timeB = b.startTime.trim();
              if (timeA !== timeB) return timeA.localeCompare(timeB);
              return a.endTime.trim().localeCompare(b.endTime.trim());
            });

            setOrphanPatterns(prev => [...prev, {
              patternKey: oldPatternKey,
              ranges: sortedRanges,
              days: []
            }]);
          }
        }
      }
    }

    onChange(updatedSchedules);
  };

  const handleConfirmDialogConfirm = () => {
    const { pattern, dayOfWeek } = confirmDialog;
    applyPatternToDay(pattern, dayOfWeek, true);
    setConfirmDialog({ isOpen: false, dayOfWeek: null, pattern: null, currentRanges: '', newRanges: '' });
  };

  const handleConfirmDialogCancel = () => {
    setConfirmDialog({ isOpen: false, dayOfWeek: null, pattern: null, currentRanges: '', newRanges: '' });
  };

  const handlePatternRangeChange = (pattern, rangeIndex, field, value) => {
    // If this is an orphan pattern, update the orphan patterns state
    if (pattern.days.length === 0) {
      setOrphanPatterns(prev => prev.map(orphan => {
        if (orphan.patternKey === pattern.patternKey) {
          const updatedRanges = [...orphan.ranges];
          updatedRanges[rangeIndex] = {
            ...updatedRanges[rangeIndex],
            [field]: value
          };
          return { ...orphan, ranges: updatedRanges };
        }
        return orphan;
      }));
      return;
    }

    const updatedSchedules = schedules.map(schedule => {
      // Update all days that use this pattern
      if (pattern.days.includes(schedule.dayOfWeek) && schedule.isOpen) {
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

  const handlePatternAddRange = (pattern) => {
    const newRange = {
      id: Date.now(),
      nameKey: '',
      startTime: '09:00',
      endTime: '17:00'
    };

    // If this is an orphan pattern, update the orphan patterns state
    if (pattern.days.length === 0) {
      setOrphanPatterns(prev => prev.map(orphan => {
        if (orphan.patternKey === pattern.patternKey) {
          return { ...orphan, ranges: [...orphan.ranges, newRange] };
        }
        return orphan;
      }));
      return;
    }

    const updatedSchedules = schedules.map(schedule => {
      if (pattern.days.includes(schedule.dayOfWeek) && schedule.isOpen) {
        return {
          ...schedule,
          scheduleRanges: [...schedule.scheduleRanges, newRange]
        };
      }
      return schedule;
    });
    onChange(updatedSchedules);
  };

  const handlePatternDeleteRange = (pattern, rangeIndex) => {
    // If this is an orphan pattern, update the orphan patterns state
    if (pattern.days.length === 0) {
      setOrphanPatterns(prev => prev.map(orphan => {
        if (orphan.patternKey === pattern.patternKey) {
          const updatedRanges = orphan.ranges.filter((_, index) => index !== rangeIndex);
          return { ...orphan, ranges: updatedRanges };
        }
        return orphan;
      }));
      return;
    }

    const updatedSchedules = schedules.map(schedule => {
      if (pattern.days.includes(schedule.dayOfWeek) && schedule.isOpen) {
        const updatedRanges = schedule.scheduleRanges.filter((_, index) => index !== rangeIndex);
        return { ...schedule, scheduleRanges: updatedRanges };
      }
      return schedule;
    });
    onChange(updatedSchedules);
  };

  const handleAddNewPattern = () => {
    // Add a new pattern to the first day that's currently closed
    const closedDay = sortedSchedules.find(s => !s.isOpen);
    if (closedDay) {
      const updatedSchedules = schedules.map(schedule => {
        if (schedule.dayOfWeek === closedDay.dayOfWeek) {
          return {
            ...schedule,
            isOpen: true,
            scheduleRanges: [{
              id: Date.now(),
              nameKey: '',
              startTime: '09:00',
              endTime: '17:00'
            }]
          };
        }
        return schedule;
      });
      onChange(updatedSchedules);
    }
  };

  const handleDeleteOrphanPattern = (patternKey) => {
    setOrphanPatterns(prev => prev.filter(orphan => orphan.patternKey !== patternKey));
  };

  // Editable form - pattern-based layout
  const patterns = groupSchedulesByPattern();

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Horarios</h2>
      <div className={styles.patternsContainer}>
        {patterns.map((pattern, patternIndex) => {
          const firstDayWithPattern = pattern.days[0];
          const dayErrors = errors[firstDayWithPattern] || {};
          const rangeErrors = dayErrors.ranges || {};

          const isOrphan = pattern.days.length === 0;

          return (
            <div key={patternIndex} className={`${styles.patternCard} ${isOrphan ? styles.orphanPattern : ''}`}>
              <div className={styles.patternHeader}>
                <span className={styles.patternTitle}>
                  Patrón {patternIndex + 1}
                  {isOrphan && <span className={styles.orphanBadge}>(Sin días asignados)</span>}
                </span>
                {isOrphan && (
                  <button
                    type="button"
                    className={styles.deletePatternButton}
                    onClick={() => handleDeleteOrphanPattern(pattern.patternKey)}
                    aria-label="Eliminar patrón"
                    title="Eliminar patrón"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {/* Time ranges for this pattern */}
              <div className={styles.patternRanges}>
                <label className={styles.patternLabel}>Horarios:</label>
                <div className={styles.rangesColumn}>
                  {pattern.ranges.map((range, rangeIndex) => {
                    const rangeError = rangeErrors[rangeIndex] || {};

                    return (
                      <div key={rangeIndex} className={styles.rangeRow}>
                        <MenuTextField
                          label="Inicio"
                          value={range.startTime}
                          onChange={(value) => handlePatternRangeChange(pattern, rangeIndex, 'startTime', value)}
                          error={rangeError.startTime}
                          placeholder="09:00"
                          required
                        />
                        <MenuTextField
                          label="Fin"
                          value={range.endTime}
                          onChange={(value) => handlePatternRangeChange(pattern, rangeIndex, 'endTime', value)}
                          error={rangeError.endTime}
                          placeholder="17:00"
                          required
                        />
                        <div className={styles.rangeActions}>
                          <button
                            type="button"
                            className={styles.addRangeButton}
                            onClick={() => handlePatternAddRange(pattern)}
                            aria-label="Añadir rango horario"
                            title="Añadir rango horario"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            type="button"
                            className={styles.deleteRangeButton}
                            onClick={() => handlePatternDeleteRange(pattern, rangeIndex)}
                            aria-label="Eliminar rango horario"
                            title="Eliminar rango horario"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day selectors */}
              <div className={styles.patternDays}>
                <label className={styles.patternLabel}>Días:</label>
                <div className={styles.daysGrid}>
                  {dayOrder.map(day => {
                    const isSelected = pattern.days.includes(day);
                    return (
                      <label key={day} className={styles.dayCheckbox}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handlePatternDayToggle(pattern, day, e.target.checked)}
                        />
                        <span className={styles.dayCheckboxLabel}>{dayNames[day]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add new pattern button */}
        {patterns.length < 7 && (
          <Button
            variant="secondary"
            icon={Plus}
            onClick={handleAddNewPattern}
            className={styles.addPatternButton}
          >
            Añadir patrón de horario
          </Button>
        )}
      </div>

      {/* Confirmation dialog for pattern reassignment */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Cambiar horario del día"
        message={`${confirmDialog.dayOfWeek ? dayNames[confirmDialog.dayOfWeek] : ''} ya tiene el horario: ${confirmDialog.currentRanges}\n\n¿Deseas cambiarlo a: ${confirmDialog.newRanges}?`}
        confirmText="Cambiar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDialogConfirm}
        onCancel={handleConfirmDialogCancel}
        type="warning"
      />
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
