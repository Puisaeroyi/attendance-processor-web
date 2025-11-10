'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { FileText, ArrowRight, AlertCircle } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Badge,
} from '@/components/ui';

export default function ConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [delimiter, setDelimiter] = useState(',');
  const [encoding, setEncoding] = useState('UTF-8');
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel'];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      setError('Invalid file type. Please upload a CSV file.');
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
    fileInputRef.current?.click();
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      // Create FormData to send file and configuration
      const formData = new FormData();
      formData.append('file', file);
      formData.append('delimiter', delimiter);
      formData.append('encoding', encoding);

      const response = await fetch('/api/v1/converter/process', {
        method: 'POST',
        body: formData,
      });

      // Check if response is an error (JSON response)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        throw new Error(data.error || 'Conversion failed');
      }

      if (!response.ok) {
        throw new Error('Conversion failed');
      }

      // Get the XLSX file as blob
      const blob = await response.blob();

      // Extract filename from Content-Disposition header or create default
      const disposition = response.headers.get('Content-Disposition');
      let filename = file.name.replace('.csv', '_converted.xlsx');

      if (disposition && disposition.includes('filename=')) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Download the XLSX file
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
    <div className="nb-container py-nb-16">
      <div className="mb-nb-12 text-center">
        <div className="mb-nb-6 inline-block rounded-nb bg-nb-blue p-nb-4 border-nb-4 border-nb-black shadow-nb">
          <FileText className="h-12 w-12 text-nb-white" />
        </div>
        <h1 className="mb-nb-4 font-display text-4xl font-black uppercase tracking-tight text-nb-black">
          CSV to XLSX Converter
        </h1>
        <p className="text-lg text-nb-gray-600">
          Convert CSV files to Excel format with column extraction (ID, Name, Date, Time, Type, Status)
        </p>
      </div>

      <div className="mx-auto max-w-4xl">
        <Card variant="primary">
          <CardHeader>
            <CardTitle>Upload Your CSV File</CardTitle>
            <CardDescription>
              Upload CSV to convert to XLSX. Extracts columns [0,1,2,3,4,6] as ID, Name, Date, Time, Type, Status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-nb-6">
              {/* Hidden file input */}
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
                className={`cursor-pointer border-nb-4 border-dashed p-nb-12 text-center transition-colors ${
                  isDragging
                    ? 'border-nb-blue bg-nb-blue/20'
                    : file
                      ? 'border-nb-blue bg-nb-blue/5'
                      : 'border-nb-gray-300 bg-nb-gray-50 hover:border-nb-blue hover:bg-nb-blue/5'
                }`}
              >
                {file ? (
                  <div>
                    <FileText className="mx-auto mb-nb-4 h-16 w-16 text-nb-blue" />
                    <p className="mb-nb-2 text-lg font-bold text-nb-black">{file.name}</p>
                    <p className="mb-nb-4 text-sm text-nb-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <Badge variant="primary">File loaded</Badge>
                  </div>
                ) : (
                  <div>
                    <FileText className="mx-auto mb-nb-4 h-16 w-16 text-nb-gray-400" />
                    <p className="mb-nb-4 text-lg font-bold text-nb-black">
                      Drag and drop your CSV file here
                    </p>
                    <p className="mb-nb-6 text-sm text-nb-gray-600">or click to browse files</p>
                    <Button variant="primary" type="button" onClick={handleChooseFile}>
                      Choose File
                    </Button>
                  </div>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-nb bg-nb-red/10 border-nb-2 border-nb-red p-nb-4">
                  <div className="flex items-center gap-nb-3">
                    <AlertCircle className="h-5 w-5 text-nb-red" />
                    <p className="text-sm font-medium text-nb-red">{error}</p>
                  </div>
                </div>
              )}

              {/* Configuration inputs */}
              <div className="grid gap-nb-4 md:grid-cols-2">
                <Input
                  label="Delimiter"
                  placeholder=","
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                />
                <Input
                  label="Encoding"
                  placeholder="UTF-8"
                  value={encoding}
                  onChange={(e) => setEncoding(e.target.value)}
                />
              </div>

              {/* Convert button */}
              <Button
                variant="success"
                size="lg"
                className="w-full"
                onClick={handleConvert}
                disabled={!file || isConverting}
              >
                <span className="mr-nb-2">{isConverting ? 'Converting...' : 'Convert File'}</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-nb-8 grid gap-nb-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-nb-6 text-center">
              <div className="mb-nb-2 font-display text-3xl font-black text-nb-blue">Fast</div>
              <p className="text-sm text-nb-gray-600">Process files in seconds</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-nb-6 text-center">
              <div className="mb-nb-2 font-display text-3xl font-black text-nb-green">Accurate</div>
              <p className="text-sm text-nb-gray-600">100% data integrity</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-nb-6 text-center">
              <div className="mb-nb-2 font-display text-3xl font-black text-nb-purple">Secure</div>
              <p className="text-sm text-nb-gray-600">Your data stays private</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
