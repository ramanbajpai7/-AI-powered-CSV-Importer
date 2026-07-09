'use client';

import React from 'react';

interface ProgressProps {
  currentBatch: number;
  totalBatches: number;
  processedRecords: number;
  totalRecords: number;
  message: string;
}

export default function Progress({
  currentBatch,
  totalBatches,
  processedRecords,
  totalRecords,
  message,
}: ProgressProps) {
  const percentage = totalBatches > 0 ? Math.round((currentBatch / totalBatches) * 100) : 0;

  return (
    <div className="progress-section fade-up" id="processing-progress">
      <div className="progress-spinner" />
      <h3 className="progress-title">AI Processing Your Data</h3>
      <p className="progress-message">{message}</p>
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="progress-stats">
        Batch {currentBatch} of {totalBatches} • {processedRecords} / {totalRecords} records • {percentage}%
      </p>
    </div>
  );
}
