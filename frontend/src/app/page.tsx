'use client';

import React, { useState, useCallback, useRef } from 'react';
import { AppStep, ProcessingResult, ProgressUpdate, UploadResponse } from '@/types';
import { uploadCSV, processRecordsWithStreaming } from '@/lib/api';
import FileUpload from '@/components/FileUpload';
import DataTable from '@/components/DataTable';
import CRMTable from '@/components/CRMTable';
import Stepper from '@/components/Stepper';
import Progress from '@/components/Progress';

export default function Home() {
  const [step, setStep] = useState<AppStep>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);

  const [progress, setProgress] = useState({
    currentBatch: 0,
    totalBatches: 0,
    processedRecords: 0,
    totalRecords: 0,
    message: 'Initializing AI processing...',
  });

  const [results, setResults] = useState<ProcessingResult | null>(null);
  const [activeTab, setActiveTab] = useState<'imported' | 'skipped'>('imported');

  const abortRef = useRef<AbortController | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const data = await uploadCSV(file);
      setUploadData(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleConfirmImport = useCallback(() => {
    if (!uploadData) return;
    setStep('processing');
    setError(null);

    const controller = processRecordsWithStreaming(
      uploadData.records,
      (update: ProgressUpdate) => {
        setProgress({
          currentBatch: update.currentBatch || 0,
          totalBatches: update.totalBatches || 0,
          processedRecords: update.processedRecords || 0,
          totalRecords: update.totalRecords || 0,
          message: update.message || 'Processing...',
        });
      },
      (result: ProcessingResult) => {
        setResults(result);
        setStep('results');
      },
      (errorMsg: string) => {
        setError(errorMsg);
        setStep('preview');
      }
    );

    abortRef.current = controller;
  }, [uploadData]);

  const handleReset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setStep('upload');
    setUploadData(null);
    setResults(null);
    setError(null);
    setProgress({
      currentBatch: 0,
      totalBatches: 0,
      processedRecords: 0,
      totalRecords: 0,
      message: 'Initializing AI processing...',
    });
  }, []);

  const handleDownloadCSV = useCallback(() => {
    if (!results || results.records.length === 0) return;
    const headers = Object.keys(results.records[0]);
    const csvRows = [
      headers.join(','),
      ...results.records.map((r) =>
        headers
          .map((h) => {
            const val = String(r[h as keyof typeof r] || '');
            return val.includes(',') || val.includes('"') || val.includes('\n')
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'groweasy_crm_import.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  return (
    <main className="app-container">
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">CSV</div>
          <h1 className="app-title">GrowEasy CSV Importer</h1>
        </div>
        <p className="app-subtitle">
          Upload any CSV file and let AI intelligently extract your leads into
          GrowEasy CRM format
        </p>
      </header>

      <Stepper currentStep={step} />

      {error && (
        <div className="error-container" id="error-message">
          <span className="error-icon">!</span>
          <div>
            <p className="error-text">{error}</p>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <FileUpload onFileSelect={handleFileSelect} isLoading={isUploading} />
      )}

      {step === 'preview' && uploadData && (
        <div>
          <DataTable
            headers={uploadData.headers}
            rows={uploadData.records}
            title={`Preview: ${uploadData.fileName}`}
            badge={`${uploadData.totalRows} rows`}
            id="preview-table"
          />
          <div className="btn-group">
            <button className="btn btn-secondary" onClick={handleReset} id="back-btn">
              Back
            </button>
            <button
              className="btn btn-success btn-lg"
              onClick={handleConfirmImport}
              id="confirm-import-btn"
            >
              Confirm and Process with AI
            </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <Progress
          currentBatch={progress.currentBatch}
          totalBatches={progress.totalBatches}
          processedRecords={progress.processedRecords}
          totalRecords={progress.totalRecords}
          message={progress.message}
        />
      )}

      {step === 'results' && results && (
        <div>
          <div className="stats-grid fade-up">
            <div className="stat-card">
              <div className="stat-value">{results.totalProcessed}</div>
              <div className="stat-label">Total Processed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{results.totalImported}</div>
              <div className="stat-label">Successfully Imported</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{results.totalSkipped}</div>
              <div className="stat-label">Skipped</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {results.totalProcessed > 0
                  ? Math.round(
                      (results.totalImported / results.totalProcessed) * 100
                    )
                  : 0}
                %
              </div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>

          <div className="tabs" id="results-tabs">
            <button
              className={`tab-btn ${activeTab === 'imported' ? 'active' : ''}`}
              onClick={() => setActiveTab('imported')}
            >
              Imported ({results.totalImported})
            </button>
            <button
              className={`tab-btn ${activeTab === 'skipped' ? 'active' : ''}`}
              onClick={() => setActiveTab('skipped')}
            >
              Skipped ({results.totalSkipped})
            </button>
          </div>

          {activeTab === 'imported' && results.records.length > 0 && (
            <CRMTable records={results.records} id="crm-results-table" />
          )}

          {activeTab === 'imported' && results.records.length === 0 && (
            <div className="progress-section">
              <p className="progress-title">No records imported</p>
              <p className="progress-message">
                AI could not extract any valid CRM records from the uploaded CSV.
              </p>
            </div>
          )}

          {activeTab === 'skipped' && results.skippedRecords.length > 0 && (
            <DataTable
              headers={['Row', 'Reason', 'Original Data']}
              rows={results.skippedRecords.map((s) => ({
                Row: String(s.rowIndex + 1),
                Reason: s.reason,
                'Original Data': JSON.stringify(s.originalData).slice(0, 100),
              }))}
              title="Skipped Records"
              badge={`${results.totalSkipped} skipped`}
              id="skipped-table"
            />
          )}

          {activeTab === 'skipped' && results.skippedRecords.length === 0 && (
            <div className="progress-section">
              <p className="progress-title">No records skipped!</p>
              <p className="progress-message">
                All records were successfully processed.
              </p>
            </div>
          )}

          <div className="btn-group">
            <button className="btn btn-secondary" onClick={handleReset} id="new-import-btn">
              New Import
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleDownloadCSV}
              disabled={results.records.length === 0}
              id="download-csv-btn"
            >
              Download CRM CSV
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
