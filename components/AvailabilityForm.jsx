'use client';

import { useState } from 'react';
import { FaPlus, FaTrash, FaInfoCircle } from 'react-icons/fa';

const DAYS = [
  { value: 1, label: 'Luni' },
  { value: 2, label: 'Marți' },
  { value: 3, label: 'Miercuri' },
  { value: 4, label: 'Joi' },
  { value: 5, label: 'Vineri' },
  { value: 6, label: 'Sâmbătă' },
  { value: 7, label: 'Duminică' }
];

const DAYS_REVERSE_MAP = {
  1: 'luni',
  2: 'marți',
  3: 'miercuri',
  4: 'joi',
  5: 'vineri',
  6: 'sâmbătă',
  7: 'duminică'
};

const AvailabilityForm = ({ initialValue = '', onChange }) => {
  const [schedules, setSchedules] = useState(() => {
    if (initialValue) {
      try {
        return parseExistingAvailability(initialValue);
      } catch {
        return [{ days: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' }];
      }
    }
    return [{ days: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' }];
  });

  const [showHelp, setShowHelp] = useState(false);

  function parseExistingAvailability(availString) {
    // momentan dummy, poți implementa parser real
    return [{ days: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' }];
  }

  const updateFormValue = (newSchedules) => {
    const availabilityString = formatSchedulesToString(newSchedules);
    if (onChange) {
      onChange(availabilityString);
    }
  };

  const formatSchedulesToString = (schedules) => {
    return schedules.map(schedule => {
      const uniqueDays = [...new Set(schedule.days)].sort((a, b) => a - b);
      const ranges = [];
      let i = 0;

      while (i < uniqueDays.length) {
        let start = i;
        let end = i;

        while (
          end + 1 < uniqueDays.length &&
          uniqueDays[end + 1] === uniqueDays[end] + 1
        ) {
          end++;
        }

        const startDay = uniqueDays[start];
        const endDay = uniqueDays[end];

        if (end > start) {
          // interval de mai multe zile
          if (uniqueDays.length === 7 && startDay === 1 && endDay === 7) {
            ranges.push('luni-duminică');
          } else if (startDay === 1 && endDay === 5) {
            ranges.push('luni-vineri');
          } else if (startDay === 6 && endDay === 7 && uniqueDays.length === 2) {
            ranges.push('sâmbătă-duminică');
          } else {
            ranges.push(`${DAYS_REVERSE_MAP[startDay]}-${DAYS_REVERSE_MAP[endDay]}`);
          }
        } else {
          // zi singulară
          ranges.push(DAYS_REVERSE_MAP[startDay]);
        }

        i = end + 1;
      }

      return `${ranges.join(', ')} ${schedule.startTime}-${schedule.endTime}`;
    }).join(', ');
  };

  const addSchedule = () => {
    const newSchedules = [...schedules, { days: [1], startTime: '09:00', endTime: '17:00' }];
    setSchedules(newSchedules);
    updateFormValue(newSchedules);
  };

  const removeSchedule = (index) => {
    const newSchedules = schedules.filter((_, i) => i !== index);
    setSchedules(newSchedules);
    updateFormValue(newSchedules);
  };

  const updateSchedule = (index, field, value) => {
    const newSchedules = schedules.map((schedule, i) => {
      if (i === index) {
        return { ...schedule, [field]: value };
      }
      return schedule;
    });
    setSchedules(newSchedules);
    updateFormValue(newSchedules);
  };

  const toggleDay = (scheduleIndex, dayValue) => {
    const schedule = schedules[scheduleIndex];
    const newDays = schedule.days.includes(dayValue)
      ? schedule.days.filter(d => d !== dayValue)
      : [...schedule.days, dayValue].sort((a, b) => a - b);

    updateSchedule(scheduleIndex, 'days', newDays);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-gray-700 font-bold">
          Program de disponibilitate
        </label>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-blue-500 hover:text-blue-700"
        >
          <FaInfoCircle />
        </button>
      </div>

      {showHelp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-blue-800 mb-2">Cum funcționează:</h4>
          <ul className="text-blue-700 space-y-1">
            <li>• Selectați zilele când sala este disponibilă</li>
            <li>• Setați intervalul orar pentru fiecare program</li>
            <li>• Puteți adăuga multiple programe (ex: diferite ore pentru weekend)</li>
            <li>• Rezervările vor fi permise doar în aceste intervale</li>
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {schedules.map((schedule, index) => (
          <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-700">
                Program {index + 1}
              </h4>
              {schedules.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSchedule(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <FaTrash />
                </button>
              )}
            </div>

            {/* Selecția zilelor */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Zilele săptămânii:
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(index, day.value)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      schedule.days.includes(day.value)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Intervalul orar */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Ora de început:
                </label>
                <input
                  type="time"
                  value={schedule.startTime}
                  onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Ora de sfârșit:
                </label>
                <input
                  type="time"
                  value={schedule.endTime}
                  onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Validări */}
            {schedule.days.length === 0 && (
              <p className="text-red-500 text-sm mt-2">
                Selectați cel puțin o zi
              </p>
            )}
            {schedule.startTime >= schedule.endTime && (
              <p className="text-red-500 text-sm mt-2">
                Ora de sfârșit trebuie să fie după ora de început
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSchedule}
        className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
      >
        <FaPlus />
        Adaugă program
      </button>

      {/* Preview */}
      <div className="bg-gray-100 rounded-lg p-3">
        <p className="text-sm font-medium text-gray-600 mb-1">Previzualizare:</p>
        <p className="text-sm text-gray-800">
          {formatSchedulesToString(schedules) || 'Program necompletat'}
        </p>
      </div>
    </div>
  );
};

export default AvailabilityForm;
