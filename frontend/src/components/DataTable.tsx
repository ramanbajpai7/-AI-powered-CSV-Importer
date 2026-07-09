'use client';

import React from 'react';

interface DataTableProps {
  headers: string[];
  rows: Record<string, string>[];
  title: string;
  badge?: string;
  maxHeight?: string;
  id: string;
}

export default function DataTable({
  headers,
  rows,
  title,
  badge,
  maxHeight = '500px',
  id,
}: DataTableProps) {
  return (
    <div className="table-container fade-up" id={id}>
      <div className="table-header-bar">
        <span className="table-title">
          {title}
        </span>
        {badge && <span className="table-badge">{badge}</span>}
      </div>
      <div className="table-scroll" style={{ maxHeight }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                {headers.map((h) => (
                  <td key={h} title={row[h] || ''}>
                    {row[h] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
