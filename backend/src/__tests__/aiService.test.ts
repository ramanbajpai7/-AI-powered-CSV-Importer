import {
  sanitizeString,
  sanitizeDate,
  sanitizeCRMRecord,
  VALID_STATUSES,
  VALID_SOURCES,
} from '../services/aiService';
import { CRMRecord } from '../types';

describe('sanitizeString', () => {
  it('should return empty string for null', () => {
    expect(sanitizeString(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(sanitizeString(undefined)).toBe('');
  });

  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('should convert numbers to strings', () => {
    expect(sanitizeString(42)).toBe('42');
  });

  it('should escape newlines', () => {
    expect(sanitizeString('line1\nline2')).toBe('line1\\nline2');
  });

  it('should handle empty string', () => {
    expect(sanitizeString('')).toBe('');
  });
});

describe('sanitizeDate', () => {
  it('should return current ISO date for empty value', () => {
    const result = sanitizeDate('');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should return current ISO date for null', () => {
    const result = sanitizeDate(null);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should parse valid ISO date', () => {
    const result = sanitizeDate('2026-01-15T10:30:00');
    expect(result).toContain('2026-01-15');
  });

  it('should parse common date formats', () => {
    const result = sanitizeDate('Jan 15, 2026');
    expect(result).toContain('2026');
  });

  it('should return current date for unparseable strings', () => {
    const result = sanitizeDate('not-a-date');
    const now = new Date().toISOString().slice(0, 10);
    expect(result).toContain(now);
  });
});

describe('VALID_STATUSES', () => {
  it('should contain exactly 4 status values', () => {
    expect(VALID_STATUSES).toHaveLength(4);
  });

  it('should include all required statuses', () => {
    expect(VALID_STATUSES).toContain('GOOD_LEAD_FOLLOW_UP');
    expect(VALID_STATUSES).toContain('DID_NOT_CONNECT');
    expect(VALID_STATUSES).toContain('BAD_LEAD');
    expect(VALID_STATUSES).toContain('SALE_DONE');
  });
});

describe('VALID_SOURCES', () => {
  it('should contain exactly 5 source values', () => {
    expect(VALID_SOURCES).toHaveLength(5);
  });

  it('should include all required sources', () => {
    expect(VALID_SOURCES).toContain('leads_on_demand');
    expect(VALID_SOURCES).toContain('meridian_tower');
    expect(VALID_SOURCES).toContain('eden_park');
    expect(VALID_SOURCES).toContain('varah_swamy');
    expect(VALID_SOURCES).toContain('sarjapur_plots');
  });
});

describe('sanitizeCRMRecord', () => {
  const makeRecord = (overrides: Partial<CRMRecord> = {}): CRMRecord => ({
    created_at: '2026-01-15T10:30:00',
    name: 'John Doe',
    email: 'john@test.com',
    country_code: '+91',
    mobile_without_country_code: '9876543210',
    company: 'Acme Corp',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    lead_owner: 'admin@test.com',
    crm_status: 'GOOD_LEAD_FOLLOW_UP',
    crm_note: 'Test note',
    data_source: 'leads_on_demand',
    possession_time: '6 months',
    description: 'Test lead',
    ...overrides,
  });

  it('should pass through valid record fields', () => {
    const record = makeRecord();
    const result = sanitizeCRMRecord(record);

    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@test.com');
    expect(result.city).toBe('Mumbai');
  });

  it('should keep valid crm_status', () => {
    const record = makeRecord({ crm_status: 'SALE_DONE' });
    const result = sanitizeCRMRecord(record);

    expect(result.crm_status).toBe('SALE_DONE');
  });

  it('should reset invalid crm_status to empty string', () => {
    const record = makeRecord({ crm_status: 'INVALID_STATUS' as any });
    const result = sanitizeCRMRecord(record);

    expect(result.crm_status).toBe('');
  });

  it('should keep valid data_source', () => {
    const record = makeRecord({ data_source: 'eden_park' });
    const result = sanitizeCRMRecord(record);

    expect(result.data_source).toBe('eden_park');
  });

  it('should reset invalid data_source to empty string', () => {
    const record = makeRecord({ data_source: 'unknown_source' as any });
    const result = sanitizeCRMRecord(record);

    expect(result.data_source).toBe('');
  });

  it('should handle null fields gracefully', () => {
    const record = makeRecord({
      name: null as any,
      email: undefined as any,
      company: null as any,
    });
    const result = sanitizeCRMRecord(record);

    expect(result.name).toBe('');
    expect(result.email).toBe('');
    expect(result.company).toBe('');
  });

  it('should trim whitespace from all string fields', () => {
    const record = makeRecord({
      name: '  John Doe  ',
      email: '  john@test.com  ',
      city: '  Mumbai  ',
    });
    const result = sanitizeCRMRecord(record);

    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@test.com');
    expect(result.city).toBe('Mumbai');
  });

  it('should produce valid ISO date for created_at', () => {
    const record = makeRecord({ created_at: '2026-06-01' });
    const result = sanitizeCRMRecord(record);

    expect(result.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should fallback to current date for invalid created_at', () => {
    const record = makeRecord({ created_at: 'garbage' });
    const result = sanitizeCRMRecord(record);

    const today = new Date().toISOString().slice(0, 10);
    expect(result.created_at).toContain(today);
  });
});
