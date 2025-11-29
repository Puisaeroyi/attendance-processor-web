'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { FileText, ArrowRight, AlertCircle, X } from 'lucide-react';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Fixed configuration values
const DELIMITER = ',';
const ENCODING = 'UTF-8';

export default function ConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel'];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      setError('Invalid file type. Please upload a CSV file.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('delimiter', DELIMITER);
      formData.append('encoding', ENCODING);

      const response = await fetch('/api/v1/converter/process', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        throw new Error(data.error || 'Conversion failed');
      }

      if (!response.ok) {
        throw new Error('Conversion failed');
      }

      const blob = await response.blob();

      const disposition = response.headers.get('Content-Disposition');
      let filename = file.name.replace('.csv', '_converted.xlsx');

      if (disposition && disposition.includes('filename=')) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert file');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
          <FileText className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-white">
          CSV to XLSX Converter
        </h1>
        <p className="text-lg text-white/70">
          Convert CSV files to Excel format with column extraction (ID, Name, Date, Time, Type, Status)
        </p>
      </div>

      <div className="mx-auto max-w-4xl space-y-8">
        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upload Your CSV File</h2>
            <p className="text-gray-500 mt-1">
              Upload CSV to convert to XLSX. Extracts columns [0,1,2,3,4,6] as ID, Name, Date, Time, Type, Status
            </p>
          </div>

          <div className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
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
                  ? 'border-blue-500 bg-blue-50'
                  : file
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              {file ? (
                <div className="relative">
                  <FileText className="mx-auto mb-4 h-16 w-16 text-blue-500" />
                  <p className="mb-2 text-lg font-semibold text-gray-900">{file.name}</p>
                  <p className="mb-4 text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700">
                      File loaded
                    </span>
                    <button
                      type="button"
                      onClick={handleChooseFile}
                      className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
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
                  <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <p className="mb-4 text-lg font-semibold text-gray-900">
                    Drag and drop your CSV file here
                  </p>
                  <p className="mb-6 text-sm text-gray-500">or click to browse files (max 10MB)</p>
                  <button
                    type="button"
                    onClick={handleChooseFile}
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
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

            {/* Configuration - Read-only */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delimiter</label>
                <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-mono">
                  {DELIMITER}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Encoding</label>
                <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-mono">
                  {ENCODING}
                </div>
              </div>
            </div>

            {/* Convert button */}
            <button
              onClick={handleConvert}
              disabled={!file || isConverting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all"
            >
              <span>{isConverting ? 'Converting...' : 'Convert File'}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="mb-2 text-3xl font-bold text-blue-600">Fast</div>
            <p className="text-sm text-gray-500">Process files in seconds</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="mb-2 text-3xl font-bold text-green-600">Accurate</div>
            <p className="text-sm text-gray-500">100% data integrity</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="mb-2 text-3xl font-bold text-purple-600">Secure</div>
            <p className="text-sm text-gray-500">Your data stays private</p>
          </div>
        </div>
      </div>
    </div>
  );
}
