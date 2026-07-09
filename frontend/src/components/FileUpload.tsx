'use client';

import React, { useCallback, useRef, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export default function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        alert('Please upload a valid CSV file.');
        return;
      }
      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="fade-up">
      <div
        className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        id="csv-upload-zone"
      >
        <span className="upload-icon">CSV</span>
        <p className="upload-text">
          {isLoading ? 'Uploading...' : 'Drop your CSV file here'}
        </p>
        <p className="upload-subtext">
          or <span>click to browse</span> - Supports any CSV format up to 10MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleInputChange}
          className="file-input"
          id="csv-file-input"
          disabled={isLoading}
        />

        {selectedFile && (
          <div className="file-info">
            <span className="file-info-icon">~</span>
            <div>
              <div className="file-info-name">{selectedFile.name}</div>
              <div className="file-info-size">{formatSize(selectedFile.size)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
