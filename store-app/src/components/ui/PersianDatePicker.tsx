'use client';

import { useState, useEffect } from 'react';
import moment from 'moment-jalaali';

// Configure moment-jalaali
moment.loadPersian({ usePersianDigits: true });

// Persian month names
const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Persian day names
const PERSIAN_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

interface PersianDate {
  year: number;
  month: number;
  day: number;
}

interface PersianDatePickerProps {
  value?: string; // ISO string
  onChange: (isoDate: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  label?: string;
  showTime?: boolean;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

export default function PersianDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  required = false,
  error,
  label,
  showTime = false, // Default to false since we removed time picker
  disabled = false,
  className = '',
  minDate,
  maxDate
}: PersianDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<PersianDate | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentViewMonth, setCurrentViewMonth] = useState<PersianDate>({
    year: moment().jYear(),
    month: moment().jMonth() + 1,
    day: 1
  });

  // Convert ISO date to Persian calendar date
  const isoToPersianDate = (isoString: string): PersianDate | null => {
    if (!isoString) return null;
    
    try {
      const date = new Date(isoString);
      const jalaaliMoment = moment(date);
      
      return {
        year: jalaaliMoment.jYear(),
        month: jalaaliMoment.jMonth() + 1, // moment uses 0-based months
        day: jalaaliMoment.jDate()
      };
    } catch (error) {
      console.error('Error converting ISO to Persian date:', error);
      return null;
    }
  };

  // Convert Persian calendar date to ISO string
  const persianDateToIso = (persianDate: PersianDate): string => {
    try {
      // Create moment from Jalaali date with default time 00:00
      const jalaaliMoment = moment()
        .jYear(persianDate.year)
        .jMonth(persianDate.month - 1) // moment uses 0-based months
        .jDate(persianDate.day)
        .hour(0)
        .minute(0)
        .second(0)
        .millisecond(0);
      
      return jalaaliMoment.toISOString();
    } catch (error) {
      console.error('Error converting Persian to ISO date:', error);
      return new Date().toISOString();
    }
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number): number => {
    const testMoment = moment().jYear(year).jMonth(month - 1);
    return testMoment.daysInMonth();
  };

  // Get first day of week for month
  const getFirstDayOfMonth = (year: number, month: number): number => {
    const firstDay = moment().jYear(year).jMonth(month - 1).jDate(1);
    return firstDay.day(); // 0 = Saturday in Jalaali
  };

  // Generate calendar days
  const generateCalendarDays = (): Array<{ day: number; isCurrentMonth: boolean; date: PersianDate }> => {
    const daysInMonth = getDaysInMonth(currentViewMonth.year, currentViewMonth.month);
    const firstDayOfWeek = getFirstDayOfMonth(currentViewMonth.year, currentViewMonth.month);
    const days: Array<{ day: number; isCurrentMonth: boolean; date: PersianDate }> = [];

    // Previous month days
    const prevMonth = currentViewMonth.month === 1 
      ? { year: currentViewMonth.year - 1, month: 12 }
      : { year: currentViewMonth.year, month: currentViewMonth.month - 1 };
    
    const daysInPrevMonth = getDaysInMonth(prevMonth.year, prevMonth.month);
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: { ...prevMonth, day: daysInPrevMonth - i }
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: { ...currentViewMonth, day }
      });
    }

    // Next month days
    const nextMonth = currentViewMonth.month === 12
      ? { year: currentViewMonth.year + 1, month: 1 }
      : { year: currentViewMonth.year, month: currentViewMonth.month + 1 };

    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: { ...nextMonth, day }
      });
    }

    return days;
  };

  // Update local state when value prop changes
  useEffect(() => {
    if (value) {
      const persianDate = isoToPersianDate(value);
      setSelectedDate(persianDate);
      
      if (persianDate) {
        setCurrentViewMonth({ 
          year: persianDate.year, 
          month: persianDate.month, 
          day: 1 
        });
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // Handle date change
  const handleDateChange = (date: PersianDate) => {
    setSelectedDate(date);
    const isoString = persianDateToIso(date);
    onChange(isoString);
    setIsOpen(false);
  };

  // Handle time change (removed since we don't have time picker anymore)
  // const handleTimeChange = (time: string) => {
  //   setTimeValue(time);
  //   
  //   if (selectedDate) {
  //     const isoString = persianDateToIso(selectedDate);
  //     onChange(isoString);
  //   }
  // };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentViewMonth(prev => {
      if (direction === 'next') {
        return prev.month === 12 
          ? { year: prev.year + 1, month: 1, day: 1 }
          : { ...prev, month: prev.month + 1 };
      } else {
        return prev.month === 1 
          ? { year: prev.year - 1, month: 12, day: 1 }
          : { ...prev, month: prev.month - 1 };
      }
    });
  };

  // Format display value
  const getDisplayValue = (): string => {
    if (!selectedDate) return '';
    
    const persianMoment = moment()
      .jYear(selectedDate.year)
      .jMonth(selectedDate.month - 1)
      .jDate(selectedDate.day);
    
    return persianMoment.format('jYYYY/jMM/jDD');
  };

  // Check if date is today
  const isToday = (date: PersianDate): boolean => {
    const today = moment();
    return date.year === today.jYear() && 
           date.month === (today.jMonth() + 1) && 
           date.day === today.jDate();
  };

  // Check if date is selected
  const isSelected = (date: PersianDate): boolean => {
    if (!selectedDate) return false;
    return date.year === selectedDate.year && 
           date.month === selectedDate.month && 
           date.day === selectedDate.day;
  };

  // Check if date is weekend (Friday)
  const isWeekend = (date: PersianDate): boolean => {
    const momentDate = moment().jYear(date.year).jMonth(date.month - 1).jDate(date.day);
    return momentDate.day() === 5; // Friday is weekend in Iran
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Date Input Display */}
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-gray-400 
            focus:outline-none focus:border-blue-500 cursor-pointer transition-colors
            ${error ? 'border-red-500' : 'border-gray-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'}
          `}
        >
          <div className="flex items-center justify-between">
            <span className={selectedDate ? 'text-white' : 'text-gray-400'}>
              {getDisplayValue() || placeholder}
            </span>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Calendar Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 z-50 mt-1 bg-gray-800 rounded-lg shadow-2xl border border-gray-600 overflow-hidden">
            <div className="p-4 w-80">
              {/* Calendar Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 -m-4 mb-4 p-4 text-white">
                <button
                  type="button"
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <h3 className="text-lg font-semibold">
                  {PERSIAN_MONTHS[currentViewMonth.month - 1]} {currentViewMonth.year}
                </h3>
                
                <button
                  type="button"
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1 mb-2 bg-gray-700 rounded-lg p-2">
                {PERSIAN_DAYS.map((day, index) => (
                  <div
                    key={day}
                    className={`
                      p-2 text-center text-sm font-medium
                      ${index === 5 ? 'text-red-400' : 'text-gray-300'}
                    `}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 bg-gray-800 p-2 rounded-lg">
                {calendarDays.map((dayInfo, index) => {
                  const { day, isCurrentMonth, date } = dayInfo;
                  const today = isToday(date);
                  const selected = isSelected(date);
                  const weekend = isWeekend(date);
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDateChange(date)}
                      className={`
                        p-2 text-sm rounded-lg transition-all duration-200 font-medium
                        ${!isCurrentMonth ? 'text-gray-500' : 'text-gray-200'}
                        ${selected 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105' 
                          : today 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-md'
                            : 'hover:bg-gray-700 hover:text-white'
                        }
                        ${weekend && isCurrentMonth && !selected && !today ? 'text-red-400' : ''}
                        ${!isCurrentMonth ? 'hover:bg-gray-700/50' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              
              {/* Action Buttons */}
              <div className="mt-4 flex justify-between items-center bg-gray-700 -mx-4 -mb-4 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(null);
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="px-3 py-1 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-600 rounded-md transition-colors"
                >
                  پاک کردن
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
                >
                  تأیید
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}

// Export helper functions for use in other components
export const utils = {
  // Convert ISO string to Persian format for display
  formatPersianDate: (isoString: string, includeTime = true): string => {
    if (!isoString) return '';
    
    try {
      const date = new Date(isoString);
      const jalaaliMoment = moment(date);
      
      let format = 'jYYYY/jMM/jDD';
      if (includeTime) {
        format += ' HH:mm';
      }
      
      return jalaaliMoment.format(format);
    } catch (error) {
      console.error('Error formatting Persian date:', error);
      return '';
    }
  },

  // Get current Persian date as ISO string
  getCurrentPersianDateISO: (): string => {
    return moment().toISOString();
  },

  // Add days to Persian date
  addDaysToPersianDate: (isoString: string, days: number): string => {
    try {
      const date = moment(isoString);
      return date.add(days, 'days').toISOString();
    } catch (error) {
      console.error('Error adding days to Persian date:', error);
      return isoString;
    }
  }
};