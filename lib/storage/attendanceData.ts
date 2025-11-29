'use client';

import { AttendanceRecord } from '@/types/attendance';

const STORAGE_KEY = 'attendance_processed_data';

export function saveAttendanceData(data: AttendanceRecord[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save attendance data:', error);
  }
}

export function loadAttendanceData(): AttendanceRecord[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored) as AttendanceRecord[];
    // Convert date strings back to Date objects
    return data.map(record => ({
      ...record,
      date: new Date(record.date),
    }));
  } catch (error) {
    console.error('Failed to load attendance data:', error);
    return null;
  }
}

export function clearAttendanceData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear attendance data:', error);
  }
}

export function hasAttendanceData(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}
