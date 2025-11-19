import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, Trash2, Clock } from 'lucide-react';
import MenuTextField from '../menu/fields/MenuTextField';
import Button from '../common/Button';
import ConfirmDialog from '../menu/utils/ConfirmDialog';
import BadgeToggle from '../common/BadgeToggle';
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
    newRanges: '',
    overlappingRanges: []
  });

  // State to keep orphan patterns (patterns without assigned days) visible
  const [orphanPatterns, setOrphanPatterns] = useState([]);
  // State to track the order of patterns to prevent reordering when days change
  const [patternOrder, setPatternOrder] = useState([]);

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeString) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  // Helper function to check if two time ranges overlap
  const rangesOverlap = (range1, range2) => {
    const start1 = timeToMinutes(range1.startTime);
    const end1 = timeToMinutes(range1.endTime);
    const start2 = timeToMinutes(range2.startTime);
    const end2 = timeToMinutes(range2.endTime);
    return start1 < end2 && start2 < end1;
  };

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
        <div className={styles.scheduleCard}>
          <div className={`${styles.cardHeader} ${styles.cardHeaderReadOnly}`}>
            <Clock size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Horario semanal</h3>
          </div>
          <div className={styles.cardContent}>
            <WeeklyCalendar schedules={sortedSchedules} />
          </div>
        </div>
      </div>
    );
  }

  // Group schedules by their time ranges for editing
  const groupSchedulesByPattern = () => {
    const patterns = [];
    const daysByPattern = {};

    // First, collect all unique patterns from all schedules
    // Now we need to find all unique subsets of ranges that form patterns
    sortedSchedules.forEach(schedule => {
      if (!schedule.isOpen || !schedule.scheduleRanges || schedule.scheduleRanges.length === 0) {
        return; // Skip closed days
      }

      // For each individual range in the schedule, create a pattern
      schedule.scheduleRanges.forEach(range => {
        const normalizedRange = { s: range.startTime.trim(), e: range.endTime.trim() };
        const patternKey = JSON.stringify([normalizedRange]);

        if (!daysByPattern[patternKey]) {
          daysByPattern[patternKey] = {
            ranges: [{ ...range }],
            days: []
          };
          patterns.push(patternKey);
        }
      });
    });

    // Now check which days have each pattern assigned
    patterns.forEach(patternKey => {
      const pattern = daysByPattern[patternKey];

      sortedSchedules.forEach(schedule => {
        if (!schedule.isOpen || !schedule.scheduleRanges) return;

        // Check if this day contains all ranges from this pattern
        const hasAllRanges = pattern.ranges.every(patternRange => {
          return schedule.scheduleRanges.some(dayRange =>
            dayRange.startTime.trim() === patternRange.startTime.trim() &&
            dayRange.endTime.trim() === patternRange.endTime.trim()
          );
        });

        if (hasAllRanges) {
          pattern.days.push(schedule.dayOfWeek);
        }
      });
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
      // Check if this day already has ranges that would overlap with the new pattern
      const currentSchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);

      if (currentSchedule && currentSchedule.isOpen && currentSchedule.scheduleRanges && currentSchedule.scheduleRanges.length > 0) {
        // Find ranges that overlap with the pattern being added
        const overlappingRanges = [];

        pattern.ranges.forEach(patternRange => {
          currentSchedule.scheduleRanges.forEach(existingRange => {
            if (rangesOverlap(patternRange, existingRange)) {
              // Check if this range is not already in overlappingRanges
              const alreadyAdded = overlappingRanges.some(r =>
                r.startTime === existingRange.startTime && r.endTime === existingRange.endTime
              );
              if (!alreadyAdded) {
                overlappingRanges.push(existingRange);
              }
            }
          });
        });

        if (overlappingRanges.length > 0) {
          // There are overlapping ranges, show confirmation
          const currentRangesText = overlappingRanges
            .map(r => `${r.startTime}-${r.endTime}`)
            .join(', ');
          const newRangesText = pattern.ranges
            .map(r => `${r.startTime}-${r.endTime}`)
            .join(', ');

          setConfirmDialog({
            isOpen: true,
            dayOfWeek,
            pattern,
            currentRanges: currentRangesText,
            newRanges: newRangesText,
            overlappingRanges
          });
          return; // Wait for user confirmation
        }
      }
    }

    // Apply the change
    applyPatternToDay(pattern, dayOfWeek, isChecked);
  };

  const applyPatternToDay = (pattern, dayOfWeek, isChecked, removeOverlapping = false) => {
    const updatedSchedules = schedules.map(schedule => {
      if (schedule.dayOfWeek === dayOfWeek) {
        if (isChecked) {
          // Add pattern ranges to the day
          const currentRanges = schedule.scheduleRanges || [];

          let newRanges = [...currentRanges];

          // If we need to remove overlapping ranges (user confirmed)
          if (removeOverlapping && confirmDialog.overlappingRanges.length > 0) {
            newRanges = currentRanges.filter(existingRange => {
              return !confirmDialog.overlappingRanges.some(overlapping =>
                overlapping.startTime === existingRange.startTime &&
                overlapping.endTime === existingRange.endTime
              );
            });
          }

          // Add the new pattern ranges
          pattern.ranges.forEach(patternRange => {
            // Check if this range is already in the day
            const alreadyExists = newRanges.some(r =>
              r.startTime.trim() === patternRange.startTime.trim() &&
              r.endTime.trim() === patternRange.endTime.trim()
            );

            if (!alreadyExists) {
              newRanges.push({ ...patternRange });
            }
          });

          // Sort ranges by start time
          newRanges.sort((a, b) => {
            const timeA = a.startTime.trim();
            const timeB = b.startTime.trim();
            if (timeA !== timeB) return timeA.localeCompare(timeB);
            return a.endTime.trim().localeCompare(b.endTime.trim());
          });

          return {
            ...schedule,
            isOpen: true,
            scheduleRanges: newRanges
          };
        } else {
          // Remove pattern ranges from the day
          const currentRanges = schedule.scheduleRanges || [];

          const newRanges = currentRanges.filter(existingRange => {
            // Keep ranges that are NOT in the pattern
            return !pattern.ranges.some(patternRange =>
              patternRange.startTime.trim() === existingRange.startTime.trim() &&
              patternRange.endTime.trim() === existingRange.endTime.trim()
            );
          });

          return {
            ...schedule,
            isOpen: newRanges.length > 0,
            scheduleRanges: newRanges
          };
        }
      }
      return schedule;
    });

    // Check if we need to preserve a pattern that's losing its last day (when unchecking)
    if (!isChecked && pattern.days.length === 1 && pattern.days[0] === dayOfWeek) {
      // This pattern is losing its last day, preserve it as orphan
      const isAlreadyOrphan = orphanPatterns.some(o => o.patternKey === pattern.patternKey);
      if (!isAlreadyOrphan) {
        setOrphanPatterns(prev => [...prev, {
          patternKey: pattern.patternKey,
          ranges: pattern.ranges,
          days: []
        }]);
      }
    }

    onChange(updatedSchedules);
  };

  const handleConfirmDialogConfirm = () => {
    const { pattern, dayOfWeek } = confirmDialog;
    applyPatternToDay(pattern, dayOfWeek, true, true); // true for removeOverlapping
    setConfirmDialog({ isOpen: false, dayOfWeek: null, pattern: null, currentRanges: '', newRanges: '', overlappingRanges: [] });
  };

  const handleConfirmDialogCancel = () => {
    setConfirmDialog({ isOpen: false, dayOfWeek: null, pattern: null, currentRanges: '', newRanges: '', overlappingRanges: [] });
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

          // Update the pattern key based on new range values
          const normalizedRange = {
            s: (field === 'startTime' ? value : updatedRanges[rangeIndex].startTime).trim(),
            e: (field === 'endTime' ? value : updatedRanges[rangeIndex].endTime).trim()
          };
          const newPatternKey = JSON.stringify([normalizedRange]);

          return { ...orphan, ranges: updatedRanges, patternKey: newPatternKey };
        }
        return orphan;
      }));
      return;
    }

    const updatedSchedules = schedules.map(schedule => {
      // Update all days that use this pattern
      if (pattern.days.includes(schedule.dayOfWeek) && schedule.isOpen) {
        // Find the specific range in this day's schedule that matches the pattern range
        const patternRange = pattern.ranges[rangeIndex];
        const dayRangeIndex = schedule.scheduleRanges.findIndex(r =>
          r.startTime.trim() === patternRange.startTime.trim() &&
          r.endTime.trim() === patternRange.endTime.trim()
        );

        if (dayRangeIndex !== -1) {
          const updatedRanges = [...schedule.scheduleRanges];
          updatedRanges[dayRangeIndex] = {
            ...updatedRanges[dayRangeIndex],
            [field]: value
          };
          return { ...schedule, scheduleRanges: updatedRanges };
        }
      }
      return schedule;
    });
    onChange(updatedSchedules);
  };


  const handleAddNewPattern = () => {
    // Create a new orphan pattern (not assigned to any day)
    const newRange = {
      id: Date.now(),
      nameKey: '',
      startTime: '09:00',
      endTime: '17:00'
    };

    const normalizedRange = { s: newRange.startTime.trim(), e: newRange.endTime.trim() };
    const newPatternKey = JSON.stringify([normalizedRange]);

    // Check if this pattern already exists
    const patternExists = orphanPatterns.some(o => o.patternKey === newPatternKey);

    if (!patternExists) {
      setOrphanPatterns(prev => [...prev, {
        patternKey: newPatternKey,
        ranges: [newRange],
        days: []
      }]);
    }
  };

  const handleDeleteOrphanPattern = (patternKey) => {
    setOrphanPatterns(prev => prev.filter(orphan => orphan.patternKey !== patternKey));
  };

  // Format time on blur - add :00 if only hours are provided
  const handleTimeBlur = (pattern, rangeIndex, field, value) => {
    if (!value) return;

    let formattedValue = value.trim();

    // If only digits (like "9" or "16"), format to "09:00" or "16:00"
    if (/^\d{1,2}$/.test(formattedValue)) {
      const hours = parseInt(formattedValue, 10);
      if (hours >= 0 && hours <= 23) {
        formattedValue = `${hours.toString().padStart(2, '0')}:00`;
      }
    }
    // If format is "9:30" or "16:45", ensure hours have 2 digits
    else if (/^\d{1,2}:\d{2}$/.test(formattedValue)) {
      const [hours, minutes] = formattedValue.split(':');
      const h = parseInt(hours, 10);
      if (h >= 0 && h <= 23) {
        formattedValue = `${h.toString().padStart(2, '0')}:${minutes}`;
      }
    }

    // Only update if the format changed
    if (formattedValue !== value) {
      handlePatternRangeChange(pattern, rangeIndex, field, formattedValue);
    }
  };

  // Editable form - pattern-based layout
  const patterns = groupSchedulesByPattern();

  return (
    <div className={styles.section}>
      <div className={styles.scheduleCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <Clock size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Patrones de horario</h3>
          </div>
          <Button
            variant="secondary"
            icon={Plus}
            onClick={handleAddNewPattern}
            className={styles.addPatternButtonHeader}
          >
            Añadir patrón
          </Button>
        </div>
        <div className={styles.cardContent}>
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

              {/* Time range for this pattern */}
              <div className={styles.patternRanges}>
                <label className={styles.patternLabel}>Horario:</label>
                <div className={styles.rangeRow}>
                  <MenuTextField
                    label="Inicio"
                    value={pattern.ranges[0]?.startTime || ''}
                    onChange={(value) => handlePatternRangeChange(pattern, 0, 'startTime', value)}
                    onBlur={(value) => handleTimeBlur(pattern, 0, 'startTime', value)}
                    error={rangeErrors[0]?.startTime}
                    placeholder="09:00"
                    required
                  />
                  <MenuTextField
                    label="Fin"
                    value={pattern.ranges[0]?.endTime || ''}
                    onChange={(value) => handlePatternRangeChange(pattern, 0, 'endTime', value)}
                    onBlur={(value) => handleTimeBlur(pattern, 0, 'endTime', value)}
                    error={rangeErrors[0]?.endTime}
                    placeholder="17:00"
                    required
                  />
                </div>
              </div>

              {/* Day selectors */}
              <div className={styles.patternDays}>
                <label className={styles.patternLabel}>Días:</label>
                <div className={styles.daysGrid}>
                  {dayOrder.map(day => {
                    const isSelected = pattern.days.includes(day);
                    return (
                      <BadgeToggle
                        key={day}
                        label={dayNames[day]}
                        checked={isSelected}
                        onChange={(checked) => handlePatternDayToggle(pattern, day, checked)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
          </div>
        </div>
      </div>

      {/* Confirmation dialog for pattern reassignment */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Solapamiento de horarios"
        message={`${confirmDialog.dayOfWeek ? dayNames[confirmDialog.dayOfWeek] : ''} ya tiene rangos horarios que se solapan:\n${confirmDialog.currentRanges}\n\nSi continúas, estos rangos se eliminarán y se añadirá:\n${confirmDialog.newRanges}\n\n¿Deseas continuar?`}
        confirmText="Sí, reemplazar"
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
