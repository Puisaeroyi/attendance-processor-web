/**
 * Download API Route
 * POST /api/v1/processor/download
 * Generates and downloads Excel file from processed attendance data
 */

import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate and download Excel file from attendance records
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of attendance records.' },
        { status: 400 }
      );
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No data to export' },
        { status: 400 }
      );
    }

    // Create new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Records');

    // Define headers
    const headers = [
      'Date',
      'ID',
      'Name',
      'Shift',
      'Check-in',
      'Break Time Out',
      'Break Time In',
      'Check Out Record',
      'Status',
    ];

    // Add header row
    worksheet.addRow(headers);

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });

    // Add data rows
    data.forEach((record) => {
      const rowData = [
        record.date ? new Date(record.date).toLocaleDateString('en-CA') : '', // YYYY-MM-DD format
        record.id || '',
        record.name || '',
        record.shift || '',
        record.checkIn || '',
        record.breakOut || '',
        record.breakIn || '',
        record.checkOut || '',
        record.status || '',
      ];

      const row = worksheet.addRow(rowData);

      // Style data row
      row.eachCell((cell, colNum) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        };

        // Highlight Status column (column 9) if any deviation exists
        if (colNum === 9) { // Status column
          const cellValue = cell.value?.toString();
          if (cellValue && cellValue !== 'On Time' && cellValue !== '') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC7CE' },  // Light red background
            };
            cell.font = {
              color: { argb: 'FF9C0006' },    // Dark red text
              bold: true,
            };
          }
        }
      });
    });

    // Set column widths
    worksheet.columns = [
      { width: 12 }, // Date
      { width: 10 }, // ID
      { width: 20 }, // Name
      { width: 12 }, // Shift
      { width: 14 }, // Check-in
      { width: 14 }, // Break Time Out
      { width: 14 }, // Break Time In
      { width: 16 }, // Check Out Record
      { width: 45 }, // Status (wider for comma-separated text)
    ];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return Excel file as response
    const fileName = `attendance_records_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate Excel file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}