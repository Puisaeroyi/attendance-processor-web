import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { AttendanceRecord } from '@/types/attendance';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();

    // Parse Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json({ error: 'No worksheet found in file' }, { status: 400 });
    }

    const data: AttendanceRecord[] = [];
    const headers: string[] = [];

    // Get headers from first row
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value || '').toLowerCase().trim();
    });

    // Map column names to indices
    const colMap: Record<string, number> = {};
    headers.forEach((header, index) => {
      if (header.includes('date')) colMap['date'] = index;
      else if (header === 'id' || header.includes('employee id')) colMap['id'] = index;
      else if (header === 'name' || header.includes('employee name')) colMap['name'] = index;
      else if (header === 'shift') colMap['shift'] = index;
      else if (header === 'check in' || header === 'checkin' || header === 'ci') colMap['checkIn'] = index;
      else if (header === 'break out' || header === 'breakout' || header === 'bto') colMap['breakOut'] = index;
      else if (header === 'break in' || header === 'breakin' || header === 'bti') colMap['breakIn'] = index;
      else if (header === 'check out' || header === 'checkout' || header === 'co') colMap['checkOut'] = index;
      else if (header === 'status') colMap['status'] = index;
    });

    // Parse data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const getValue = (col: string): string => {
        const colIndex = colMap[col];
        if (!colIndex) return '';
        const cell = row.getCell(colIndex);
        if (!cell.value) return '';
        
        // Handle date values
        if (col === 'date' && cell.value instanceof Date) {
          return cell.value.toISOString();
        }
        
        // Handle time values
        if (['checkIn', 'breakOut', 'breakIn', 'checkOut'].includes(col)) {
          if (cell.value instanceof Date) {
            const timeParts = cell.value.toTimeString().split(' ');
            return timeParts[0] || '';
          }
          const val = String(cell.value);
          // If it's a decimal (Excel time format), convert to HH:MM:SS
          if (!isNaN(Number(val)) && Number(val) < 1) {
            const totalSeconds = Math.round(Number(val) * 24 * 60 * 60);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
          }
          return val;
        }
        
        return String(cell.value);
      };

      const dateValue = getValue('date');
      if (!dateValue) return; // Skip rows without date

      const record: AttendanceRecord = {
        date: new Date(dateValue),
        id: getValue('id') || '',
        name: getValue('name') || '',
        shift: getValue('shift') || '',
        checkIn: getValue('checkIn') || '',
        breakOut: getValue('breakOut') || '',
        breakIn: getValue('breakIn') || '',
        checkOut: getValue('checkOut') || '',
        status: getValue('status') || 'Unknown',
      };

      data.push(record);
    });

    if (data.length === 0) {
      return NextResponse.json({ error: 'No valid data found in file' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      recordCount: data.length 
    });

  } catch (error) {
    console.error('Dashboard upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file. Please ensure it is a valid Excel file.' },
      { status: 500 }
    );
  }
}
