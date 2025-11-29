'use client';

import { useState, useMemo, useCallback } from 'react';
import { AttendanceRecord } from '@/types/attendance';
import { Calendar, ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';

interface AttendanceDetailsProps {
  data: AttendanceRecord[];
}

// Sort field type
type SortField = 'date' | 'id' | 'name';
type SortDirection = 'asc' | 'desc';

// Shift timing rules from rule.yaml
const SHIFT_RULES = {
  A: {
    checkInLateThreshold: '06:05:00',
    breakOutExpected: '10:00:00',
    breakInLateThreshold: '10:35:00',
    checkOutExpected: '14:00:00',
  },
  B: {
    checkInLateThreshold: '14:05:00',
    breakOutExpected: '18:00:00',
    breakInLateThreshold: '18:35:00',
    checkOutExpected: '22:00:00',
  },
  C: {
    checkInLateThreshold: '22:05:00',
    breakOutExpected: '02:00:00',
    breakInLateThreshold: '02:50:00',
    checkOutExpected: '06:00:00',
  },
  D: {
    checkInLateThreshold: '03:05:00',
    breakOutExpected: '07:00:00',
    breakInLateThreshold: '08:05:00',
    checkOutExpected: '12:00:00',
  },
};

// Parse time string to total seconds for comparison
const parseTimeToSeconds = (time: string): number | null => {
  if (!time || time === '---') return null;
  
  const timeMatch = time.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!timeMatch || !timeMatch[1] || !timeMatch[2]) return null;
  
  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
  
  return hours * 3600 + minutes * 60 + seconds;
};

// Check if check-in time violates the rule (is late)
const isCheckInLate = (checkIn: string, shift: string): boolean => {
  const normalizedShift = shift?.toUpperCase();
  const rules = SHIFT_RULES[normalizedShift as keyof typeof SHIFT_RULES];
  if (!rules) return false;
  
  const checkInSeconds = parseTimeToSeconds(checkIn);
  const thresholdSeconds = parseTimeToSeconds(rules.checkInLateThreshold);
  
  if (checkInSeconds === null || thresholdSeconds === null) return false;
  return checkInSeconds >= thresholdSeconds;
};

// Check if break-in time violates the rule (is late)
const isBreakInLate = (breakIn: string, shift: string): boolean => {
  const normalizedShift = shift?.toUpperCase();
  const rules = SHIFT_RULES[normalizedShift as keyof typeof SHIFT_RULES];
  if (!rules) return false;
  
  const breakInSeconds = parseTimeToSeconds(breakIn);
  const thresholdSeconds = parseTimeToSeconds(rules.breakInLateThreshold);
  
  if (breakInSeconds === null || thresholdSeconds === null) return false;
  return breakInSeconds >= thresholdSeconds;
};

// Check if break-out time is early
const isBreakOutEarly = (breakOut: string, shift: string): boolean => {
  const normalizedShift = shift?.toUpperCase();
  const rules = SHIFT_RULES[normalizedShift as keyof typeof SHIFT_RULES];
  if (!rules) return false;
  
  const breakOutSeconds = parseTimeToSeconds(breakOut);
  const expectedSeconds = parseTimeToSeconds(rules.breakOutExpected);
  
  if (breakOutSeconds === null || expectedSeconds === null) return false;
  return breakOutSeconds < expectedSeconds;
};

// Check if check-out time is early
const isCheckOutEarly = (checkOut: string, shift: string): boolean => {
  const normalizedShift = shift?.toUpperCase();
  const rules = SHIFT_RULES[normalizedShift as keyof typeof SHIFT_RULES];
  if (!rules) return false;
  
  const checkOutSeconds = parseTimeToSeconds(checkOut);
  const expectedSeconds = parseTimeToSeconds(rules.checkOutExpected);
  
  if (checkOutSeconds === null || expectedSeconds === null) return false;
  return checkOutSeconds < expectedSeconds;
};

// Check if record has any violation
const hasViolation = (record: AttendanceRecord): boolean => {
  return isCheckInLate(record.checkIn, record.shift) ||
         isBreakInLate(record.breakIn, record.shift) ||
         isBreakOutEarly(record.breakOut, record.shift) ||
         isCheckOutEarly(record.checkOut, record.shift);
};

// Optimized comparator functions for sorting
const comparators = {
  date: (a: AttendanceRecord, b: AttendanceRecord) => 
    new Date(a.date).getTime() - new Date(b.date).getTime(),
  id: (a: AttendanceRecord, b: AttendanceRecord) => 
    (a.id || '').localeCompare(b.id || '', undefined, { numeric: true }),
  name: (a: AttendanceRecord, b: AttendanceRecord) => 
    (a.name || '').localeCompare(b.name || ''),
};

export default function AttendanceDetails({ data }: AttendanceDetailsProps) {
  // State for sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // State for filtering
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [showViolationsOnly, setShowViolationsOnly] = useState(false);
  
  // Date range state
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Extract unique values for filter dropdowns (memoized)
  const { employees, shifts } = useMemo(() => {
    const employeeMap = new Map<string, string>(); // id -> name
    const shiftSet = new Set<string>();
    
    data.forEach(record => {
      // Employees (store id -> name mapping)
      if (record.id) {
        employeeMap.set(record.id, record.name || record.id);
      }
      
      // Shifts
      if (record.shift) {
        shiftSet.add(record.shift.toUpperCase());
      }
    });
    
    return {
      employees: Array.from(employeeMap.entries()).sort((a, b) => a[1].localeCompare(b[1])),
      shifts: Array.from(shiftSet).sort(),
    };
  }, [data]);

  // Optimized filter + sort pipeline (memoized)
  const processedData = useMemo(() => {
    // Step 1: Filter by date range
    let result = data;
    
    if (dateRange.start || dateRange.end) {
      result = result.filter(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          startDate.setHours(0, 0, 0, 0);
          if (recordDate < startDate) return false;
        }
        
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(0, 0, 0, 0);
          if (recordDate > endDate) return false;
        }
        
        return true;
      });
    }
    
    // Step 2: Filter by employee
    if (selectedEmployee) {
      result = result.filter(record => record.id === selectedEmployee);
    }
    
    // Step 3: Filter by shift
    if (selectedShift) {
      result = result.filter(record => 
        record.shift?.toUpperCase() === selectedShift
      );
    }
    
    // Step 4: Filter by violations
    if (showViolationsOnly) {
      result = result.filter(hasViolation);
    }
    
    // Step 5: Sort using optimized comparator
    const comparator = comparators[sortField];
    const sorted = [...result].sort((a, b) => {
      const cmp = comparator(a, b);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    
    return sorted;
  }, [data, dateRange, selectedEmployee, selectedShift, showViolationsOnly, sortField, sortDirection]);

  // Toggle sort direction or change field
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedEmployee('');
    setSelectedShift('');
    setShowViolationsOnly(false);
    setDateRange({ start: '', end: '' });
  }, []);

  // Check if any filter is active
  const hasActiveFilters = selectedEmployee || selectedShift || showViolationsOnly || dateRange.start || dateRange.end;

  // Format date for display
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Get shift color
  const getShiftColor = (shift: string) => {
    switch (shift?.toUpperCase()) {
      case 'A': return 'text-blue-600';
      case 'B': return 'text-green-600';
      case 'C': return 'text-purple-600';
      case 'D': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
      : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />;
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Attendance Details</h3>
        </div>
        
        {/* Date Range Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            />
          </div>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear date range"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        {/* Employee Filter */}
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="" className="text-gray-900 bg-white">All Employees</option>
          {employees.map(([id, name]) => (
            <option key={id} value={id} className="text-gray-900 bg-white">{name}</option>
          ))}
        </select>
        
        {/* Shift Filter */}
        <select
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value)}
          className="px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="" className="text-gray-900 bg-white">All Shifts</option>
          {shifts.map(shift => (
            <option key={shift} value={shift} className="text-gray-900 bg-white">Shift {shift}</option>
          ))}
        </select>
        
        {/* Violations Only Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showViolationsOnly}
            onChange={(e) => setShowViolationsOnly(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Violations Only</span>
        </label>
        
        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th 
                onClick={() => handleSort('date')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Date {getSortIcon('date')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('id')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  ID {getSortIcon('id')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('name')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Name {getSortIcon('name')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Shift</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CI</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">BTO</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">BTI</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processedData.map((record, index) => (
              <tr key={`${record.id}-${record.date}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(record.date)}</td>
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{record.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{record.name}</td>
                <td className={`px-4 py-3 text-sm font-medium ${getShiftColor(record.shift)}`}>
                  {record.shift}
                </td>
                <td className={`px-4 py-3 text-sm font-mono ${isCheckInLate(record.checkIn, record.shift) ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                  {record.checkIn || '---'}
                </td>
                <td className={`px-4 py-3 text-sm font-mono ${isBreakOutEarly(record.breakOut, record.shift) ? 'text-yellow-600 font-semibold' : 'text-gray-900'}`}>
                  {record.breakOut || '---'}
                </td>
                <td className={`px-4 py-3 text-sm font-mono ${isBreakInLate(record.breakIn, record.shift) ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                  {record.breakIn || '---'}
                </td>
                <td className={`px-4 py-3 text-sm font-mono ${isCheckOutEarly(record.checkOut, record.shift) ? 'text-yellow-600 font-semibold' : 'text-gray-900'}`}>
                  {record.checkOut || '---'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {processedData.length} records
          {dateRange.start && dateRange.end && ` from ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}`}
          {dateRange.start && !dateRange.end && ` from ${formatDate(dateRange.start)}`}
          {!dateRange.start && dateRange.end && ` until ${formatDate(dateRange.end)}`}
          {hasActiveFilters && ' (filtered)'}
        </p>
        <p className="text-xs text-gray-400">
          Sorted by {sortField} ({sortDirection === 'asc' ? 'ascending' : 'descending'})
        </p>
      </div>
    </div>
  );
}
