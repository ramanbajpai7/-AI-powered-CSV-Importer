'use client';

import React from 'react';
import { CRMRecord } from '@/types';

interface CRMTableProps {
  records: CRMRecord[];
  id: string;
}

const CRM_HEADERS: { key: keyof CRMRecord; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'country_code', label: 'Code' },
  { key: 'mobile_without_country_code', label: 'Mobile' },
  { key: 'company', label: 'Company' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'crm_status', label: 'Status' },
  { key: 'lead_owner', label: 'Lead Owner' },
  { key: 'data_source', label: 'Source' },
  { key: 'crm_note', label: 'Notes' },
  { key: 'created_at', label: 'Created At' },
  { key: 'possession_time', label: 'Possession' },
  { key: 'description', label: 'Description' },
];

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'GOOD_LEAD_FOLLOW_UP': return 'status-badge good';
    case 'DID_NOT_CONNECT': return 'status-badge disconnected';
    case 'BAD_LEAD': return 'status-badge bad';
    case 'SALE_DONE': return 'status-badge sale';
    default: return 'status-badge';
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

function formatDate(date: string): string {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
}

export default function CRMTable({ records, id }: CRMTableProps) {
  return (
    <div className="table-container fade-up" id={id}>
      <div className="table-header-bar">
        <span className="table-title">Extracted CRM Records</span>
        <span className="table-badge">{records.length} Records</span>
      </div>
      <div className="table-scroll" style={{ maxHeight: '500px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              {CRM_HEADERS.map((h) => (
                <th key={h.key}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                {CRM_HEADERS.map((h) => (
                  <td key={h.key} title={String(record[h.key] || '')}>
                    {h.key === 'crm_status' && record[h.key] ? (
                      <span className={getStatusBadgeClass(record[h.key])}>
                        {formatStatus(record[h.key])}
                      </span>
                    ) : h.key === 'created_at' ? (
                      formatDate(record[h.key])
                    ) : (
                      record[h.key] || '-'
                    )}
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
