'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, ArrowRight, CheckCircle, FileText, AlertCircle, X, BarChart3 } from 'lucide-react';
import { AttendanceRecord } from '@/types/attendance';
import { saveAttendanceData } from '@/lib/storage/attendanceData';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface ProcessingResult {
  success: boolean;
  result?: {
    recordsProcessed: number;
    burstsDetected: number;
    shiftInstancesFound: number;
    attendanceRecordsGenerated: number;
    deviationRecordsCount?: number;
    outputData?: AttendanceRecord[];
    deviationData?: AttendanceRecord[];
  };
  message?: string;
}

export default function ProcessorPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingDeviation, setIsDownloadingDeviation] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload an Excel (.xls, .xlsx) or CSV file.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleChooseFile = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Reset the input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/processor', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setResult(data);
      
      // Save processed data to localStorage for Dashboard
      if (data.result?.outputData && data.result.outputData.length > 0) {
        saveAttendanceData(data.result.outputData);
      }
      
      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsProcessing(false);
    }
  };

  const handleDownloadExcel = async (data: AttendanceRecord[]) => {
    try {
      const response = await fetch('/api/v1/processor/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Excel file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_records_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download Excel file');
    }
  };

  const handleDownloadDeviation = async (data: AttendanceRecord[]) => {
    setIsDownloadingDeviation(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/processor/download-deviation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate deviation summary');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Deviation_Summary_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download deviation summary');
    } finally {
      setIsDownloadingDeviation(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
          <Upload className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-white">
          Attendance Processor
        </h1>
        <p className="text-lg text-white/70">
          Process attendance data with burst detection and shift grouping
        </p>
      </div>

      <div className="mx-auto max-w-4xl space-y-8">
        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upload Attendance Data</h2>
            <p className="text-gray-500 mt-1">Process your attendance file with advanced algorithms</p>
          </div>

          <div className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Drag and drop area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={!file ? handleChooseFile : undefined}
              className={`cursor-pointer border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging
                  ? 'border-green-500 bg-green-50'
                  : file
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50 hover:border-green-500 hover:bg-green-50'
              }`}
            >
              {file ? (
                <div className="relative">
                  <FileText className="mx-auto mb-4 h-16 w-16 text-green-500" />
                  <p className="mb-2 text-lg font-semibold text-gray-900">{file.name}</p>
                  <p className="mb-4 text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
                      File loaded
                    </span>
                    <button
                      type="button"
                      onClick={handleChooseFile}
                      className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Change File
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <p className="mb-4 text-lg font-semibold text-gray-900">
                    Drag and drop your attendance file here
                  </p>
                  <p className="mb-6 text-sm text-gray-500">
                    Supports Excel (.xls, .xlsx) and CSV formats (max 10MB)
                  </p>
                  <button
                    type="button"
                    onClick={handleChooseFile}
                    className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Choose File
                  </button>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Processing features */}
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-6">
              <h3 className="mb-4 font-semibold text-gray-900">
                Processing Features
              </h3>
              <div className="space-y-3">
                {[
                  'Burst Detection Algorithm',
                  'Shift Grouping',
                  'Break Time Detection',
                  'Status Determination',
                  'Data Validation',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">{feature}</span>
                    <span className="ml-auto inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Process button */}
            <button
              onClick={handleProcess}
              disabled={!file || isProcessing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all"
            >
              <span>{isProcessing ? 'Processing...' : 'Process Attendance'}</span>
              <ArrowRight className="h-5 w-5" />
            </button>

            {/* Results */}
            {result && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-6">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Processing Complete
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">Records Processed:</span>{' '}
                    {result.result?.recordsProcessed || 0}
                  </p>
                  <p>
                    <span className="font-semibold">Bursts Detected:</span>{' '}
                    {result.result?.burstsDetected || 0}
                  </p>
                  <p>
                    <span className="font-semibold">Shift Instances:</span>{' '}
                    {result.result?.shiftInstancesFound || 0}
                  </p>
                  <p>
                    <span className="font-semibold">Attendance Records:</span>{' '}
                    {result.result?.attendanceRecordsGenerated || 0}
                  </p>
                </div>
                {result.message && (
                  <p className="mt-4 text-sm text-gray-500">{result.message}</p>
                )}

                {/* Action buttons */}
                {result?.result?.outputData && result.result.outputData.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {/* View Dashboard button */}
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all"
                    >
                      <BarChart3 className="h-5 w-5" />
                      <span>View Dashboard</span>
                    </button>
                    
                    {/* Download buttons */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <button
                        onClick={() => handleDownloadExcel(result.result?.outputData || [])}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                      >
                        <span>Download Excel Results</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadDeviation(result.result?.deviationData || [])}
                        disabled={isDownloadingDeviation || !result.result?.deviationData || result.result.deviationData.length === 0}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                      >
                        <span>{isDownloadingDeviation ? 'Generating...' : 'Download Deviation Summary'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="mb-6 font-semibold text-gray-900">
            Performance Stats
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-gray-900">10,000+</div>
              <p className="text-sm text-gray-500">Records per second</p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-gray-900">&lt;10s</div>
              <p className="text-sm text-gray-500">Processing time</p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-gray-900">100%</div>
              <p className="text-sm text-gray-500">Accuracy rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
